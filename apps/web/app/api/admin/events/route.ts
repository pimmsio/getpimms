import { getEvents } from "@/lib/analytics/get-events";
import { withAdmin } from "@/lib/auth";
import { eventsQuerySchema } from "@/lib/zod/schemas/analytics";
import { THE_BEGINNING_OF_TIME } from "@dub/utils";
import { NextResponse } from "next/server";

// GET /api/admin/events – get events for admin (all workspaces)
export const GET = withAdmin(async ({ searchParams }) => {
  try {
    const parsedParams = eventsQuerySchema.parse(searchParams);

    // For admin, DON'T pass workspaceId to get data from ALL workspaces in one query
    const response = await getEvents({
      ...parsedParams,
      workspaceId: undefined, // This is the key - no workspace filter = all data
      folderIds: undefined,
      folderId: "",
      isMegaFolder: false,
      dataAvailableFrom: THE_BEGINNING_OF_TIME,
    });

    return NextResponse.json(response || []);
  } catch (error) {
    console.error("Admin events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events data" },
      { status: 500 }
    );
  }
});
