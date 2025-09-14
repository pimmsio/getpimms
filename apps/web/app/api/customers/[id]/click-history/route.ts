import { getCustomerClickHistory } from "@/lib/analytics/utils/customer-data";
import { getCustomerOrThrow } from "@/lib/api/customers/get-customer-or-throw";
import { withWorkspace } from "@/lib/auth";
import { tb } from "@/lib/tinybird";
import { NextResponse } from "next/server";
import z from "@/lib/zod";

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(500).default(200),
});

// GET /api/customers/[id]/click-history - get click history for a customer
export const GET = withWorkspace(async ({ workspace, params, searchParams }) => {
  const { id: customerId } = params;
  const { limit } = querySchema.parse(searchParams);

  const customer = await getCustomerOrThrow({
    workspaceId: workspace.id,
    id: customerId,
  });

  const clickHistory = await getCustomerClickHistory(customer, workspace.id, limit);

  return NextResponse.json({
    customer: { id: customer.id, name: customer.name },
    anonymousId: customer.anonymousId,
    totalClicks: clickHistory.length,
    clickHistory,
  });
});
