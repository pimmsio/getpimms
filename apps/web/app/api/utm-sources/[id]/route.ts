import { DubApiError } from "@/lib/api/errors";
import { withWorkspace } from "@/lib/auth";
import {
  UtmSourceSchema,
  updateUtmSourceBodySchema,
} from "@/lib/zod/schemas/utm-parameters";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// PATCH /api/utm-sources/[id] – update a UTM source for a workspace
export const PATCH = withWorkspace(
  async ({ req, params, workspace }) => {
    const { id } = params;
    const { name } = updateUtmSourceBodySchema.parse(await req.json());

    const utmSource = await prisma.utmSource.findFirst({
      where: {
        id,
        projectId: workspace.id,
      },
    });

    if (!utmSource) {
      throw new DubApiError({
        code: "not_found",
        message: "UTM source not found.",
      });
    }

    try {
      const response = await prisma.utmSource.update({
        where: {
          id,
        },
        data: {
          name,
        },
      });

      return NextResponse.json(UtmSourceSchema.parse(response));
    } catch (error) {
      if (error.code === "P2002") {
        throw new DubApiError({
          code: "conflict",
          message: "A UTM source with that name already exists.",
        });
      }

      throw error;
    }
  },
  {
    requiredPermissions: ["links.write"],
  },
);

export const PUT = PATCH;

// DELETE /api/utm-sources/[id] – delete a UTM source for a workspace
export const DELETE = withWorkspace(
  async ({ params, workspace }) => {
    const { id } = params;
    try {
      const response = await prisma.utmSource.delete({
        where: {
          id,
          projectId: workspace.id,
        },
      });

      if (!response) {
        throw new DubApiError({
          code: "not_found",
          message: "UTM source not found.",
        });
      }

      return NextResponse.json({ id });
    } catch (error) {
      if (error.code === "P2025") {
        throw new DubApiError({
          code: "not_found",
          message: "UTM source not found.",
        });
      }

      throw error;
    }
  },
  {
    requiredPermissions: ["links.write"],
  },
);

