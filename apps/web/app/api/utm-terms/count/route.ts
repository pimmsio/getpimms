import { withWorkspace } from "@/lib/auth";
import { getUtmTermsCountQuerySchema } from "@/lib/zod/schemas/utm-parameters";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// GET /api/utm-terms/count – get the number of UTM terms for a workspace
export const GET = withWorkspace(
  async ({ workspace, searchParams }) => {
    const { search } = getUtmTermsCountQuerySchema.parse(searchParams);

    const count = await prisma.utmTerm.count({
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

