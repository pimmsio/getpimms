import { getStartEndDates } from "@/lib/analytics/utils/get-start-end-dates";
import { getFolderIdsToFilter } from "@/lib/analytics/get-folder-ids-to-filter";
import { getDomainOrThrow } from "@/lib/api/domains/get-domain-or-throw";
import { getLinkOrThrow } from "@/lib/api/links/get-link-or-throw";
import { handleAndReturnErrorResponse } from "@/lib/api/errors";
import { withWorkspace } from "@/lib/auth";
import { verifyFolderAccess } from "@/lib/folder/permissions";
import { eventsQuerySchema } from "@/lib/zod/schemas/analytics";
import { prisma } from "@dub/prisma";
import { Folder, Link } from "@dub/prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

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
  })
  .and(
    z.object({
      hotOnly: z
        .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false")])
        .optional()
        .transform((v) => v === "1" || v === "true"),
    }),
  );

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
    } = parsed;

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

    const where = {
      projectId: workspace.id,
      lastEventAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(hotOnly ? { hotScore: { gte: 67 } } : {}),
      ...(link ? { linkId: link.id } : {}),
      ...(folderIdToVerify
        ? { link: { folderId: folderIdToVerify } }
        : folderIds
          ? { OR: [{ link: { folderId: { in: folderIds } } }, { linkId: null }, { link: { folderId: null } }] }
          : {}),
      ...(tagIds && tagIds.length > 0
        ? { link: { tags: { some: { tagId: { in: tagIds } } } } }
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
            },
          },
          lastActivityLink: {
            select: {
              id: true,
              domain: true,
              key: true,
              url: true,
              shortLink: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return NextResponse.json({ total, customers });
  } catch (error) {
    return handleAndReturnErrorResponse(error);
  }
});

