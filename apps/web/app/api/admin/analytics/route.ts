import { getAnalytics } from "@/lib/analytics/get-analytics";
import { withAdmin } from "@/lib/auth";
import { analyticsQuerySchema } from "@/lib/zod/schemas/analytics";
import { THE_BEGINNING_OF_TIME } from "@dub/utils";
import { NextResponse } from "next/server";

// GET /api/admin/analytics – get analytics for admin (all workspaces)
export const GET = withAdmin(async ({ searchParams }) => {
  try {
    const parsedParams = analyticsQuerySchema.parse(searchParams);

    // For admin, DON'T pass workspaceId to get data from ALL workspaces in one query
    const response = await getAnalytics({
      ...parsedParams,
      workspaceId: undefined, // This is the key - no workspace filter = all data
      folderIds: undefined,
      isMegaFolder: false,
      dataAvailableFrom: THE_BEGINNING_OF_TIME,
    });

    return NextResponse.json(response || []);
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
});