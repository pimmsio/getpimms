import { computeCustomerHotScore, computeCustomerTier } from "@/lib/analytics/compute-customer-hot-score";
import { getCustomerEvents } from "@/lib/analytics/get-customer-events";
import { getCustomerOrThrow } from "@/lib/api/customers/get-customer-or-throw";
import { decodeLinkIfCaseSensitive } from "@/lib/api/links/case-sensitivity";
import { withWorkspace } from "@/lib/auth";
import { verifyFolderAccess } from "@/lib/folder/permissions";
import { customerActivityResponseSchema } from "@/lib/zod/schemas/customer-activity";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// GET /api/customers/[id]/activity - get a customer's activity
export const GET = withWorkspace(async ({ workspace, params, session }) => {
  const { id: customerId } = params;

  let customer = await getCustomerOrThrow({
    workspaceId: workspace.id,
    id: customerId,
  });

  if (!customer.linkId) {
    return NextResponse.json(
      customerActivityResponseSchema.parse({
        customer,
        events: [],
        ltv: 0,
        timeToLead: null,
        timeToSale: null,
        link: null,
      }),
    );
  }

  // Live recompute hot score when accessing customer details (max once per day)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (
    !customer.lastHotScoreAt ||
    new Date(customer.lastHotScoreAt) < oneDayAgo
  ) {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        hotScore: await computeCustomerHotScore(customer.id, workspace.id),
        lastHotScoreAt: new Date(),
      },
    });
  }

  let [events, link] = await Promise.all([
    getCustomerEvents(
      { customerId: customer.id, clickId: customer.clickId },
      {
        sortOrder: "desc",
        interval: "1y",
      },
    ),

    prisma.link.findUniqueOrThrow({
      where: {
        id: customer.linkId!,
      },
      select: {
        id: true,
        domain: true,
        key: true,
        shortLink: true,
        folderId: true,
      },
    }),
  ]);

  if (link.folderId) {
    await verifyFolderAccess({
      workspace,
      userId: session.user.id,
      folderId: link.folderId,
      requiredPermission: "folders.read",
    });
  }

  link = decodeLinkIfCaseSensitive(link);

  // Find the LTV of the customer
  // TODO: Calculate this from all events, not limited
  const ltv = events.reduce((acc, event) => {
    if (event.event === "sale" && event.saleAmount) {
      acc += Number(event.saleAmount);
    }

    return acc;
  }, 0);

  // Find the time to lead of the customer
  const timeToLead =
    customer.clickedAt && customer.createdAt
      ? customer.createdAt.getTime() - customer.clickedAt.getTime()
      : null;

  // Find the time to first sale of the customer
  // TODO: Calculate this from all events, not limited
  const firstSale = events.filter(({ event }) => event === "sale").pop();

  const timeToSale =
    firstSale && customer.createdAt
      ? new Date(firstSale.timestamp).getTime() - customer.createdAt.getTime()
      : null;

  const currentScore = customer.hotScore;
  const lastScoreAt = customer.lastHotScoreAt;

  const hot = {
    score: currentScore,
    tier: computeCustomerTier(currentScore),
    isHot: currentScore >= 50,
    reasons: [], // Will be populated by the scoring function in future iterations
    hotWindows: [], // Simplified for stored scores
    lastHotScoreAt: lastScoreAt, // Show when score was last calculated
  };

  return NextResponse.json(
    customerActivityResponseSchema.parse({
      ltv,
      timeToLead,
      timeToSale,
      events,
      link,
      hot,
    }),
  );
});
