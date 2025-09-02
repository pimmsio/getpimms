import { withWorkspace } from "@/lib/auth";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// GET /api/workspaces/[idOrSlug]/webhook-errors – get webhook errors for a specific workspace
export const GET = withWorkspace(async ({ workspace }) => {
  try {
    // Get webhook errors with missing PIMMS ID from the last two weeks
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const errors = await prisma.webhookError.findMany({
      where: {
        projectId: workspace.id,
        hasPimmsId: false,
        createdAt: {
          gte: twoWeeksAgo,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      select: {
        id: true,
        url: true,
        hasPimmsId: true,
        failedReason: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      errors,
    });
  } catch (error) {
    console.error("Failed to fetch webhook errors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
