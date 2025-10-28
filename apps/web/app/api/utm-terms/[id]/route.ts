import { DubApiError } from "@/lib/api/errors";
import { withWorkspace } from "@/lib/auth";
import {
  UtmTermSchema,
  updateUtmTermBodySchema,
} from "@/lib/zod/schemas/utm-parameters";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// PATCH /api/utm-terms/[id] – update a UTM term for a workspace
export const PATCH = withWorkspace(
  async ({ req, params, workspace }) => {
    const { id } = params;
    const { name } = updateUtmTermBodySchema.parse(await req.json());

    const utmTerm = await prisma.utmTerm.findFirst({
      where: {
        id,
        projectId: workspace.id,
      },
    });

    if (!utmTerm) {
      throw new DubApiError({
        code: "not_found",
        message: "UTM term not found.",
      });
    }

    try {
      const response = await prisma.utmTerm.update({
        where: {
          id,
        },
        data: {
          name,
        },
      });

      return NextResponse.json(UtmTermSchema.parse(response));
    } catch (error) {
      if (error.code === "P2002") {
        throw new DubApiError({
          code: "conflict",
          message: "A UTM term with that name already exists.",
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

// DELETE /api/utm-terms/[id] – delete a UTM term for a workspace
export const DELETE = withWorkspace(
  async ({ params, workspace }) => {
    const { id } = params;
    try {
      const response = await prisma.utmTerm.delete({
        where: {
          id,
          projectId: workspace.id,
        },
      });

      if (!response) {
        throw new DubApiError({
          code: "not_found",
          message: "UTM term not found.",
        });
      }

      return NextResponse.json({ id });
    } catch (error) {
      if (error.code === "P2025") {
        throw new DubApiError({
          code: "not_found",
          message: "UTM term not found.",
        });
      }

      throw error;
    }
  },
  {
    requiredPermissions: ["links.write"],
  },
);

