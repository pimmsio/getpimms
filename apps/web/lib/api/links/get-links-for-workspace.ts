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
      ...(url && { url: { contains: url } }),
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

  return links.map((link) => transformLink(link));
}
