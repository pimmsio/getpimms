import { getAnonymousUserClicks } from "@/lib/analytics/get-user-clicks";
import { getCustomerOrThrow } from "@/lib/api/customers/get-customer-or-throw";
import { withWorkspace } from "@/lib/auth";
import { tb } from "@/lib/tinybird";
import { NextResponse } from "next/server";
import z from "@/lib/zod";

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(500).default(50),
});

// GET /api/customers/[id]/click-history - get click history for a customer
export const GET = withWorkspace(async ({ workspace, params, searchParams }) => {
  const { id: customerId } = params;
  const { limit } = querySchema.parse(searchParams);

  const customer = await getCustomerOrThrow({
    workspaceId: workspace.id,
    id: customerId,
  });

  let anonymousId = customer.anonymousId;
  // If no anonymousId in customer record, try to find it using clickId via Tinybird
  if (!anonymousId && customer.clickId) {
    try {
      const pipe = tb.buildPipe({
        pipe: "get_click_event",
        parameters: z.object({
          clickId: z.string(),
        }),
        data: z.any(),
      });
      const clickEventResponse = await pipe({ clickId: customer.clickId });
      
      if (clickEventResponse.data && clickEventResponse.data.length > 0) {
        const clickData = clickEventResponse.data[0] as any;

        if (clickData.identity_hash) {
          anonymousId = clickData.identity_hash;
        }
      }
    } catch (error) {
      console.error('Error fetching click event from Tinybird:', error);
    }
  }

  if (!anonymousId) {
    console.log('No anonymousId found for customer:', customerId);
    return NextResponse.json({
      customer: { id: customer.id, name: customer.name },
      anonymousId: null,
      clickHistory: [],
      message: "No click history available - anonymous ID not found",
    });
  }

  // Get all clicks for this anonymous user, filtered by workspace
  const clickHistory = await getAnonymousUserClicks(anonymousId, limit, workspace.id);

  return NextResponse.json({
    customer: { id: customer.id, name: customer.name },
    anonymousId,
    totalClicks: clickHistory.length,
    clickHistory,
  });
});
