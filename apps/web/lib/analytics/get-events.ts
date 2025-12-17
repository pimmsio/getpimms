import { tb } from "@/lib/tinybird";
import { prisma } from "@dub/prisma";
import { Link } from "@dub/prisma/client";
import { OG_AVATAR_URL } from "@dub/utils";
import { transformLink } from "../api/links";
import { decodeLinkIfCaseSensitive } from "../api/links/case-sensitivity";
import { generateRandomName } from "../names";
import z from "../zod";
import { eventsFilterTB } from "../zod/schemas/analytics";
import {
  clickEventResponseSchema,
  clickEventSchema,
} from "../zod/schemas/clicks";
import { CustomerSchema } from "../zod/schemas/customers";
import { leadEventSchemaTBEndpoint } from "../zod/schemas/leads";
import { saleEventSchemaTBEndpoint } from "../zod/schemas/sales";
import { unifiedEventResponseSchema } from "../zod/schemas/unified-events";
import { EventsFilters } from "./types";
import { getStartEndDates } from "./utils/get-start-end-dates";

// Fetch data for /api/events
export const getEvents = async (params: EventsFilters) => {
  let {
    event: eventType,
    workspaceId,
    interval,
    start,
    end,
    qr,
    trigger,
    region,
    country,
    order,
    sortOrder,
    dataAvailableFrom,
  } = params;

  const { startDate, endDate } = getStartEndDates({
    interval,
    start,
    end,
    dataAvailableFrom,
  });

  if (trigger) {
    if (trigger === "qr") {
      qr = true;
    } else if (trigger === "link") {
      qr = false;
    }
  }

  if (region) {
    const split = region.split("-");
    country = split[0];
    region = split[1];
  }

  // support legacy order param
  if (order && order !== "desc") {
    sortOrder = order;
  }

  let response;

  const pipe = tb.buildPipe({
    pipe: "v2_events",
    parameters: eventsFilterTB,
    data: z.union([leadEventSchemaTBEndpoint, saleEventSchemaTBEndpoint]),
  });

  const pipeParams = {
    ...params,
    workspaceId,
    qr,
    country,
    region,
    order: sortOrder,
    offset: (params.page - 1) * params.limit,
    start: startDate.toISOString().replace("T", " ").replace("Z", ""),
    end: endDate.toISOString().replace("T", " ").replace("Z", ""),
  };

  const [leadsResponse, salesResponse] = await Promise.all([
    pipe({
      ...pipeParams,
      eventType: "leads",
    }),
    pipe({
      ...pipeParams,
      eventType: "sales",
    }),
  ]);

  // Merge and sort by timestamp
  const combinedData = [...leadsResponse.data, ...salesResponse.data].sort(
    (a, b) => {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
    },
  );

  response = { data: combinedData };

  // Compute conversion counts per customer from events data
  const conversionsCountMap = new Map<string, number>();
  for (const evt of combinedData) {
    if (evt.event === "lead" || evt.event === "sale") {
      const currentCount = conversionsCountMap.get(evt.customer_id) || 0;
      conversionsCountMap.set(evt.customer_id, currentCount + 1);
    }
  }

  const [linksMap, customersMap] = await Promise.all([
    getLinksMap(response.data.map((d) => d.link_id)),
    getCustomersMap(
      response.data
        .map((d) => {
          if (d.event === "lead" || d.event === "sale") {
            return d.customer_id;
          }
          return null;
        })
        .filter(Boolean) as string[],
    ),
  ]);

  const events = response.data
    .map((evt) => {
      let link = linksMap[evt.link_id];
      if (!link) {
        return null;
      }

      link = decodeLinkIfCaseSensitive(link);

      const eventData = {
        ...evt,
        // use link domain & key from mysql instead of tinybird
        domain: link.domain,
        key: link.key,
        // timestamp is always in UTC
        timestamp: new Date(evt.timestamp + "Z"),
        click: clickEventSchema.parse({
          ...evt,
          id: evt.click_id,
          // normalize processed values
          region: evt.region_processed ?? "",
          refererUrl: evt.referer_url_processed ?? "",
        }),
        // transformLink -> add shortLink, qrCode, workspaceId, etc.
        link: transformLink(link, { skipDecodeKey: true }),
        ...(evt.event === "lead" || evt.event === "sale"
          ? {
              eventId: evt.event_id,
              eventName: evt.event_name,
              customer: customersMap[evt.customer_id]
                ? {
                    ...customersMap[evt.customer_id],
                    conversions: conversionsCountMap.get(evt.customer_id) || 0,
                  }
                : {
                    id: evt.customer_id,
                    name: "Deleted Customer",
                    email: "deleted@customer.com",
                    avatar: `${OG_AVATAR_URL}${evt.customer_id}&name=${encodeURIComponent("Deleted Customer")}`,
                    externalId: evt.customer_id,
                    createdAt: new Date("1970-01-01"),
                    conversions: conversionsCountMap.get(evt.customer_id) || 0,
                  },
              // Always include sale info for unified schema
              sale: {
                amount: evt.event === "sale" ? evt.saleAmount : 0,
                invoiceId: evt.event === "sale" ? evt.invoice_id : undefined,
                paymentProcessor:
                  evt.event === "sale" ? evt.payment_processor : "custom",
              },
              saleAmount: evt.event === "sale" ? evt.saleAmount : 0,
              // Back-compat optional fields
              ...(evt.event === "sale"
                ? {
                    invoice_id: evt.invoice_id,
                    payment_processor: evt.payment_processor,
                  }
                : {}),
            }
          : {}),
      };

      if (evt.event === "click") {
        return clickEventResponseSchema.parse(eventData);
      } else if (evt.event === "lead" || evt.event === "sale") {
        return unifiedEventResponseSchema.parse(eventData);
      }

      return eventData;
    })
    .filter((d) => d !== null);

  return events;
};

const getLinksMap = async (linkIds: string[]) => {
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
    {} as Record<string, Link>,
  );
};

const getCustomersMap = async (customerIds: string[]) => {
  if (customerIds.length === 0) {
    return {};
  }

  const customers = await prisma.customer.findMany({
    where: {
      id: {
        in: customerIds,
      },
    },
    select: {
      id: true,
      externalId: true,
      name: true,
      email: true,
      avatar: true,
      country: true,
      totalClicks: true,
      lastEventAt: true,
      createdAt: true,
      hotScore: true,
      lastHotScoreAt: true,
    },
  });

  return customers.reduce(
    (acc, customer) => {
      acc[customer.id] = CustomerSchema.parse({
        id: customer.id,
        externalId: customer.externalId || "",
        name: customer.name || customer.email || generateRandomName(),
        email: customer.email || "",
        avatar: customer.avatar || `${OG_AVATAR_URL}${customer.id}&name=${encodeURIComponent(customer.name || customer.email || '')}`,
        country: customer.country || "",
        totalClicks: customer.totalClicks ?? 0,
        lastEventAt: customer.lastEventAt ?? undefined,
        createdAt: customer.createdAt,
        hotScore: customer.hotScore ?? 0,
        lastHotScoreAt: customer.lastHotScoreAt ?? undefined,
      });
      return acc;
    },
    {} as Record<string, z.infer<typeof CustomerSchema>>,
  );
};
