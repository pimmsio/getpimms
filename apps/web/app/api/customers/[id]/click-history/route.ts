import { getAnonymousUserClicks } from "@/lib/analytics/get-user-clicks";
import { getCustomerOrThrow } from "@/lib/api/customers/get-customer-or-throw";
import { withWorkspace } from "@/lib/auth";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";
import z from "@/lib/zod";

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(500).default(50),
});

// GET /api/customers/[id]/click-history - get click history for a customer
export const GET = withWorkspace(async ({ workspace, params, searchParams }) => {
  const { id: customerId } = params;
  const { limit } = querySchema.parse(searchParams);

  console.log('Getting click history for customer:', customerId);

  const customer = await getCustomerOrThrow({
    workspaceId: workspace.id,
    id: customerId,
  });

  // Try to find anonymousId associated with this customer
  // For now, we'll use the customer's clickId to find their identity_hash
  let anonymousId: string | null = null;
  
  if (customer.clickId) {
    // Query click events to find the identity_hash for this clickId
    const clickEvent = await prisma.$queryRaw`
      SELECT identity_hash 
      FROM ClickEvent 
      WHERE click_id = ${customer.clickId} 
      AND identity_hash IS NOT NULL 
      LIMIT 1
    ` as any[];
    
    if (clickEvent.length > 0) {
      anonymousId = clickEvent[0].identity_hash;
      console.log('Found anonymousId from clickId:', { customerId, anonymousId, clickId: customer.clickId });
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

  // Get all clicks for this anonymous user
  const clickHistory = await getAnonymousUserClicks(anonymousId, limit);

  console.log('Click history retrieved:', { 
    customerId, 
    anonymousId, 
    totalClicks: clickHistory.length 
  });

  return NextResponse.json({
    customer: { id: customer.id, name: customer.name },
    anonymousId,
    totalClicks: clickHistory.length,
    clickHistory,
  });
});
