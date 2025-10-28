import { DubApiError } from "@/lib/api/errors";
import { withWorkspace } from "@/lib/auth";
import {
  UtmContentSchema,
  updateUtmContentBodySchema,
} from "@/lib/zod/schemas/utm-parameters";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// PATCH /api/utm-contents/[id] – update a UTM content for a workspace
export const PATCH = withWorkspace(
  async ({ req, params, workspace }) => {
    const { id } = params;
    const { name } = updateUtmContentBodySchema.parse(await req.json());

    const utmContent = await prisma.utmContent.findFirst({
      where: {
        id,
        projectId: workspace.id,
      },
    });

    if (!utmContent) {
      throw new DubApiError({
        code: "not_found",
        message: "UTM content not found.",
      });
    }

    try {
      const response = await prisma.utmContent.update({
        where: {
          id,
        },
        data: {
          name,
        },
      });

      return NextResponse.json(UtmContentSchema.parse(response));
    } catch (error) {
      if (error.code === "P2002") {
        throw new DubApiError({
          code: "conflict",
          message: "A UTM content with that name already exists.",
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

// DELETE /api/utm-contents/[id] – delete a UTM content for a workspace
export const DELETE = withWorkspace(
  async ({ params, workspace }) => {
    const { id } = params;
    try {
      const response = await prisma.utmContent.delete({
        where: {
          id,
          projectId: workspace.id,
        },
      });

      if (!response) {
        throw new DubApiError({
          code: "not_found",
          message: "UTM content not found.",
        });
      }

      return NextResponse.json({ id });
    } catch (error) {
      if (error.code === "P2025") {
        throw new DubApiError({
          code: "not_found",
          message: "UTM content not found.",
        });
      }

      throw error;
    }
  },
  {
    requiredPermissions: ["links.write"],
  },
);

