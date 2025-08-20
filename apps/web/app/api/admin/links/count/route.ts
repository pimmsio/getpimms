import { combineTagIds } from "@/lib/api/tags/combine-tag-ids";
import { withAdmin } from "@/lib/auth";
import { getLinksCountQuerySchema } from "@/lib/zod/schemas/links";
import { prisma } from "@dub/prisma";
import { LEGAL_USER_ID } from "@dub/utils";
import { NextResponse } from "next/server";

// GET /api/admin/links/count – get links count for admin (across all workspaces)
export const GET = withAdmin(async ({ searchParams }) => {
  const params = getLinksCountQuerySchema.parse(searchParams);
  
  const {
    groupBy,
    search,
    domain,
    tagId,
    tagIds,
    tagNames,
    userId,
    showArchived,
    withTags,
  } = params;

  const combinedTagIds = combineTagIds({ tagId, tagIds });

  const linksWhere = {
    // Admin sees all workspaces - no projectId filter, but exclude system links
    ...(search && {
      OR: [
        { shortLink: { contains: search } },
        { url: { contains: search } },
      ],
    }),
    archived: showArchived ? undefined : false,
    ...(domain && groupBy !== "domain" && { domain }),
    ...(userId && groupBy !== "userId" && { userId }),
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
            }
          }
        : {}),
    // Exclude system links
    userId: { not: LEGAL_USER_ID },
  };

  let response;

  if (groupBy === "tagId") {
    response = await prisma.linkTag.groupBy({
      by: ["tagId"],
      where: {
        link: linksWhere,
      },
      _count: true,
      orderBy: {
        _count: {
          tagId: "desc",
        },
      },
    });
  } else if (groupBy) {
    response = await prisma.link.groupBy({
      by: [groupBy],
      where: linksWhere,
      _count: true,
      orderBy: {
        _count: {
          [groupBy]: "desc",
        },
      },
      take: 500,
    });
  } else {
    response = await prisma.link.count({
      where: linksWhere,
    });
  }

  return NextResponse.json(response);
});
