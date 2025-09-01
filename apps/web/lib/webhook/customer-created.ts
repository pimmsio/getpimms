import { computeCustomerHotScore } from "@/lib/analytics/compute-customer-hot-score";
import { includeTags } from "@/lib/api/links/include-tags";
import { createPartnerCommission } from "@/lib/partners/create-partner-commission";
import { getClickEvent, recordLead } from "@/lib/tinybird";
import {
  computeAnonymousCustomerFields,
  getFirstAvailableField,
} from "@/lib/webhook/custom";
import { sendWorkspaceWebhook } from "@/lib/webhook/publish";
import { transformLeadEventData } from "@/lib/webhook/transform";
import { clickEventSchemaTB } from "@/lib/zod/schemas/clicks";
import { prisma } from "@dub/prisma";
import { nanoid } from "@dub/utils";
import { Link } from "@prisma/client";
import { waitUntil } from "@vercel/functions";
import { z } from "zod";
import { generateRandomName } from "../names";
import { WebhookError } from "./utils";

type ClickData = z.infer<typeof clickEventSchemaTB>;

export type CustomerCreatedData = {
  clickData: ClickData;
  link: Link;
  workspaceId: string;
  pimmsId: string;
  email: string;
  name: string;
  countryCode: string | undefined;
};

export async function getCustomerData(
  data: Record<string, any>,
  pimmsId: string | null,
  link: Link,
  clickData: ClickData,
): Promise<CustomerCreatedData> {
  const email = getFirstAvailableField(data, ["email"], true);
  const firstName = getFirstAvailableField(data, ["firstname", "prenom"], true);
  const lastName = getFirstAvailableField(data, ["lastname", "nom"], true);
  const fullName = getFirstAvailableField(
    data,
    ["fullname", "name", "nom"],
    true,
  );

  console.log("email", email);

  if (!email || !pimmsId) {
    throw new WebhookError("Missing email or pimmsId, skipping...", 200);
  }

  if (!link.projectId) {
    throw new WebhookError("Missing projectId, skipping...", 200);
  }

  const workspaceId = link.projectId;

  const name = getName(firstName, lastName, fullName);

  return {
    clickData,
    link,
    workspaceId,
    pimmsId,
    email,
    name,
    countryCode: undefined,
  };
}

export const getName = (
  firstName: string | null,
  lastName: string | null,
  fullName: string | null,
) => {
  return (
    (firstName && lastName && `${firstName} ${lastName}`) ||
    fullName ||
    firstName ||
    lastName ||
    generateRandomName()
  );
};

export const customerCreated = async (
  customerData: CustomerCreatedData
) => {
  const { clickData, link, workspaceId, pimmsId, email, name, countryCode } = customerData;
  
  const { anonymousId, totalClicks } =
    await computeAnonymousCustomerFields(clickData);

  const linkId = link.id;

  const customer = await prisma.customer.create({
    data: {
      id: `cus_${nanoid(10)}`,
      name,
      email,
      stripeCustomerId: null,
      projectConnectId: null,
      externalId: email,
      projectId: workspaceId,
      linkId,
      clickId: pimmsId,
      clickedAt: new Date(clickData.timestamp + "Z"),
      ...(countryCode ? { country: countryCode } : {}),
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

  const [, linkUpdated, workspace] = await Promise.all([
    recordLead(leadData),
    prisma.link.update({
      where: { id: linkId },
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
      linkId,
      eventId: leadData.event_id,
      customerId: customer.id,
      quantity: 1,
    });
  }

  waitUntil(
    (async () => {
      // update customer hot score
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
          eventName: "New lead",
          link: linkUpdated,
          customer,
        }),
      });
    })(),
  );

  return `Customer created: ${customer.id}`;
};
