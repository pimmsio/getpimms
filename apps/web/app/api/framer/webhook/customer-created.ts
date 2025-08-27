import { computeCustomerHotScore } from "@/lib/analytics/compute-customer-hot-score";
import { includeTags } from "@/lib/api/links/include-tags";
import { createPartnerCommission } from "@/lib/partners/create-partner-commission";
import { recordLead } from "@/lib/tinybird";
import {
  computeAnonymousCustomerFields,
  getFirstAvailableField,
} from "@/lib/webhook/custom";
import { clickEventSchemaTB } from "@/lib/zod/schemas/clicks";
import { prisma } from "@dub/prisma";
import { nanoid } from "@dub/utils";
import { Link } from "@prisma/client";
import { waitUntil } from "@vercel/functions";
import { z } from "zod";

type ClickData = z.infer<typeof clickEventSchemaTB>;

export async function customerCreated(data: any, pimmsId: string, link: Link, clickData: ClickData) {
  const email = getFirstAvailableField(data, ["email"], true);
  const firstName = getFirstAvailableField(data, ["firstname"], true);
  const lastName = getFirstAvailableField(data, ["lastname"], true);
  const fullName = getFirstAvailableField(data, ["fullname", "name"], true);
  
  console.log("email", email);

  if (!email || !pimmsId) {
    return "Missing email or pimmsId, skipping...";
  }

  if (!link.projectId) {
    return "Missing projectId, skipping...";
  }

  const workspaceId = link.projectId;

  const name =
    fullName ||
    (firstName && lastName && `${firstName} ${lastName}`) ||
    firstName;

  const { anonymousId, totalClicks } =
    await computeAnonymousCustomerFields(clickData);

  const customer = await prisma.customer.create({
    data: {
      id: `cus_${nanoid(10)}`,
      name,
      email,
      stripeCustomerId: null,
      projectConnectId: null,
      externalId: email,
      projectId: workspaceId,
      linkId: link.id,
      clickId: pimmsId,
      clickedAt: new Date(clickData.timestamp + "Z"),
      anonymousId,
      totalClicks,
      lastEventAt: new Date(),
    },
  });

  const leadData = {
    ...clickData,
    event_id: nanoid(16),
    event_name: "New lead",
    customer_id: customer.id,
  };

  await Promise.all([
    recordLead(leadData),
    prisma.link.update({
      where: { id: link.id },
      data: { leads: { increment: 1 } },
      include: includeTags,
    }),
    prisma.project.update({
      where: { id: workspaceId },
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

  waitUntil(
    (async () => {
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          hotScore: await computeCustomerHotScore(customer.id, workspaceId),
          lastHotScoreAt: new Date(),
        },
      });
    })(),
  );

  return `Webflow customer created: ${customer.id}`;
}
