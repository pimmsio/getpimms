/**
 * Unified utilities for customer data retrieval
 * Ensures consistency between hot score calculation and UI
 */

import { getAnonymousUserClicks } from "@/lib/analytics/get-user-clicks";
import { getCustomerEvents } from "@/lib/analytics/get-customer-events";
import type { Customer } from "@dub/prisma/client";

const DEFAULT_LIMIT = 200;

/**
 * Get complete customer data (clicks + conversions) with workspace filtering
 */
export async function getCustomerData(
  customer: Pick<Customer, "id" | "anonymousId" | "clickId">,
  workspaceId: string
): Promise<{ clicks: any[]; conversions: any[] }> {
  
  // Get clicks via anonymousId (same method as UI)
  const clicks = customer.anonymousId 
    ? await getAnonymousUserClicks(customer.anonymousId, DEFAULT_LIMIT, workspaceId)
    : [];

  // Get conversions via customerId  
  const allEvents = await getCustomerEvents(
    { customerId: customer.id, clickId: customer.clickId },
    {
      sortOrder: "desc",
      start: new Date("2021-01-01"),
      end: new Date(),
      dataAvailableFrom: new Date("2021-01-01"),
      interval: "all",
      limit: DEFAULT_LIMIT,
    },
  );
  
  const conversions = allEvents.filter(event => event.event === "lead" || event.event === "sale");

  return { clicks, conversions };
}

/**
 * Get customer data formatted for UI display
 */
export async function getCustomerDataForUI(
  customer: Pick<Customer, "id" | "anonymousId" | "clickId">,
  workspaceId: string
): Promise<any[]> {
  const { clicks, conversions } = await getCustomerData(customer, workspaceId);
  
  // Merge and sort by timestamp
  const allEvents = [...clicks, ...conversions];
  allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  return allEvents;
}

/**
 * Get customer data formatted for hot score calculation
 */
export async function getCustomerDataForScoring(
  customer: Pick<Customer, "id" | "anonymousId" | "clickId">,
  workspaceId: string
): Promise<{ clicks: any[]; conversions: any[] }> {
  return getCustomerData(customer, workspaceId);
}

/**
 * Get click history for UI (same as click-history endpoint)
 */
export async function getCustomerClickHistory(
  customer: Pick<Customer, "id" | "anonymousId" | "clickId">,
  workspaceId: string,
  limit: number = 200
): Promise<any[]> {
  if (!customer.anonymousId) {
    return [];
  }
  
  return getAnonymousUserClicks(customer.anonymousId, limit, workspaceId);
}
