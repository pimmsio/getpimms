"use server";

import { computeCustomerHotScore } from "@/lib/analytics/compute-customer-hot-score";
import {
  createLeadEventPayload,
  upsertCustomerForLead,
} from "@/lib/api/customers/lead-utils";
import { includeTags } from "@/lib/api/links/include-tags";
import { getClickEvent, recordLead } from "@/lib/tinybird";
import { redis } from "@/lib/upstash";
import { computeAnonymousCustomerFields } from "@/lib/webhook/custom";
import { sendWorkspaceWebhook } from "@/lib/webhook/publish";
import { transformLeadEventData } from "@/lib/webhook/transform";
import { clickEventSchemaTB } from "@/lib/zod/schemas/clicks";
import { prisma } from "@dub/prisma";
import { prismaEdge } from "@dub/prisma/edge";
import { nanoid } from "@dub/utils";
import { z } from "zod";

type ClickData = z.infer<typeof clickEventSchemaTB>;

export async function captureLeadMagnet(
  _prevState: { error: string | null; redirectUrl?: string },
  data: FormData,
) {
  const linkId = String(data.get("linkId") || "");
  const clickId = String(data.get("clickId") || "");
  const email = String(data.get("email") || "")
    .trim()
    .toLowerCase();
  const firstName = String(data.get("firstName") || "").trim();
  const lastName = String(data.get("lastName") || "").trim();

  if (!linkId) return { error: "Missing link." };
  if (!firstName) return { error: "First name is required." };
  if (!email || !email.includes("@")) return { error: "Enter a valid email." };
  if (!clickId) return { error: "Missing click. Please try again." };

  const link = await prismaEdge.link.findUnique({
    where: { id: linkId },
    select: { url: true, leadMagnetEnabled: true, projectId: true },
  });

  if (!link || !link.projectId) return { error: "Link not found." };
  if (!link.leadMagnetEnabled) {
    return { error: null, redirectUrl: link.url };
  }

  const workspaceId = link.projectId;

  const customerName =
    (firstName && lastName && `${firstName} ${lastName}`) ||
    firstName ||
    lastName ||
    null;

  // deduplicate lead events – only record 1 unique event for the same customer and event name
  const ok = await redis.set(
    `trackLead:${workspaceId}:${email}:${linkId}`,
    {
      timestamp: Date.now(),
      clickId,
      eventName: "Opt-in",
      customerExternalId: email,
      customerName,
      customerEmail: email,
    },
    {
      nx: true,
    },
  );

  if (!ok) {
    // Duplicate detected - redirect immediately
    console.log("duplicate lead event detected, redirecting to link URL");
    return { error: null, redirectUrl: link.url };
  }

  // Find click event
  let clickData: ClickData | null = null;
  const clickEvent = await getClickEvent({ clickId });
  if (clickEvent && clickEvent.data && clickEvent.data.length > 0) {
    clickData = clickEvent.data[0];
  }
  console.log("clickData", clickData);

  if (!clickData) {
    const cachedClickData = await redis.get<ClickData>(`clickCache:${clickId}`);

    if (cachedClickData) {
      clickData = {
        ...cachedClickData,
        timestamp: cachedClickData.timestamp.replace("T", " ").replace("Z", ""),
        qr: cachedClickData.qr ? 1 : 0,
        bot: cachedClickData.bot ? 1 : 0,
      };
    }
  }

  if (!clickData) {
    return { error: "Click event not found. Please try again." };
  }

  const leadEventId = nanoid(16);

  // Prefetch anonymous fields using shared util
  const { anonymousId, totalClicks } =
    await computeAnonymousCustomerFields(clickData);

  console.log("anonymousId", anonymousId);
  console.log("totalClicks", totalClicks);

  // Upsert customer
  const customer = await upsertCustomerForLead({
    workspaceId,
    customerExternalId: email,
    finalCustomerName: customerName || email,
    customerEmail: email,
    customerAvatar: null,
    customerName,
    workspaceStripeConnectId: null,
    clickData,
    anonymousId,
    totalClicks,
  });

  console.log("customer upserted", customer);

  // Create lead event payload
  const eventPayload = createLeadEventPayload({
    clickData,
    leadEventId,
    eventName: "Opt-in",
    customerId: customer.id,
  });

  console.log("eventPayload", eventPayload);

  await recordLead(eventPayload);

  const [updatedLink] = await Promise.all([
    // update link leads count
    prisma.link.update({
      where: {
        id: clickData.link_id,
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
        usage: {
          increment: 1,
        },
      },
    }),
  ]);

  // update customer hot score
  if (customer) {
    const hotScore = await computeCustomerHotScore(customer.id, workspaceId);
    console.log("update customer hot score", hotScore);

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        hotScore,
        lastHotScoreAt: new Date(),
      },
    });
  }

  await sendWorkspaceWebhook({
    trigger: "lead.created",
    data: transformLeadEventData({
      ...clickData,
      eventName: "Opt-in",
      link: updatedLink,
      customer,
    }),
    workspace: { id: workspaceId, webhookEnabled: true },
  });

  return { error: null, redirectUrl: link.url };
}
