import { createId } from "@/lib/api/create-id";
import { DubApiError } from "@/lib/api/errors";
import { withWorkspace } from "@/lib/auth";
import { throwIfUtmParametersLimitExceeded } from "@/lib/utm/limits";
import {
  UtmContentSchema,
  createUtmContentBodySchema,
  getUtmContentsQuerySchemaExtended,
} from "@/lib/zod/schemas/utm-parameters";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// GET /api/utm-contents - get all UTM contents for a workspace
export const GET = withWorkspace(
  async ({ workspace, headers, searchParams }) => {
    const { search, ids, sortBy, sortOrder, page, pageSize } =
      getUtmContentsQuerySchemaExtended.parse(searchParams);

    const utmContents = await prisma.utmContent.findMany({
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

    return NextResponse.json(utmContents, { headers });
  },
  {
    requiredPermissions: ["links.read"],
  },
);

// POST /api/utm-contents - create a UTM content for a workspace
export const POST = withWorkspace(
  async ({ req, workspace, headers }) => {
    const { name } = createUtmContentBodySchema.parse(await req.json());

    const existingUtmContent = await prisma.utmContent.findFirst({
      where: {
        projectId: workspace.id,
        name,
      },
    });

    if (existingUtmContent) {
      throw new DubApiError({
        code: "conflict",
        message: "A UTM content with that name already exists.",
      });
    }

    // Enforce plan limit (only when creating a new parameter)
    await throwIfUtmParametersLimitExceeded({
      plan: workspace.plan,
      projectId: workspace.id,
    });

    const response = await prisma.utmContent.create({
      data: {
        id: createId({ prefix: "utm_cnt_" }),
        name,
        projectId: workspace.id,
      },
    });

    return NextResponse.json(UtmContentSchema.parse(response), {
      headers,
      status: 201,
    });
  },
  {
    requiredPermissions: ["links.write"],
  },
);

