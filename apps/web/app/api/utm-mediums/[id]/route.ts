import { DubApiError } from "@/lib/api/errors";
import { withWorkspace } from "@/lib/auth";
import {
  UtmMediumSchema,
  updateUtmMediumBodySchema,
} from "@/lib/zod/schemas/utm-parameters";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// PATCH /api/utm-mediums/[id] – update a UTM medium for a workspace
export const PATCH = withWorkspace(
  async ({ req, params, workspace }) => {
    const { id } = params;
    const { name } = updateUtmMediumBodySchema.parse(await req.json());

    const utmMedium = await prisma.utmMedium.findFirst({
      where: {
        id,
        projectId: workspace.id,
      },
    });

    if (!utmMedium) {
      throw new DubApiError({
        code: "not_found",
        message: "UTM medium not found.",
      });
    }

    try {
      const response = await prisma.utmMedium.update({
        where: {
          id,
        },
        data: {
          name,
        },
      });

      return NextResponse.json(UtmMediumSchema.parse(response));
    } catch (error) {
      if (error.code === "P2002") {
        throw new DubApiError({
          code: "conflict",
          message: "A UTM medium with that name already exists.",
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

// DELETE /api/utm-mediums/[id] – delete a UTM medium for a workspace
export const DELETE = withWorkspace(
  async ({ params, workspace }) => {
    const { id } = params;
    try {
      const response = await prisma.utmMedium.delete({
        where: {
          id,
          projectId: workspace.id,
        },
      });

      if (!response) {
        throw new DubApiError({
          code: "not_found",
          message: "UTM medium not found.",
        });
      }

      return NextResponse.json({ id });
    } catch (error) {
      if (error.code === "P2025") {
        throw new DubApiError({
          code: "not_found",
          message: "UTM medium not found.",
        });
      }

      throw error;
    }
  },
  {
    requiredPermissions: ["links.write"],
  },
);

