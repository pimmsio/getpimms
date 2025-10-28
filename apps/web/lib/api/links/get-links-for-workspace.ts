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

  const links = await prisma.link.findMany({
    where: {
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
      ...(utm_source && { utm_source }),
      ...(utm_medium && { utm_medium }),
      ...(utm_campaign && { utm_campaign }),
      ...(utm_term && { utm_term }),
      ...(utm_content && { utm_content }),
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
      user: includeUser,
      webhooks: includeWebhooks,
      dashboard: includeDashboard,
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    take: pageSize,
    skip: (page - 1) * pageSize,
  });

  const transformedLinks = links.map((link) => transformLink(link));

  // If groupBy is specified, group the links
  if (groupBy) {
    const grouped = new Map<string, typeof transformedLinks>();
    
    transformedLinks.forEach((link) => {
      const groupValue = (link[groupBy as keyof typeof link] as string) || "(empty)";
      const existing = grouped.get(groupValue);
      if (existing) {
        existing.push(link);
      } else {
        grouped.set(groupValue, [link]);
      }
    });

    // Convert to array and sort groups alphabetically by group value
    return Array.from(grouped.entries())
      .sort(([a], [b]) => {
        // Put "(empty)" at the end
        if (a === "(empty)") return 1;
        if (b === "(empty)") return -1;
        return a.localeCompare(b);
      })
      .flatMap(([groupValue, groupLinks]) => [
        { _group: groupValue, _count: groupLinks.length } as any,
        ...groupLinks,
      ]);
  }

  return transformedLinks;
}
