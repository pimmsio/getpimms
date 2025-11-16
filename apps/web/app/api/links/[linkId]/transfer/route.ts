import { getAnalytics } from "@/lib/analytics/get-analytics";
import { DubApiError } from "@/lib/api/errors";
import { linkCache } from "@/lib/api/links/cache";
import { getLinkOrThrow } from "@/lib/api/links/get-link-or-throw";
import { normalizeWorkspaceId } from "@/lib/api/workspace-id";
import { withWorkspace } from "@/lib/auth";
import { verifyFolderAccess } from "@/lib/folder/permissions";
import { calculateEvents } from "@/lib/utils/calculate-events";
import { recordLink } from "@/lib/tinybird";
import z from "@/lib/zod";
import { prisma } from "@dub/prisma";
import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";

const transferLinkBodySchema = z.object({
  newWorkspaceId: z
    .string()
    .min(1, "Missing new workspace ID.")
    .transform((v) => normalizeWorkspaceId(v)),
});

// POST /api/links/[linkId]/transfer – transfer a link to another workspace
export const POST = withWorkspace(
  async ({ req, headers, session, params, workspace }) => {
    const link = await getLinkOrThrow({
      workspaceId: workspace.id,
      linkId: params.linkId,
    });

    if (link.folderId) {
      await verifyFolderAccess({
        workspace,
        userId: session.user.id,
        folderId: link.folderId,
        requiredPermission: "folders.links.write",
      });
    }

    const { newWorkspaceId } = transferLinkBodySchema.parse(await req.json());

    const newWorkspace = await prisma.project.findUnique({
      where: { id: newWorkspaceId },
      select: {
        linksUsage: true,
        linksLimit: true,
        users: {
          where: {
            userId: session.user.id,
          },
          select: {
            role: true,
          },
        },
      },
    });

    if (!newWorkspace || newWorkspace.users.length === 0) {
      throw new DubApiError({
        code: "not_found",
        message: "New workspace not found.",
      });
    }

    if (newWorkspace.linksUsage >= newWorkspace.linksLimit) {
      throw new DubApiError({
        code: "forbidden",
        message: "New workspace has reached its link limit.",
      });
    }

    const { clicks: linkClicks } = await getAnalytics({
      event: "clicks",
      groupBy: "count",
      linkId: link.id,
      interval: "30d",
    });

    const { events: linkLeads = 0 } = await getAnalytics({
      event: "leads",
      groupBy: "count",
      linkId: link.id,
      interval: "30d",
    });

    const { saleAmount: linkSalesAmount = 0 } = await getAnalytics({
      event: "sales",
      groupBy: "count",
      linkId: link.id,
      interval: "30d",
    });

    const linkEvents = calculateEvents(linkClicks, linkLeads, linkSalesAmount);

    const updatedLink = await prisma.link.update({
      where: {
        id: link.id,
      },
      data: {
        projectId: newWorkspaceId,
        // remove tags when transferring link
        tags: {
          deleteMany: {},
        },
        // remove folder when transferring link
        folderId: null,
      },
    });

    waitUntil(
      Promise.all([
        linkCache.set(updatedLink),

        recordLink(updatedLink),

        // decrement old workspace usage
        prisma.project.update({
          where: {
            id: workspace.id,
          },
          data: {
            clicksUsage: {
              decrement: linkClicks,
            },
            eventsUsage: {
              decrement: linkEvents,
            },
            totalClicks: {
              decrement: linkClicks,
            },
            totalEvents: {
              decrement: linkEvents,
            },
            linksUsage: {
              decrement: 1,
            },
          },
        }),

        // increment new workspace usage
        prisma.project.update({
          where: {
            id: newWorkspaceId,
          },
          data: {
            clicksUsage: {
              increment: linkClicks,
            },
            eventsUsage: {
              increment: linkEvents,
            },
            totalClicks: {
              increment: linkClicks,
            },
            totalEvents: {
              increment: linkEvents,
            },
            linksUsage: {
              increment: 1,
            },
          },
        }),

        // Remove the webhooks associated with the link
        prisma.linkWebhook.deleteMany({
          where: {
            linkId: link.id,
          },
        }),
      ]),
    );

    return NextResponse.json(updatedLink, {
      headers,
    });
  },
  {
    requiredPermissions: ["links.write"],
  },
);
