import { tb } from "@/lib/tinybird";
import { prisma } from "@dub/prisma";
import { transformLink } from "../api/links/utils/transform-link";
import { decodeLinkIfCaseSensitive } from "../api/links/case-sensitivity";
import z from "../zod";
import {
  clickEventResponseSchema,
  clickEventSchema,
} from "../zod/schemas/clicks";

export const getAnonymousUserClicks = async (
  anonymousId: string,
  limit: number = 100,
  workspaceId?: string,
) => {
  const pipe = tb.buildPipe({
    pipe: "get_anonymous_event",
    parameters: z.object({
      identityHash: z.string(),
      limit: z.number().optional().default(100),
    }),
    data: z.any(),
  });

  try {
    const response = await pipe({
      identityHash: anonymousId,
      limit,
    });

    const filteredClicks = response.data;

    if (filteredClicks.length === 0) {
      return [];
    }

    // Get link info for all clicks, filtered by workspace if provided
    const linksMap = await getLinksMap(
      filteredClicks.map((d) => d.link_id),
      workspaceId,
    );

    const events = filteredClicks
      .map((evt) => {
        let link = linksMap[evt.link_id];
        if (!link) {
          console.warn("Link not found or not in workspace:", evt.link_id);
          return null;
        }

        link = decodeLinkIfCaseSensitive(link);

        const eventData = {
          event: "click", // Add the required event field
          ...evt,
          domain: link.domain,
          key: link.key,
          timestamp: new Date(evt.timestamp + "Z"),
          click: clickEventSchema.parse({
            ...evt,
            id: evt.click_id,
            region: evt.region ?? "", // Raw data has region, not region_processed
            refererUrl: evt.referer_url ?? "", // Raw data has referer_url, not referer_url_processed
            ip: evt.ip || "unknown",
          }),
          link: transformLink(link, { skipDecodeKey: true }),
        };

        return clickEventResponseSchema.parse(eventData);
      })
      .filter((d) => d !== null);

    return events;
  } catch (error) {
    console.error("Error getting user clicks:", error);
    return [];
  }
};

const getLinksMap = async (linkIds: string[], workspaceId?: string) => {
  if (linkIds.length === 0) return {};

  const links = await prisma.link.findMany({
    where: {
      id: {
        in: linkIds,
      },
      ...(workspaceId && { projectId: workspaceId }), // Filter by workspace/project
    },
  });

  return links.reduce(
    (acc, link) => {
      acc[link.id] = link;
      return acc;
    },
    {} as Record<string, any>,
  );
};
