import { withWorkspace } from "@/lib/auth";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// POST /api/utm/[id]/touch – bump updatedAt to track last usage
export const POST = withWorkspace(
  async ({ params, workspace }) => {
    const { id } = params;

    await prisma.utmTemplate.updateMany({
      where: {
        id,
        projectId: workspace.id,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  },
  {
    requiredPermissions: ["links.write"],
  },
);
