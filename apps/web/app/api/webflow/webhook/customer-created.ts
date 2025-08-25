import { includeTags } from "@/lib/api/links/include-tags";
import { createPartnerCommission } from "@/lib/partners/create-partner-commission";
import { recordLead } from "@/lib/tinybird";
import { sendWorkspaceWebhook } from "@/lib/webhook/publish";
import { transformLeadEventData } from "@/lib/webhook/transform";
import { prisma } from "@dub/prisma";
import { nanoid } from "@dub/utils";
import { computeAnonymousCustomerFields, getFirstAvailableField } from "@/lib/webhook/custom";
import { Link } from "@prisma/client";

export async function customerCreated(data: any, pimmsId: string, link: Link, clickData: any) {
  const email = getFirstAvailableField(data, ["email"], true);
  const firstName = getFirstAvailableField(data, ["firstname"], true);
  const lastName = getFirstAvailableField(data, ["lastname"], true);
  const fullName = getFirstAvailableField(data, ["fullname", "name"], true);
  
  if (!email || !pimmsId) {
    return "Missing email or pimmsId, skipping...";
  }

  if (!link.projectId) {
    return "Missing projectId, skipping...";
  }

  const name =
    fullName ||
    (firstName && lastName && `${firstName} ${lastName}`) ||
    firstName;

  const { anonymousId, totalClicks, lastEventAt } =
    await computeAnonymousCustomerFields(clickData);

  const customer = await prisma.customer.create({
    data: {
      id: `cus_${nanoid(10)}`,
      name,
      email,
      stripeCustomerId: null,
      projectConnectId: null,
      externalId: email,
      projectId: link.projectId,
      linkId: link.id,
      clickId: pimmsId,
      clickedAt: new Date(clickData.timestamp + "Z"),
      anonymousId,
      totalClicks,
      lastEventAt,
    },
  });

  const leadData = {
    ...clickData,
    event_id: nanoid(16),
    event_name: "New customer",
    customer_id: customer.id,
  };

  const [_lead, linkUpdated, workspace] = await Promise.all([
    recordLead(leadData),
    prisma.link.update({
      where: { id: link.id },
      data: { leads: { increment: 1 } },
      include: includeTags,
    }),
    prisma.project.update({
      where: { id: link.projectId },
      data: { usage: { increment: 1 } },
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

  await sendWorkspaceWebhook({
    trigger: "lead.created",
    workspace,
    data: transformLeadEventData({
      ...clickData,
      eventName: "New customer",
      link: linkUpdated,
      customer,
    }),
  });

  return `Webflow customer created: ${customer.id}`;
}
