import { createId } from "@/lib/api/create-id";
import { DubApiError } from "@/lib/api/errors";
import { withWorkspace } from "@/lib/auth";
import {
  UtmCampaignSchema,
  createUtmCampaignBodySchema,
  getUtmCampaignsQuerySchemaExtended,
} from "@/lib/zod/schemas/utm-parameters";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// GET /api/utm-campaigns - get all UTM campaigns for a workspace
export const GET = withWorkspace(
  async ({ workspace, headers, searchParams }) => {
    const { search, ids, sortBy, sortOrder, page, pageSize } =
      getUtmCampaignsQuerySchemaExtended.parse(searchParams);

    const utmCampaigns = await prisma.utmCampaign.findMany({
      where: {
        projectId: workspace.id,
        ...(search && {
          name: {
            contains: search,
          },
        }),
        ...(ids && {
          id: {
            in: ids,
          },
        }),
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    return NextResponse.json(utmCampaigns, { headers });
  },
  {
    requiredPermissions: ["links.read"],
  },
);

// POST /api/utm-campaigns - create a UTM campaign for a workspace
export const POST = withWorkspace(
  async ({ req, workspace, headers }) => {
    const { name } = createUtmCampaignBodySchema.parse(await req.json());

    const existingUtmCampaign = await prisma.utmCampaign.findFirst({
      where: {
        projectId: workspace.id,
        name,
      },
    });

    if (existingUtmCampaign) {
      throw new DubApiError({
        code: "conflict",
        message: "A UTM campaign with that name already exists.",
      });
    }

    const response = await prisma.utmCampaign.create({
      data: {
        id: createId({ prefix: "utm_cmp_" }),
        name,
        projectId: workspace.id,
      },
    });

    return NextResponse.json(UtmCampaignSchema.parse(response), {
      headers,
      status: 201,
    });
  },
  {
    requiredPermissions: ["links.write"],
  },
);

