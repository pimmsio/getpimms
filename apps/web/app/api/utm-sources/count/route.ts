import { withWorkspace } from "@/lib/auth";
import { getUtmSourcesCountQuerySchema } from "@/lib/zod/schemas/utm-parameters";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// GET /api/utm-sources/count – get the number of UTM sources for a workspace
export const GET = withWorkspace(
  async ({ workspace, searchParams }) => {
    const { search } = getUtmSourcesCountQuerySchema.parse(searchParams);

    const count = await prisma.utmSource.count({
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

