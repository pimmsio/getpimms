import { combineTagIds } from "@/lib/api/tags/combine-tag-ids";
import z from "@/lib/zod";
import { getLinksCountQuerySchema } from "@/lib/zod/schemas/links";
import { prisma } from "@dub/prisma";
import {
  buildUtmFilter,
  buildUrlFilter,
  calculateDateRange,
} from "./utils/filter-helpers";

export async function getLinksCount({
  searchParams,
  workspaceId,
  folderIds,
}: {
  searchParams: z.infer<typeof getLinksCountQuerySchema>;
  workspaceId: string;
  folderIds?: string[];
}) {
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
    folderId,
    tenantId,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content,
    url,
    start,
    end,
    interval,
  } = searchParams;

  const combinedTagIds = combineTagIds({ tagId, tagIds });

  // Calculate date range from interval or use explicit start/end dates
  const dateRange = calculateDateRange(interval, start, end);
  const startDate = dateRange?.startDate;
  const endDate = dateRange?.endDate;

  const linksWhere = {
    projectId: workspaceId,
    AND: [
      ...(folderIds
        ? [
            {
              OR: [
                {
                  folderId: {
                    in: folderIds,
                  },
                },
                {
                  folderId: null,
                },
              ],
            },
          ]
        : [
            {
              folderId: folderId || null,
            },
          ]),
      ...(search
        ? [
            {
              OR: [
                { shortLink: { contains: search } },
                { url: { contains: search } },
              ],
            },
          ]
        : []),
    ],
    archived: showArchived ? undefined : false,
    ...(domain &&
      groupBy !== "domain" && {
        domain,
      }),
    ...(userId &&
      groupBy !== "userId" && {
        userId,
      }),
    ...(tenantId && { tenantId }),
    ...(utm_source &&
      groupBy !== "utm_source" && {
        utm_source: buildUtmFilter(utm_source),
      }),
    ...(utm_medium &&
      groupBy !== "utm_medium" && {
        utm_medium: buildUtmFilter(utm_medium),
      }),
    ...(utm_campaign &&
      groupBy !== "utm_campaign" && {
        utm_campaign: buildUtmFilter(utm_campaign),
      }),
    ...(utm_term &&
      groupBy !== "utm_term" && {
        utm_term: buildUtmFilter(utm_term),
      }),
    ...(utm_content &&
      groupBy !== "utm_content" && {
        utm_content: buildUtmFilter(utm_content),
      }),
    ...(url &&
      groupBy !== "url" && {
        // Apply URL filter using normalized baseUrl (strip query, hash, trailing slash),
        // to match getLinksForWorkspace and the Destination URL facet.
        baseUrl: buildUrlFilter(url),
      }),
    ...(startDate &&
      endDate && {
        lastClicked: {
          gte: startDate,
          lte: endDate,
        },
      }),
  };

  if (groupBy === "tagId") {
    return await prisma.linkTag.groupBy({
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
  } else {
    const where = {
      ...linksWhere,
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
    };

    if (
      groupBy === "domain" ||
      groupBy === "userId" ||
      groupBy === "folderId" ||
      groupBy === "utm_source" ||
      groupBy === "utm_medium" ||
      groupBy === "utm_campaign" ||
      groupBy === "utm_term" ||
      groupBy === "utm_content" ||
      groupBy === "url"
    ) {
      return await prisma.link.groupBy({
        by: [groupBy],
        where,
        _count: true,
        orderBy: {
          _count: {
            [groupBy]: "desc",
          },
        },
      });
    } else {
      return await prisma.link.count({
        where,
      });
    }
  }
}
