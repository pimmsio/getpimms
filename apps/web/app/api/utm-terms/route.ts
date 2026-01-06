import { createId } from "@/lib/api/create-id";
import { DubApiError } from "@/lib/api/errors";
import { withWorkspace } from "@/lib/auth";
import { throwIfUtmParametersLimitExceeded } from "@/lib/utm/limits";
import {
  UtmTermSchema,
  createUtmTermBodySchema,
  getUtmTermsQuerySchemaExtended,
} from "@/lib/zod/schemas/utm-parameters";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// GET /api/utm-terms - get all UTM terms for a workspace
export const GET = withWorkspace(
  async ({ workspace, headers, searchParams }) => {
    const { search, ids, sortBy, sortOrder, page, pageSize } =
      getUtmTermsQuerySchemaExtended.parse(searchParams);

    const utmTerms = await prisma.utmTerm.findMany({
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

    return NextResponse.json(utmTerms, { headers });
  },
  {
    requiredPermissions: ["links.read"],
  },
);

// POST /api/utm-terms - create a UTM term for a workspace
export const POST = withWorkspace(
  async ({ req, workspace, headers }) => {
    const { name } = createUtmTermBodySchema.parse(await req.json());

    const existingUtmTerm = await prisma.utmTerm.findFirst({
      where: {
        projectId: workspace.id,
        name,
      },
    });

    if (existingUtmTerm) {
      throw new DubApiError({
        code: "conflict",
        message: "A UTM term with that name already exists.",
      });
    }

    // Enforce plan limit (only when creating a new parameter)
    await throwIfUtmParametersLimitExceeded({
      plan: workspace.plan,
      projectId: workspace.id,
    });

    const response = await prisma.utmTerm.create({
      data: {
        id: createId({ prefix: "utm_trm_" }),
        name,
        projectId: workspace.id,
      },
    });

    return NextResponse.json(UtmTermSchema.parse(response), {
      headers,
      status: 201,
    });
  },
  {
    requiredPermissions: ["links.write"],
  },
);

