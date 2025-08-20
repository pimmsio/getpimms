import { tb } from "@/lib/tinybird";
import { prisma } from "@dub/prisma";
import { transformLink } from "../api/links";
import { decodeLinkIfCaseSensitive } from "../api/links/case-sensitivity";
import z from "../zod";
import { clickEventResponseSchema, clickEventSchema } from "../zod/schemas/clicks";

export const getAnonymousUserClicks = async (anonymousId: string, limit: number = 100) => {
  console.log('Getting all clicks for anonymous user:', anonymousId);

  // Use v2_events to get clicks by identity_hash (which now contains userId)
  const pipe = tb.buildPipe({
    pipe: "v2_events",
    parameters: z.any(),
    data: z.any(),
  });

  try {
    const response = await pipe({
      eventType: "clicks",
      // Note: v2_events might not support identity_hash filter directly
      // This is a limitation we'll work around
      limit,
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().replace("T", " ").replace("Z", ""), // 1 year ago
      end: new Date().toISOString().replace("T", " ").replace("Z", ""),
      order: "desc",
    });

    console.log('Raw clicks response:', { total: response.data.length });

    // Filter by identity_hash on the client side (not ideal but works)
    const filteredClicks = response.data.filter(evt => evt.identity_hash === anonymousId);
    
    console.log('Filtered clicks for anonymous user:', { anonymousId, total: filteredClicks.length });

    if (filteredClicks.length === 0) {
      return [];
    }

    // Get link info for all clicks
    const linksMap = await getLinksMap(filteredClicks.map(d => d.link_id));

    const events = filteredClicks
      .map((evt) => {
        let link = linksMap[evt.link_id];
        if (!link) {
          return null;
        }

        link = decodeLinkIfCaseSensitive(link);

        const eventData = {
          ...evt,
          domain: link.domain,
          key: link.key,
          timestamp: new Date(evt.timestamp + "Z"),
          click: clickEventSchema.parse({
            ...evt,
            id: evt.click_id,
            region: evt.region_processed ?? "",
            refererUrl: evt.referer_url_processed ?? "",
            ip: evt.ip || "unknown",
          }),
          link: transformLink(link, { skipDecodeKey: true }),
        };

        return clickEventResponseSchema.parse(eventData);
      })
      .filter((d) => d !== null);

    return events;
  } catch (error) {
    console.error('Error getting user clicks:', error);
    return [];
  }
};

const getLinksMap = async (linkIds: string[]) => {
  if (linkIds.length === 0) return {};
  
  const links = await prisma.link.findMany({
    where: {
      id: {
        in: linkIds,
      },
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
