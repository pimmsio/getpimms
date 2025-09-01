import { computeCustomerHotScore } from "@/lib/analytics/compute-customer-hot-score";
import { createId } from "@/lib/api/create-id";
import { includeTags } from "@/lib/api/links/include-tags";
import { notifyPartnerSale } from "@/lib/api/partners/notify-partner-sale";
import { createPartnerCommission } from "@/lib/partners/create-partner-commission";
import { recordLead, recordSale } from "@/lib/tinybird";
import { redis } from "@/lib/upstash";
import {
  computeAnonymousCustomerFields,
  findLink,
  findWorkspace,
  getClickData,
  getWorkspaceIdFromLink,
} from "@/lib/webhook/custom";
import { sendWorkspaceWebhook } from "@/lib/webhook/publish";
import {
  transformLeadEventData,
  transformSaleEventData,
} from "@/lib/webhook/transform";
import { WebhookError } from "@/lib/webhook/utils";
import { prisma } from "@dub/prisma";
import { nanoid } from "@dub/utils";
import { waitUntil } from "@vercel/functions";

export async function customSaleCreated(body: any) {
  const externalId = body?.customer?.id?.toString();
  const clickId = getClickId(body);
  const customerEmail = body?.customer?.email;
  const customerName = getCustomerName(body);

  console.log("externalId", externalId);
  console.log("customerEmail", customerEmail);
  console.log("customerName", customerName);

  if (!externalId) {
    throw new WebhookError("Missing customer.id, skipping...", 200);
  }

  const clickData = await getClickData(clickId);

  const linkId = clickData.link_id;
  const link = await findLink(linkId);
  const workspaceId = await getWorkspaceIdFromLink(link);

  // Check if workspace exists
  await findWorkspace(workspaceId);

  let customer;
  let existingCustomer = await prisma.customer.findFirst({
    where: {
      projectId: workspaceId,
      OR: [{ externalId }, { email: customerEmail }],
    },
  });

  const { anonymousId, totalClicks } =
    await computeAnonymousCustomerFields(clickData);

  const payload = {
    name: customerName,
    email: customerEmail,
    externalId,
    projectId: workspaceId,
    clickId,
    linkId,
    country: clickData.country,
    clickedAt: new Date(clickData.timestamp + "Z"),
    anonymousId,
    totalClicks,
    lastEventAt: new Date(),
  };

  if (existingCustomer) {
    customer = await prisma.customer.update({
      where: { id: existingCustomer.id },
      data: payload,
    });
  } else {
    customer = await prisma.customer.create({
      data: { id: createId({ prefix: "cus_" }), ...payload },
    });
  }

  console.log("customer", customer);

  const { timestamp, ...clickDataWithoutTimestamp } = clickData;
  const leadEvent = {
    ...clickDataWithoutTimestamp,
    event_id: nanoid(16),
    event_name: "Register",
    customer_id: customer.id,
    metadata: "",
  };

  if (!existingCustomer) {
    console.log("lead does not exist, recording...");
    await recordLead(leadEvent);
  }

  const invoiceId = body?.order?.id?.toString();
  if (!invoiceId) {
    return "Missing order ID";
  }

  const ok = await redis.set(`pimms_sale_events:invoiceId:${invoiceId}`, 1, {
    ex: 60 * 60 * 24 * 7,
    nx: true,
  });

  if (!ok) {
    return `Invoice with ID ${invoiceId} already processed, skipping...`;
  }

  const amount = body?.order?.totalPrice || 0;
  const currency = body?.pricePlan?.currency;
  const paymentProcessor = body?.customer?.paymentProcessor || "custom";
  const eventId = nanoid(16);

  const saleData = {
    ...clickDataWithoutTimestamp,
    event_id: eventId,
    event_name: "Purchase",
    payment_processor: paymentProcessor,
    amount,
    currency,
    invoice_id: invoiceId,
    customer_id: customer.id,
    metadata: JSON.stringify(body),
  };

  const [_sale, linkUpdated, updatedWorkspace] = await Promise.all([
    recordSale(saleData),
    prisma.link.update({
      where: { id: linkId },
      data: {
        ...(existingCustomer ? {} : { leads: { increment: 1 } }),
        sales: { increment: 1 },
        saleAmount: { increment: amount },
      },
      include: includeTags,
    }),
    prisma.project.update({
      where: { id: customer.projectId },
      data: {
        usage: { increment: existingCustomer ? 1 : 2 },
        salesUsage: { increment: amount },
      },
    }),
  ]);

  if (link.programId && link.partnerId) {
    const commission = await createPartnerCommission({
      event: "sale",
      programId: link.programId,
      partnerId: link.partnerId,
      linkId,
      eventId,
      customerId: customer.id,
      amount,
      quantity: 1,
      invoiceId,
      currency,
    });

    if (commission) {
      waitUntil(notifyPartnerSale({ link, commission }));
    }
  }

  console.log("DEBUG saleData timestamp fields:", {
    clickedAt: customer.clickedAt,
    createdAt: customer.createdAt,
  });

  waitUntil(
    (async () => {
      if (!existingCustomer) {
        await sendWorkspaceWebhook({
          trigger: "lead.created",
          workspace: updatedWorkspace,
          data: transformLeadEventData({
            ...clickDataWithoutTimestamp, // does not contain timestamp
            timestamp: clickData.timestamp,
            eventName: "Register",
            link: linkUpdated,
            customer,
          }),
        });

        console.log("lead created webhook sent");
      }

      // update customer hot score
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          hotScore: await computeCustomerHotScore(customer.id, workspaceId),
          lastHotScoreAt: new Date(),
        },
      });

      await sendWorkspaceWebhook({
        trigger: "sale.created",
        workspace: updatedWorkspace,
        data: transformSaleEventData({
          ...saleData, // does not contain timestamp but we pass it in clickedAt
          clickedAt: customer.clickedAt || customer.createdAt,
          link: linkUpdated,
          customer,
        }),
      });

      console.log("sale created webhook sent");
    })(),
  );

  return `Systeme.io sale recorded for customer ${customer.id} on invoice ${invoiceId}`;
}

const getClickId = (body: any) => {
  const sourceUrl = body?.customer?.sourceUrl;

  let clickId: string | null = null;

  try {
    const url = new URL(sourceUrl);
    clickId = url.searchParams.get("pimms_id");
  } catch (_) {}

  if (!clickId) {
    throw new WebhookError("Missing pimms_id, skipping...", 200);
  }

  console.log("clickId", clickId);

  return clickId;
};

const getCustomerName = (body: any) => {
  return (
    body?.customer?.fields?.full_name?.trim() ||
    [body?.customer?.fields?.first_name, body?.customer?.fields?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim()
  );
};
