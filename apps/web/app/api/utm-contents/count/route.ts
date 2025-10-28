import { withWorkspace } from "@/lib/auth";
import { getUtmContentsCountQuerySchema } from "@/lib/zod/schemas/utm-parameters";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// GET /api/utm-contents/count – get the number of UTM contents for a workspace
export const GET = withWorkspace(
  async ({ workspace, searchParams }) => {
    const { search } = getUtmContentsCountQuerySchema.parse(searchParams);

    const count = await prisma.utmContent.count({
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

