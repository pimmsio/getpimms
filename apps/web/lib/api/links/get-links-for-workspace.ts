import { INTERVAL_DATA } from "@/lib/analytics/constants";
import z from "@/lib/zod";
import { getLinksQuerySchemaExtended } from "@/lib/zod/schemas/links";
import { prisma } from "@dub/prisma";
import { combineTagIds } from "../tags/combine-tag-ids";
import { encodeKeyIfCaseSensitive } from "./case-sensitivity";
import { transformLink } from "./utils";

export async function getLinksForWorkspace({
  workspaceId,
  domain,
  tagId,
  tagIds,
  tagNames,
  search,
  searchMode,
  sort, // Deprecated
  sortBy,
  sortOrder,
  page,
  pageSize,
  userId,
  showArchived,
  withTags,
  folderId,
  folderIds,
  linkIds,
  includeUser,
  includeWebhooks,
  includeDashboard,
  tenantId,
  partnerId,
  utm_source,
  utm_medium,
  utm_campaign,
  utm_term,
  utm_content,
  url,
  start,
  end,
  interval,
  groupBy,
}: z.infer<typeof getLinksQuerySchemaExtended> & {
  workspaceId: string;
  folderIds?: string[];
}) {
  const combinedTagIds = combineTagIds({ tagId, tagIds });

  // support legacy sort param
  if (sort && sort !== "createdAt") {
    sortBy = sort;
  }

  if (searchMode === "exact" && search) {
    try {
      const url = new URL(search);
      const domain = url.hostname;
      const key = url.pathname.slice(1);

      if (key) {
        const encodedKey = encodeKeyIfCaseSensitive({
          domain,
          key,
        });

        search = search.replace(key, encodedKey);
      }
    } catch (e) {}
  }

  console.log('🔍 [getLinksForWorkspace] Processing UTM filters:', {
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content,
    'utm_source split': utm_source?.includes(',') ? utm_source.split(',') : utm_source,
    'utm_medium split': utm_medium?.includes(',') ? utm_medium.split(',') : utm_medium,
  });

  // Calculate date range from interval or use explicit start/end dates
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (interval && INTERVAL_DATA[interval]) {
    startDate = INTERVAL_DATA[interval].startDate;
    endDate = new Date();
  } else if (start || end) {
    startDate = start;
    endDate = end;
  }

  // Build the base where clause (reused for both regular and grouped queries)
  const baseWhere = {
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
              ...(searchMode === "fuzzy" && {
                OR: [
                  {
                    shortLink: { contains: search },
                  },
                  {
                    url: { contains: search },
                  },
                ],
              }),
              ...(searchMode === "exact" && {
                shortLink: { startsWith: search },
              }),
            },
          ]
        : []),
    ],
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
    ...(tenantId && { tenantId }),
    ...(partnerId && { partnerId }),
    ...(userId && { userId }),
    ...(linkIds && { id: { in: linkIds } }),
    ...(utm_source && {
      utm_source: utm_source.includes(',')
        ? { in: utm_source.split(',').filter(Boolean) }  // OR logic for multiple UTM sources
        : utm_source  // Exact match for single UTM source
    }),
    ...(utm_medium && {
      utm_medium: utm_medium.includes(',')
        ? { in: utm_medium.split(',').filter(Boolean) }  // OR logic for multiple UTM mediums
        : utm_medium  // Exact match for single UTM medium
    }),
    ...(utm_campaign && {
      utm_campaign: utm_campaign.includes(',')
        ? { in: utm_campaign.split(',').filter(Boolean) }  // OR logic for multiple UTM campaigns
        : utm_campaign  // Exact match for single UTM campaign
    }),
    ...(utm_term && {
      utm_term: utm_term.includes(',')
        ? { in: utm_term.split(',').filter(Boolean) }  // OR logic for multiple UTM terms
        : utm_term  // Exact match for single UTM term
    }),
    ...(utm_content && {
      utm_content: utm_content.includes(',')
        ? { in: utm_content.split(',').filter(Boolean) }  // OR logic for multiple UTM contents
        : utm_content  // Exact match for single UTM content
    }),
    ...(url && {
      url: url.includes(',')
        ? { in: url.split(',').filter(Boolean) }  // OR logic for multiple URLs
        : url  // Exact match for single URL
    }),
    ...(startDate &&
      endDate && {
        lastClicked: {
          gte: startDate,
          lte: endDate,
        },
      }),
  };

  console.log('🔍 [getLinksForWorkspace] Built where clause:', JSON.stringify(baseWhere, null, 2));

  const includeClause = {
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
    user: includeUser,
    webhooks: includeWebhooks,
    dashboard: includeDashboard,
  };

  // If groupBy is specified, use SQL-level GROUP BY approach
  if (groupBy) {
    // Step 1: Get distinct group values with counts using Prisma groupBy
    const groupValues = await prisma.link.groupBy({
      by: [groupBy],
      where: baseWhere,
      _count: true,
      orderBy: {
        _count: {
          [groupBy]: "desc",
        },
      },
    });

    // Step 2: For each group value, fetch all its links
    const groupedResults = await Promise.all(
      groupValues
        .filter((group) => group[groupBy] !== null) // Skip null groups for now to avoid Prisma errors
        .map(async (group) => {
          const groupValue = group[groupBy];
          
          const groupLinks = await prisma.link.findMany({
            where: {
              ...baseWhere,
              [groupBy]: groupValue,
            },
            include: includeClause,
            orderBy: {
              [sortBy]: sortOrder,
            },
          });

          return {
            _group: groupValue,
            _count: group._count,
            links: groupLinks.map((link) => transformLink(link)),
          };
        })
    );

    // Step 3: Flatten the results with group headers
    return groupedResults.flatMap(({ _group, _count, links }) => [
      { _group, _count } as any,
      ...links,
    ]);
  }

  // Regular query without grouping (with pagination)
  const links = await prisma.link.findMany({
    where: baseWhere,
    include: includeClause,
    orderBy: {
      [sortBy]: sortOrder,
    },
    take: pageSize,
    skip: (page - 1) * pageSize,
  });

  return links.map((link) => transformLink(link));
}
