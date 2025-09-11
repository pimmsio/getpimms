import { getCustomerEvents } from "@/lib/analytics/get-customer-events";
import { computeLeadScore } from "@/lib/analytics/lead-scoring";
import { prisma } from "@dub/prisma";

export async function computeCustomerHotScore(
  customerId: string,
  workspaceId: string,
): Promise<number> {
  try {
    // Get customer data
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { anonymousId: true, clickId: true },
    });

    if (!customer) {
      return 0;
    }

    console.log("[compute hot score] customer found", {
      customerId,
      anonymousId: customer.anonymousId,
      clickId: customer.clickId
    });

    // Get all events for this customer (includes clicks, leads, and sales)
    const allEvents = await getCustomerEvents(
      { customerId, clickId: customer.clickId },
      {
        sortOrder: "desc",
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        end: new Date(),
        dataAvailableFrom: new Date("2021-01-01"), // Date object, not string
        interval: "all",
      },
    );

    console.log("[compute hot score] all events found", allEvents.length);
    console.log("[compute hot score] event breakdown:", {
      clicks: allEvents.filter(e => e.event === "click").length,
      leads: allEvents.filter(e => e.event === "lead").length,
      sales: allEvents.filter(e => e.event === "sale").length,
      other: allEvents.filter(e => !["click", "lead", "sale"].includes(e.event)).length
    });

    // Log sample events for debugging
    if (allEvents.length > 0) {
      console.log("[compute hot score] sample events:", allEvents.slice(0, 3).map(e => ({
        event: e.event,
        timestamp: e.timestamp,
        clickId: e.click?.id,
        eventName: e.eventName
      })));
    }

    // Separate clicks from conversion events
    const clicks = allEvents.filter(event => event.event === "click");
    const conversionEvents = allEvents.filter(event => event.event === "lead" || event.event === "sale");

    console.log("[compute hot score] separated data:", {
      clicks: clicks.length,
      conversionEvents: conversionEvents.length,
      clickTimestamps: clicks.map(c => c.timestamp),
      conversionTimestamps: conversionEvents.map(e => e.timestamp)
    });

    // Compute the lead score using separated data
    const score = computeLeadScore({ clicks, events: conversionEvents });

    console.log("[compute hot score] final score", score);

    return Math.round(score);
  } catch (error) {
    console.error("Error computing customer hot score:", error);
    return 0;
  }
}

export function computeCustomerTier(score: number) {
  if (score >= 75) {
    return 3;
  }

  if (score >= 50) {
    return 2;
  }

  if (score >= 25) {
    return 1;
  }

  return 0;
}