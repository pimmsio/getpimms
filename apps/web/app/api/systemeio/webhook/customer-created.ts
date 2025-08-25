import { URL } from "url";
import { prisma } from "@dub/prisma";
import { generateRandomName } from "@/lib/names";
import { nanoid } from "@dub/utils";
import { createPartnerCommission } from "@/lib/partners/create-partner-commission";
import { sendWorkspaceWebhook } from "@/lib/webhook/publish";
import { recordLead } from "@/lib/tinybird";
import { transformLeadEventData } from "@/lib/webhook/transform";
import { includeTags } from "@/lib/api/links/include-tags";
import { getClickEvent } from "@/lib/tinybird";
import { computeAnonymousCustomerFields } from "@/lib/webhook/custom";

export async function customerCreated(body: any) {
  const contact = body.contact;
  const email = contact.email;
  const fields = contact.fields || [];

  const getField = (slug: string) =>
    fields.find((f: any) => f.slug === slug)?.value;

  const countryCode = (getField("country") || "FR").toUpperCase();

  // 1. Prioritize pimms_id from sourceURL
  let clickId: string | null = null;

  try {
    const sourceURL = contact.sourceURL;
    if (sourceURL) {
      const url = new URL(sourceURL);
      clickId = url.searchParams.get("pimms_id");
    }
  } catch (_) {}

  // 2. Fallback to pimms_id field
  if (!clickId) {
    clickId = getField("pimms_id");
  }

  if (!clickId) return "Missing pimms_id, skipping...";

  // 3. Build full name
  const firstName = getField("first_name");
  const lastName = getField("last_name"); // not 'surname'

  const fullName =
    (firstName && lastName && `${firstName} ${lastName}`) ||
    firstName ||
    generateRandomName();

  const clickEvent = await getClickEvent({ clickId });

  if (!clickEvent || clickEvent.data.length === 0) {
    return `Click event with ID ${clickId} not found, skipping...`;
  }

  const clickData = clickEvent.data[0];
  const linkId = clickData.link_id;

  const link = await prisma.link.findUnique({ where: { id: linkId } });
  if (!link || !link.projectId) return "Invalid link or project";

  const { anonymousId, totalClicks, lastEventAt } =
    await computeAnonymousCustomerFields(clickData);

  const customer = await prisma.customer.create({
    data: {
      id: `cus_${nanoid(10)}`,
      name: fullName,
      email,
      stripeCustomerId: null,
      projectConnectId: null,
      externalId: contact.id.toString(),
      projectId: link.projectId,
      linkId,
      clickId,
      clickedAt: new Date(clickData.timestamp + "Z"),
      country: countryCode,
      anonymousId,
      totalClicks,
      lastEventAt,
    },
  });

  const leadData = {
    ...clickData,
    event_id: nanoid(16),
    event_name: "New lead",
    customer_id: customer.id,
  };

  const [_lead, linkUpdated, workspace] = await Promise.all([
    recordLead(leadData),
    prisma.link.update({
      where: { id: linkId },
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
      linkId,
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
      eventName: "New lead",
      link: linkUpdated,
      customer,
    }),
  });

  return `Systeme.io lead created: ${customer.id}`;
}
