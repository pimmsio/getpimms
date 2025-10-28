import { withWorkspace } from "@/lib/auth";
import { getUtmCampaignsCountQuerySchema } from "@/lib/zod/schemas/utm-parameters";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// GET /api/utm-campaigns/count – get the number of UTM campaigns for a workspace
export const GET = withWorkspace(
  async ({ workspace, searchParams }) => {
    const { search } = getUtmCampaignsCountQuerySchema.parse(searchParams);

    const count = await prisma.utmCampaign.count({
      where: {
        projectId: workspace.id,
        ...(search && {
          name: {
            contains: search,
          },
        }),
      },
    });

    return NextResponse.json(count);
  },
  {
    requiredPermissions: ["links.read"],
  },
);

