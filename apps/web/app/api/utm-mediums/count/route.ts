import { withWorkspace } from "@/lib/auth";
import { getUtmMediumsCountQuerySchema } from "@/lib/zod/schemas/utm-parameters";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// GET /api/utm-mediums/count – get the number of UTM mediums for a workspace
export const GET = withWorkspace(
  async ({ workspace, searchParams }) => {
    const { search } = getUtmMediumsCountQuerySchema.parse(searchParams);

    const count = await prisma.utmMedium.count({
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

