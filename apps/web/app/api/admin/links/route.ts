import { combineTagIds } from "@/lib/api/tags/combine-tag-ids";
import { transformLink } from "@/lib/api/links/utils";
import { withAdmin } from "@/lib/auth";
import { getLinksQuerySchemaExtended } from "@/lib/zod/schemas/links";
import { prisma } from "@dub/prisma";
import { LEGAL_USER_ID } from "@dub/utils";
import { NextResponse } from "next/server";

// GET /api/admin/links – get all links for admin (across all workspaces)
export const GET = withAdmin(async ({ searchParams }) => {
  const params = getLinksQuerySchemaExtended.parse(searchParams);
  
  const {
    domain,
    tagId,
    tagIds,
    tagNames,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
    page = 1,
    pageSize = 50,
    userId,
    showArchived,
    withTags,
    includeUser,
    includeWebhooks,
    includeDashboard,
  } = params;

  const combinedTagIds = combineTagIds({ tagId, tagIds });

  const links = await prisma.link.findMany({
    where: {
      // Admin sees all workspaces - no projectId filter, but exclude system links
      ...(search && {
        OR: [
          { shortLink: { contains: search } },
          { url: { contains: search } },
        ],
      }),
      archived: showArchived ? undefined : false,
      ...(domain && { domain }),
      ...(withTags && {
        tags: {
          some: {},
        },
      }),
      ...(combinedTagIds && combinedTagIds.length > 0
        ? {
            tags: { some: { tagId: { in: combinedTagIds } } },
          }
        : tagNames
          ? {
              tags: {
                some: {
                  tag: {
                    name: {
                      in: tagNames,
                    },
                  },
                },
              },
            }
          : {}),
      ...(userId && { userId }),
      // Exclude system links
      userId: { not: LEGAL_USER_ID },
    },
    include: {
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      },
      ...(includeUser && {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      }),
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    take: pageSize,
    skip: (page - 1) * pageSize,
  });

  // Transform links to match expected format
  const transformedLinks = links.map((link) =>
    transformLink({
      ...link,
      tags: link.tags?.map(({ tag }) => ({ tag })) || [],
    })
  );

  return NextResponse.json(transformedLinks);
});
