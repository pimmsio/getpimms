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

  if (groupBy) {
    // Map 'url' groupBy to 'baseUrl' field for efficient database-level grouping
    const dbGroupByField = groupBy === 'url' ? 'baseUrl' : groupBy;
    
    // Step 1: Get distinct group values with counts using Prisma groupBy
    const groupValues = await prisma.link.groupBy({
      by: [dbGroupByField],
      where: baseWhere,
      _count: true,
      orderBy: {
        _count: {
          [dbGroupByField]: "desc",
        },
      },
    });

    // Step 2: For each group value, fetch all its links
    const groupedResults = await Promise.all(
      groupValues.map(async (group) => {
        const groupValue = group[dbGroupByField];
        
        const groupLinks = await prisma.link.findMany({
          where: {
            ...baseWhere,
            [dbGroupByField]: groupValue,
          },
          include: includeClause,
          orderBy: {
            [sortBy]: sortOrder,
          },
        });

        // Display null groups as "(No <field>)"
        const displayValue = groupValue === null 
          ? `(No ${groupBy === 'url' ? 'URL' : groupBy.replace('utm_', 'UTM ').replace(/_/g, ' ')})`
          : groupValue;

        return {
          _group: displayValue,
          _count: group._count,
          links: groupLinks.map((link) => transformLink(link)),
        };
      })
    );

    // Step 3: For UTM grouping, extract values from destination URLs in memory
    // (UTM values might be in URL params rather than Link UTM fields)
    let finalGroupedResults = groupedResults;
    
    const isUtmGrouping = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].includes(groupBy || '');

    if (isUtmGrouping) {
      // Helper function to extract UTM parameter from destination URL
      const extractUtmParam = (url: string | null, utmParam: string): string => {
        if (!url) return `(No ${utmParam.replace('utm_', 'UTM ').replace(/_/g, ' ')})`;
        try {
          const urlObj = new URL(url);
          const value = urlObj.searchParams.get(utmParam);
          return value || `(No ${utmParam.replace('utm_', 'UTM ').replace(/_/g, ' ')})`;
        } catch (e) {
          return `(No ${utmParam.replace('utm_', 'UTM ').replace(/_/g, ' ')})`;
        }
      };

      const allLinks = await prisma.link.findMany({
        where: baseWhere,
        include: includeClause,
        orderBy: {
          [sortBy]: sortOrder,
        },
      });

      // Group links by extracted value from destination URL
      const regroupedMap = new Map<string, any[]>();
      
      allLinks.forEach((link) => {
        const groupKey = extractUtmParam(link.url, groupBy!);
        
        if (!regroupedMap.has(groupKey)) {
          regroupedMap.set(groupKey, []);
        }
        regroupedMap.get(groupKey)!.push(transformLink(link));
      });

      // Convert to array format and sort by count
      finalGroupedResults = Array.from(regroupedMap.entries())
        .map(([groupKey, links]) => ({
          _group: groupKey,
          _count: links.length,
          links,
        }))
        .sort((a, b) => b._count - a._count);
    }

    // Step 4: Flatten the results with group headers
    return finalGroupedResults.flatMap(({ _group, _count, links }) => [
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
