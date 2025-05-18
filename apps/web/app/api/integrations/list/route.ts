import { withWorkspace } from "@/lib/auth";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// GET /api/integrations/list - get all integrations
export const GET = withWorkspace(
  async () => {
    const integrations = await prisma.integration.findMany({
      where: {
        verified: true,
      },
      include: {
        _count: {
          select: {
            installations: true,
          },
        },
      },
    });

    return NextResponse.json(integrations);
  },
  {
    requiredPermissions: ["workspaces.read"],
  },
);
