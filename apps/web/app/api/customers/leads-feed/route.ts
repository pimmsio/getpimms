import { getStartEndDates } from "@/lib/analytics/utils/get-start-end-dates";
import { getFolderIdsToFilter } from "@/lib/analytics/get-folder-ids-to-filter";
import { getDomainOrThrow } from "@/lib/api/domains/get-domain-or-throw";
import { getLinkOrThrow } from "@/lib/api/links/get-link-or-throw";
import { handleAndReturnErrorResponse } from "@/lib/api/errors";
import { withWorkspace } from "@/lib/auth";
import { verifyFolderAccess } from "@/lib/folder/permissions";
import { eventsQuerySchema } from "@/lib/zod/schemas/analytics";
import { tb } from "@/lib/tinybird";
import { prisma } from "@dub/prisma";
import { Folder, Link } from "@dub/prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eventsFilterTB } from "@/lib/zod/schemas/analytics";
import { leadEventSchemaTBEndpoint } from "@/lib/zod/schemas/leads";
import { saleEventSchemaTBEndpoint } from "@/lib/zod/schemas/sales";
import zSchema from "@/lib/zod";

export const dynamic = "force-dynamic";

const querySchema = eventsQuerySchema
  .pick({
    interval: true,
    start: true,
    end: true,
    page: true,
    limit: true,
    domain: true,
    key: true,
    linkId: true,
    externalId: true,
    folderId: true,
    tagIds: true,
    utm_source: true,
    utm_medium: true,
    utm_campaign: true,
    utm_term: true,
    utm_content: true,
  })
  .and(
    z.object({
      hotOnly: z
        .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false")])
        .optional()
        .transform((v) => v === "1" || v === "true"),
      hotScore: z.string().optional(),
    }),
  );

const parseCsv = (value: string | null | undefined) =>
  value
    ? value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

/*
  GET /api/customers/leads-feed
  Returns a deduped list of customers ("leads") sorted by latest activity.
*/
export const GET = withWorkspace(async ({ workspace, session, searchParams }) => {
  try {
    const parsed = querySchema.parse(searchParams);

    let {
      interval,
      start,
      end,
      page,
      limit,
      linkId,
      externalId,
      domain,
      key,
      folderId,
      tagIds,
      hotOnly,
      hotScore,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
    } = parsed;

    const utmSource = parseCsv(utm_source ?? undefined);
    const utmMedium = parseCsv(utm_medium ?? undefined);
    const utmCampaign = parseCsv(utm_campaign ?? undefined);
    const utmTerm = parseCsv(utm_term ?? undefined);
    const utmContent = parseCsv(utm_content ?? undefined);

    const linkUtmWhere =
      utmSource.length ||
      utmMedium.length ||
      utmCampaign.length ||
      utmTerm.length ||
      utmContent.length
        ? {
            ...(utmSource.length ? { utm_source: { in: utmSource } } : {}),
            ...(utmMedium.length ? { utm_medium: { in: utmMedium } } : {}),
            ...(utmCampaign.length ? { utm_campaign: { in: utmCampaign } } : {}),
            ...(utmTerm.length ? { utm_term: { in: utmTerm } } : {}),
            ...(utmContent.length ? { utm_content: { in: utmContent } } : {}),
          }
        : null;

    if (domain) {
      await getDomainOrThrow({ workspace, domain });
    }

    let link: Link | null = null;
    if (linkId || externalId || (domain && key)) {
      link = await getLinkOrThrow({
        workspaceId: workspace.id,
        linkId,
        externalId,
        domain,
        key,
      });
    }

    const folderIdToVerify = link?.folderId || folderId;

    let selectedFolder: Pick<Folder, "id" | "type"> | null = null;
    if (folderIdToVerify) {
      selectedFolder = await verifyFolderAccess({
        workspace,
        userId: session.user.id,
        folderId: folderIdToVerify,
        requiredPermission: "folders.read",
      });
    }

    const folderIds = folderIdToVerify
      ? undefined
      : await getFolderIdsToFilter({
          workspace,
          userId: session.user.id,
        });

    const { startDate, endDate } = getStartEndDates({
      interval,
      start,
      end,
      dataAvailableFrom: workspace.createdAt,
    });

    // Handle hotScore filter (warm, hot, or both)
    const hotScoreFilter = hotScore?.split(",").filter(Boolean) ?? [];
    const hasWarm = hotScoreFilter.includes("warm");
    const hasHot = hotScoreFilter.includes("hot");
    const hasCold = hotScoreFilter.includes("cold");
    
    let hotScoreWhere: any = {};
    if (hotOnly) {
      // Legacy hotOnly filter - only hot (67+)
      hotScoreWhere = { hotScore: { gte: 67 } };
    } else if (hasWarm && hasHot) {
      // Both warm and hot (34-100)
      hotScoreWhere = { hotScore: { gte: 34 } };
    } else if (hasWarm) {
      // Only warm (34-66)
      hotScoreWhere = { hotScore: { gte: 34, lte: 66 } };
    } else if (hasHot) {
      // Only hot (67-100)
      hotScoreWhere = { hotScore: { gte: 67 } };
    } else if (hasCold) {
      // Only cold (0-33)
      hotScoreWhere = { hotScore: { gte: 0, lte: 33 } };
    }

    const where = {
      projectId: workspace.id,
      lastEventAt: {
        gte: startDate,
        lte: endDate,
      },
      ...hotScoreWhere,
      ...(link ? { linkId: link.id } : {}),
      ...(folderIdToVerify
        ? { link: { folderId: folderIdToVerify } }
        : folderIds
          ? { OR: [{ link: { folderId: { in: folderIds } } }, { linkId: null }, { link: { folderId: null } }] }
          : {}),
      ...(tagIds && tagIds.length > 0
        ? { link: { tags: { some: { tagId: { in: tagIds } } } } }
        : {}),
      ...(linkUtmWhere
        ? {
            OR: [
              { link: linkUtmWhere },
              { lastActivityLink: linkUtmWhere },
            ],
          }
        : {}),
      // Future: handle mega folders precisely
      ...(selectedFolder?.type === "mega" ? {} : {}),
    } as const;

    const orderBy = hotOnly
      ? [{ hotScore: "desc" as const }, { lastEventAt: "desc" as const }]
      : [{ lastEventAt: "desc" as const }];

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where: where as any }),
      prisma.customer.findMany({
        where: where as any,
        select: {
          id: true,
          externalId: true,
          name: true,
          email: true,
          avatar: true,
          country: true,
          anonymousId: true,
          clickId: true,
          totalClicks: true,
          hotScore: true,
          lastHotScoreAt: true,
          lastEventAt: true,
          lastActivityType: true,
          createdAt: true,
          link: {
            select: {
              id: true,
              domain: true,
              key: true,
              url: true,
              shortLink: true,
              utm_source: true,
              utm_medium: true,
              utm_campaign: true,
              utm_term: true,
              utm_content: true,
              tags: {
                select: {
                  tag: {
                    select: {
                      id: true,
                      name: true,
                      color: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
          },
          lastActivityLink: {
            select: {
              id: true,
              domain: true,
              key: true,
              url: true,
              shortLink: true,
              utm_source: true,
              utm_medium: true,
              utm_campaign: true,
              utm_term: true,
              utm_content: true,
              tags: {
                select: {
                  tag: {
                    select: {
                      id: true,
                      name: true,
                      color: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const normalizeLink = (l: any) =>
      l
        ? {
            ...l,
            tags: (l.tags ?? []).map((t: any) => t.tag),
          }
        : null;

    // Fetch conversions count and referer from Tinybird for all customers
    const customerIds = customers.map((c) => c.id);
    const conversionsMap = new Map<string, number>();
    const refererMap = new Map<string, string | null>();

    if (customerIds.length > 0) {
      try {
        const pipe = tb.buildPipe({
          pipe: "v2_events",
          parameters: eventsFilterTB,
          data: zSchema.union([leadEventSchemaTBEndpoint, saleEventSchemaTBEndpoint]),
        });

        // Query for lead and sale events to count conversions
        const [leadsResponse, salesResponse] = await Promise.all([
          pipe({
            workspaceId: workspace.id,
            eventType: "leads",
            start: startDate.toISOString().replace("T", " ").replace("Z", ""),
            end: endDate.toISOString().replace("T", " ").replace("Z", ""),
            limit: 10000, // Large limit to get all events
          }).catch(() => ({ data: [] })),
          pipe({
            workspaceId: workspace.id,
            eventType: "sales",
            start: startDate.toISOString().replace("T", " ").replace("Z", ""),
            end: endDate.toISOString().replace("T", " ").replace("Z", ""),
            limit: 10000,
          }).catch(() => ({ data: [] })),
        ]);

        // Count conversions (lead + sale events) per customer and get most recent referer
        const allEvents = [...leadsResponse.data, ...salesResponse.data]
          .filter((e) => e.customer_id && customerIds.includes(e.customer_id))
          .sort((a, b) => {
            // Sort by timestamp descending to process most recent first
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          });
        
        for (const event of allEvents) {
          // Count conversions
          const current = conversionsMap.get(event.customer_id!) || 0;
          conversionsMap.set(event.customer_id!, current + 1);
          
          // Store referer from the most recent event (lead/sale events have referer from their click)
          if (event.referer && !refererMap.has(event.customer_id!)) {
            refererMap.set(event.customer_id!, event.referer);
          }
        }
      } catch (error) {
        // Silently fail - conversions and referer will be undefined
        console.error("Error fetching conversions/referer from Tinybird:", error);
      }
    }

    return NextResponse.json({
      total,
      customers: customers.map((c: any) => ({
        ...c,
        link: normalizeLink(c.link),
        lastActivityLink: normalizeLink(c.lastActivityLink),
        conversions: conversionsMap.get(c.id) ?? 0,
        referer: refererMap.get(c.id) ?? null,
      })),
    });
  } catch (error) {
    return handleAndReturnErrorResponse(error);
  }
});

