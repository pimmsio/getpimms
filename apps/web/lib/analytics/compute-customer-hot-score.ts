import { computeLeadScore } from "@/lib/analytics/lead-scoring";
import { getCustomerDataForScoring } from "@/lib/analytics/utils/customer-data";
import { prisma } from "@dub/prisma";

export async function computeCustomerHotScore(
  customerId: string,
  workspaceId: string,
): Promise<number> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { 
        id: true,
        anonymousId: true, 
        clickId: true,
        hotScore: true,
      },
    });

    if (!customer) {
      return 0;
    }

    const { clicks, conversions } = await getCustomerDataForScoring(customer, workspaceId);
    
    if (clicks.length === 0 && conversions.length === 0) {
      return 0;
    }

    const score = computeLeadScore({ clicks, events: conversions });
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