import { createId } from "@/lib/api/create-id";
import { clickEventSchemaTB } from "@/lib/zod/schemas/clicks";
import { prisma } from "@dub/prisma";
import { nanoid } from "@dub/utils";
import { Customer } from "@prisma/client";
import { z } from "zod";

type ClickData = z.infer<typeof clickEventSchemaTB>;

interface UpsertCustomerParams {
  workspaceId: string;
  customerExternalId: string;
  finalCustomerName: string;
  customerEmail?: string | null;
  customerAvatar?: string | null;
  customerName?: string | null;
  workspaceStripeConnectId: string | null;
  clickData: ClickData;
  anonymousId: string | null;
  totalClicks: number;
}

/**
 * Upsert a customer for lead tracking
 */
export async function upsertCustomerForLead(
  params: UpsertCustomerParams,
): Promise<Customer> {
  const {
    workspaceId,
    customerExternalId,
    finalCustomerName,
    customerEmail,
    customerAvatar,
    customerName,
    workspaceStripeConnectId,
    clickData,
    anonymousId,
    totalClicks,
  } = params;

  return prisma.customer.upsert({
    where: {
      projectId_externalId: {
        projectId: workspaceId,
        externalId: customerExternalId,
      },
    },
    create: {
      id: createId({ prefix: "cus_" }),
      name: finalCustomerName,
      email: customerEmail,
      avatar: customerAvatar,
      externalId: customerExternalId,
      projectId: workspaceId,
      projectConnectId: workspaceStripeConnectId,
      clickId: clickData.click_id,
      linkId: clickData.link_id,
      country: clickData.country,
      clickedAt: new Date(clickData.timestamp + "Z"),
      anonymousId,
      totalClicks,
      lastEventAt: new Date(),
      lastActivityLinkId: clickData.link_id,
      lastActivityType: "lead",
    },
    update: {
      // keep activity fresh for "latest activity" sorting
      lastEventAt: new Date(),
      // keep latest known attribution
      clickId: clickData.click_id,
      linkId: clickData.link_id,
      lastActivityLinkId: clickData.link_id,
      lastActivityType: "lead",
      country: clickData.country,
      // keep identity/click stats aligned
      anonymousId,
      totalClicks,
      // fill missing profile data without overwriting existing
      ...(customerEmail ? { email: customerEmail } : {}),
      ...(customerAvatar ? { avatar: customerAvatar } : {}),
      ...(customerName ? { name: customerName } : {}),
    },
  });
}

interface CreateLeadEventPayloadParams {
  clickData: ClickData;
  leadEventId: string;
  eventName: string;
  customerId: string;
  metadata?: unknown;
  eventQuantity?: number | null;
}

/**
 * Create a lead event payload for tracking
 */
export function createLeadEventPayload(
  params: CreateLeadEventPayloadParams,
): ClickData & {
  event_id: string;
  event_name: string;
  customer_id: string;
  metadata: string;
} | Array<ClickData & {
  event_id: string;
  event_name: string;
  customer_id: string;
  metadata: string;
}> {
  const {
    clickData,
    leadEventId,
    eventName,
    customerId,
    metadata,
    eventQuantity,
  } = params;

  const basePayload = {
    ...clickData,
    event_id: leadEventId,
    event_name: eventName,
    customer_id: customerId,
    metadata: metadata ? JSON.stringify(metadata) : "",
  };

  return eventQuantity
    ? Array(eventQuantity)
        .fill(null)
        .map(() => ({
          ...basePayload,
          event_id: nanoid(16),
        }))
    : basePayload;
}

