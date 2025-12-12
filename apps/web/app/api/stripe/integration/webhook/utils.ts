import { createId } from "@/lib/api/create-id";
import { includeTags } from "@/lib/api/links/include-tags";
import { generateRandomName } from "@/lib/names";
import { createPartnerCommission } from "@/lib/partners/create-partner-commission";
import { getClickEvent, recordLead } from "@/lib/tinybird";
import { computeAnonymousCustomerFields } from "@/lib/webhook/custom";
import { sendWorkspaceWebhook } from "@/lib/webhook/publish";
import { computeCustomerHotScore } from "@/lib/analytics/compute-customer-hot-score";
import { transformLeadEventData } from "@/lib/webhook/transform";
import { prisma } from "@dub/prisma";
import { nanoid } from "@dub/utils";
import { waitUntil } from "@vercel/functions";
import type Stripe from "stripe";

export async function createNewCustomer(event: Stripe.Event) {
  const stripeCustomer = event.data.object as Stripe.Customer;
  const stripeAccountId = event.account as string;
  const pimmsCustomerExternalId = stripeCustomer.metadata?.pimmsCustomerId;
  const clickId = stripeCustomer.metadata?.pimmsClickId;

  // The client app should always send pimmsClickId (pimms_id) via metadata
  if (!clickId) {
    return "Click ID not found in Stripe customer metadata, skipping...";
  }

  // Find click
  const clickEvent = await getClickEvent({ clickId });
  if (!clickEvent || clickEvent.data.length === 0) {
    return `Click event with ID ${clickId} not found, skipping...`;
  }

  const clickData = clickEvent.data[0];

  // Find link
  const linkId = clickData.link_id;
  const link = await prisma.link.findUnique({
    where: {
      id: linkId,
    },
  });

  if (!link || !link.projectId) {
    return `Link with ID ${linkId} not found or does not have a project, skipping...`;
  }

  const workspaceId = link.projectId;

  // Create a new customer
  const { anonymousId, totalClicks } =
    await computeAnonymousCustomerFields(clickData);

  const customer = await prisma.customer.create({
    data: {
      id: createId({ prefix: "cus_" }),
      name: stripeCustomer.name || generateRandomName(),
      email: stripeCustomer.email,
      stripeCustomerId: stripeCustomer.id,
      projectConnectId: stripeAccountId,
      externalId: pimmsCustomerExternalId,
      projectId: workspaceId,
      linkId,
      clickId,
      clickedAt: new Date(clickData.timestamp + "Z"),
      country: clickData.country,
      anonymousId,
      totalClicks,
      lastEventAt: new Date(),
    },
  });

  const eventName = "New customer";

  const leadData = {
    ...clickData,
    event_id: nanoid(16),
    event_name: eventName,
    customer_id: customer.id,
  };

  const [_lead, linkUpdated, workspace] = await Promise.all([
    // Record lead
    recordLead(leadData),

    // update link leads count
    prisma.link.update({
      where: {
        id: linkId,
      },
      data: {
        leads: {
          increment: 1,
        },
      },
      include: includeTags,
    }),

    // update workspace usage
    prisma.project.update({
      where: {
        id: workspaceId,
      },
      data: {
        eventsUsage: {
          increment: 1,
        },
        totalEvents: {
          increment: 1,
        },
      },
    }),
  ]);

  if (link.programId && link.partnerId) {
    await createPartnerCommission({
      event: "lead",
      programId: link.programId,
      partnerId: link.partnerId,
      linkId: link.id,
      eventId: leadData.event_id,
      customerId: customer.id,
      quantity: 1,
    });
  }

  waitUntil(
    (async () => {
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          hotScore: await computeCustomerHotScore(customer.id, workspaceId),
          lastHotScoreAt: new Date(),
        },
      });

      await sendWorkspaceWebhook({
        trigger: "lead.created",
        workspace,
        data: transformLeadEventData({
          ...clickData,
          eventName,
          link: linkUpdated,
          customer,
        }),
      });
    })(),
  );

  return `New PIMMS customer created: ${customer.id}. Lead event recorded: ${leadData.event_id}`;
}
