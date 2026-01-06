import { createId } from "@/lib/api/create-id";
import { DubApiError } from "@/lib/api/errors";
import { withWorkspace } from "@/lib/auth";
import { throwIfUtmParametersLimitExceeded } from "@/lib/utm/limits";
import {
  UtmMediumSchema,
  createUtmMediumBodySchema,
  getUtmMediumsQuerySchemaExtended,
} from "@/lib/zod/schemas/utm-parameters";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// GET /api/utm-mediums - get all UTM mediums for a workspace
export const GET = withWorkspace(
  async ({ workspace, headers, searchParams }) => {
    const { search, ids, sortBy, sortOrder, page, pageSize } =
      getUtmMediumsQuerySchemaExtended.parse(searchParams);

    const utmMediums = await prisma.utmMedium.findMany({
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

    return NextResponse.json(utmMediums, { headers });
  },
  {
    requiredPermissions: ["links.read"],
  },
);

// POST /api/utm-mediums - create a UTM medium for a workspace
export const POST = withWorkspace(
  async ({ req, workspace, headers }) => {
    const { name } = createUtmMediumBodySchema.parse(await req.json());

    const existingUtmMedium = await prisma.utmMedium.findFirst({
      where: {
        projectId: workspace.id,
        name,
      },
    });

    if (existingUtmMedium) {
      throw new DubApiError({
        code: "conflict",
        message: "A UTM medium with that name already exists.",
      });
    }

    // Enforce plan limit (only when creating a new parameter)
    await throwIfUtmParametersLimitExceeded({
      plan: workspace.plan,
      projectId: workspace.id,
    });

    const response = await prisma.utmMedium.create({
      data: {
        id: createId({ prefix: "utm_med_" }),
        name,
        projectId: workspace.id,
      },
    });

    return NextResponse.json(UtmMediumSchema.parse(response), {
      headers,
      status: 201,
    });
  },
  {
    requiredPermissions: ["links.write"],
  },
);

