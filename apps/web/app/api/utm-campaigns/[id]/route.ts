import { DubApiError } from "@/lib/api/errors";
import { withWorkspace } from "@/lib/auth";
import {
  UtmCampaignSchema,
  updateUtmCampaignBodySchema,
} from "@/lib/zod/schemas/utm-parameters";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// PATCH /api/utm-campaigns/[id] – update a UTM campaign for a workspace
export const PATCH = withWorkspace(
  async ({ req, params, workspace }) => {
    const { id } = params;
    const { name } = updateUtmCampaignBodySchema.parse(await req.json());

    const utmCampaign = await prisma.utmCampaign.findFirst({
      where: {
        id,
        projectId: workspace.id,
      },
    });

    if (!utmCampaign) {
      throw new DubApiError({
        code: "not_found",
        message: "UTM campaign not found.",
      });
    }

    try {
      const response = await prisma.utmCampaign.update({
        where: {
          id,
        },
        data: {
          name,
        },
      });

      return NextResponse.json(UtmCampaignSchema.parse(response));
    } catch (error) {
      if (error.code === "P2002") {
        throw new DubApiError({
          code: "conflict",
          message: "A UTM campaign with that name already exists.",
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

// DELETE /api/utm-campaigns/[id] – delete a UTM campaign for a workspace
export const DELETE = withWorkspace(
  async ({ params, workspace }) => {
    const { id } = params;
    try {
      const response = await prisma.utmCampaign.delete({
        where: {
          id,
          projectId: workspace.id,
        },
      });

      if (!response) {
        throw new DubApiError({
          code: "not_found",
          message: "UTM campaign not found.",
        });
      }

      return NextResponse.json({ id });
    } catch (error) {
      if (error.code === "P2025") {
        throw new DubApiError({
          code: "not_found",
          message: "UTM campaign not found.",
        });
      }

      throw error;
    }
  },
  {
    requiredPermissions: ["links.write"],
  },
);

