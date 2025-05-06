import { createId } from "@/lib/api/create-id";
import { includeTags } from "@/lib/api/links/include-tags";
import { notifyPartnerSale } from "@/lib/api/partners/notify-partner-sale";
import { createPartnerCommission } from "@/lib/partners/create-partner-commission";
import { getClickEvent, recordLead, recordSale } from "@/lib/tinybird";
import { redis } from "@/lib/upstash";
import { sendWorkspaceWebhook } from "@/lib/webhook/publish";
import {
  transformLeadEventData,
  transformSaleEventData,
} from "@/lib/webhook/transform";
import { prisma } from "@dub/prisma";
import { nanoid } from "@dub/utils";
import { waitUntil } from "@vercel/functions";

export async function saleCreated(body: any) {
  const externalId = body?.customer?.id?.toString();
  const sourceUrl = body?.customer?.sourceUrl;
  const clickId = sourceUrl ? new URL(sourceUrl).searchParams.get("pimms_id") : null;
  const customerEmail = body?.customer?.email;
  const customerName =
    body?.customer?.fields?.full_name?.trim() ||
    [body?.customer?.fields?.first_name, body?.customer?.fields?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

  console.log("externalId", externalId);
  console.log("clickId", clickId);
  console.log("customerEmail", customerEmail);
  console.log("customerName", customerName);

  if (!externalId || !clickId) {
    return "Missing customer.id or pimms_id, skipping...";
  }

  const clickEvent = await getClickEvent({ clickId }).then((res) => res.data[0]);
  if (!clickEvent) {
    return `Click event with ID ${clickId} not found, skipping...`;
  }

  const linkId = clickEvent.link_id;
  const link = await prisma.link.findUnique({ where: { id: linkId } });
  if (!link || !link.projectId) return "Link or project not found, skipping...";

  const workspace = await prisma.project.findUnique({
    where: { id: link.projectId },
    select: { id: true },
  });

  if (!workspace) {
    return "Workspace not found, skipping...";
  }

  let customer;
  let existingCustomer = await prisma.customer.findFirst({
    where: {
      projectId: workspace.id,
      OR: [
        { externalId },
        { email: customerEmail },
      ],
    },
  });

  const payload = {
    name: customerName,
    email: customerEmail,
    externalId,
    projectId: workspace.id,
    clickId,
    linkId,
    country: clickEvent.country,
    clickedAt: new Date(clickEvent.timestamp + "Z"),
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

  const { timestamp, ...clickData } = clickEvent;
  const leadEvent = {
    ...clickData,
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

  const amount = body?.order?.totalPrice || 0;
  const currency = body?.pricePlan?.currency;
  const paymentProcessor = body?.customer?.paymentProcessor || "custom";
  const eventId = nanoid(16);

  const saleData = {
    ...clickData,
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

  waitUntil(
    (async () => {
      if (!existingCustomer) {
        await sendWorkspaceWebhook({
          trigger: "lead.created",
          workspace: updatedWorkspace,
          data: transformLeadEventData({
            ...clickData,
            eventName: "Register",
            link: linkUpdated,
            customer,
          }),
        });
      }

      await sendWorkspaceWebhook({
        trigger: "sale.created",
        workspace: updatedWorkspace,
        data: transformSaleEventData({
          ...saleData,
          clickedAt: customer.clickedAt || customer.createdAt,
          link: linkUpdated,
          customer,
        }),
      });
    })(),
  );

  return `Systeme.io sale recorded for customer ${customer.id} on invoice ${invoiceId}`;
}