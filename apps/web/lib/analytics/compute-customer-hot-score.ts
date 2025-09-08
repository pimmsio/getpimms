import { getAnonymousUserClicks } from "@/lib/analytics/get-user-clicks";
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
      select: { anonymousId: true },
    });

    if (!customer) {
      return 0;
    }

    console.log("[compute hot score] customer found", customer.anonymousId);

    // Get events for this customer
    const events = await getCustomerEvents(
      { customerId },
      {
        sortOrder: "desc",
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        end: new Date(),
        dataAvailableFrom: new Date("2021-01-01"), // Date object, not string
        interval: "all",
      },
    );

    console.log("[compute hot score] events found", events.length);

    // Get clicks for this customer's anonymousId
    const clicks = customer.anonymousId
      ? await getAnonymousUserClicks(customer.anonymousId, 100, workspaceId)
      : [];

    console.log("[compute hot score] clicks found", clicks.length);

    // Compute the lead score
    const score = computeLeadScore({ clicks, events });

    console.log("[compute hot score] score", score);

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