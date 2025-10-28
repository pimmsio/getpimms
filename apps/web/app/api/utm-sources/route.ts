import { createId } from "@/lib/api/create-id";
import { DubApiError } from "@/lib/api/errors";
import { withWorkspace } from "@/lib/auth";
import {
  UtmSourceSchema,
  createUtmSourceBodySchema,
  getUtmSourcesQuerySchemaExtended,
} from "@/lib/zod/schemas/utm-parameters";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// GET /api/utm-sources - get all UTM sources for a workspace
export const GET = withWorkspace(
  async ({ workspace, headers, searchParams }) => {
    const { search, ids, sortBy, sortOrder, page, pageSize } =
      getUtmSourcesQuerySchemaExtended.parse(searchParams);

    const utmSources = await prisma.utmSource.findMany({
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

    return NextResponse.json(utmSources, { headers });
  },
  {
    requiredPermissions: ["links.read"],
  },
);

// POST /api/utm-sources - create a UTM source for a workspace
export const POST = withWorkspace(
  async ({ req, workspace, headers }) => {
    const { name } = createUtmSourceBodySchema.parse(await req.json());

    const existingUtmSource = await prisma.utmSource.findFirst({
      where: {
        projectId: workspace.id,
        name,
      },
    });

    if (existingUtmSource) {
      throw new DubApiError({
        code: "conflict",
        message: "A UTM source with that name already exists.",
      });
    }

    const response = await prisma.utmSource.create({
      data: {
        id: createId({ prefix: "utm_src_" }),
        name,
        projectId: workspace.id,
      },
    });

    return NextResponse.json(UtmSourceSchema.parse(response), {
      headers,
      status: 201,
    });
  },
  {
    requiredPermissions: ["links.write"],
  },
);

