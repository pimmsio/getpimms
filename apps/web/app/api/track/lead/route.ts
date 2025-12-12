import { computeCustomerHotScore } from "@/lib/analytics/compute-customer-hot-score";
import { createId } from "@/lib/api/create-id";
import { DubApiError } from "@/lib/api/errors";
import { includeTags } from "@/lib/api/links/include-tags";
import { parseRequestBody } from "@/lib/api/utils";
import { withWorkspace } from "@/lib/auth";
import { generateRandomName } from "@/lib/names";
import { createPartnerCommission } from "@/lib/partners/create-partner-commission";
import { getClickEvent, recordLead, recordLeadSync } from "@/lib/tinybird";
import { logConversionEvent } from "@/lib/tinybird/log-conversion-events";
import { redis } from "@/lib/upstash";
import { computeAnonymousCustomerFields } from "@/lib/webhook/custom";
import { sendWorkspaceWebhook } from "@/lib/webhook/publish";
import { transformLeadEventData } from "@/lib/webhook/transform";
import { clickEventSchemaTB } from "@/lib/zod/schemas/clicks";
import {
  trackLeadRequestSchema,
  trackLeadResponseSchema,
} from "@/lib/zod/schemas/leads";
import { prisma } from "@dub/prisma";
import { nanoid } from "@dub/utils";
import { Customer } from "@prisma/client";
import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";
import { z } from "zod";

type ClickData = z.infer<typeof clickEventSchemaTB>;

// POST /api/track/lead – Track a lead conversion event
export const POST = withWorkspace(
  async ({ req, workspace }) => {
    const userAgent = req.headers.get("user-agent")?.toLowerCase() || "";

    const body = await parseRequestBody(req);

    const {
      clickId,
      eventName,
      eventQuantity,
      externalId,
      customerId, // deprecated (but we'll support it for backwards compatibility)
      customerName,
      customerEmail,
      customerAvatar,
      metadata,
      mode = "async", // Default to async mode if not specified
    } = trackLeadRequestSchema.parse(body);

    console.log("workspace.id", workspace.id);
    console.log("mode", mode);
    console.log("body.clickId", clickId);

    const stringifiedEventName = eventName.toLowerCase().replace(" ", "-");
    const customerExternalId = externalId || customerId;
    const finalCustomerName =
      customerName || customerEmail || generateRandomName();

    console.log("customerExternalId", customerExternalId);
    console.log("finalCustomerName", finalCustomerName);
    console.log("customerEmail", customerEmail);
    console.log("stringifiedEventName", stringifiedEventName);

    if (!customerExternalId) {
      throw new DubApiError({
        code: "bad_request",
        message: "externalId is required",
      });
    }

    const workspaceId = workspace.id;

    // deduplicate lead events – only record 1 unique event for the same customer and event name
    const ok = await redis.set(
      `trackLead:${workspaceId}:${customerExternalId}:${stringifiedEventName}`,
      {
        timestamp: Date.now(),
        clickId,
        eventName,
        customerExternalId,
        customerName,
        customerEmail,
        customerAvatar,
      },
      {
        nx: true,
      },
    );

    console.log("deduplicated lead event", ok);

    if (ok) {
      // Find click event
      let clickData: ClickData | null = null;
      const clickEvent = await getClickEvent({ clickId });

      if (clickEvent && clickEvent.data && clickEvent.data.length > 0) {
        clickData = clickEvent.data[0];
      }

      console.log("clickData", clickData);

      if (!clickData) {
        const cachedClickData = await redis.get<ClickData>(
          `clickCache:${clickId}`,
        );

        if (cachedClickData) {
          clickData = {
            ...cachedClickData,
            timestamp: cachedClickData.timestamp
              .replace("T", " ")
              .replace("Z", ""),
            qr: cachedClickData.qr ? 1 : 0,
            bot: cachedClickData.bot ? 1 : 0,
          };
        }
      }

      if (!clickData) {
        console.log("clickData not found, checking cache");
        if (userAgent.includes("zapier") || userAgent.includes("make")) {
          return NextResponse.json(
            {
              success: false,
              error: `Click event not found for clickId: ${clickId}`,
            },
            { status: 200 },
          );
        }

        throw new DubApiError({
          code: "not_found",
          message: `Click event not found for clickId: ${clickId}`,
        });
      }

      const leadEventId = nanoid(16);

      // Prefetch anonymous fields using shared util
      const { anonymousId, totalClicks } =
        await computeAnonymousCustomerFields(clickData);

      console.log("anonymousId", anonymousId);
      console.log("totalClicks", totalClicks);

      // Create a function to handle customer upsert to avoid duplication
      const upsertCustomer = async () => {
        return prisma.customer.upsert({
          where: {
            projectId_externalId: {
              projectId: workspaceId,
              externalId: customerExternalId,
            },
          },
          create: {
            id: createId({ prefix: "cus_" }),
            name: finalCustomerName,
            email: customerEmail,
            avatar: customerAvatar,
            externalId: customerExternalId,
            projectId: workspaceId,
            projectConnectId: workspace.stripeConnectId,
            clickId: clickData.click_id,
            linkId: clickData.link_id,
            country: clickData.country,
            clickedAt: new Date(clickData.timestamp + "Z"),
            anonymousId,
            totalClicks,
            lastEventAt: new Date(),
          },
          update: {}, // no updates needed if the customer exists
        });
      };

      // Create a function to prepare the lead event payload
      const createLeadEventPayload = (customerId: string) => {
        const basePayload = {
          ...clickData,
          event_id: leadEventId,
          event_name: eventName,
          customer_id: customerId,
          metadata: metadata ? JSON.stringify(metadata) : "",
        };

        return eventQuantity
          ? Array(eventQuantity)
              .fill(null)
              .map(() => ({
                ...basePayload,
                event_id: nanoid(16),
              }))
          : basePayload;
      };

      let customer: Customer | undefined;

      // Handle customer creation and lead recording based on mode
      if (mode === "wait") {
        // Execute customer creation synchronously
        customer = await upsertCustomer();

        console.log("customer upserted", customer);

        const leadEventPayload = createLeadEventPayload(customer.id);
        const cacheLeadEventPayload = Array.isArray(leadEventPayload)
          ? leadEventPayload[0]
          : leadEventPayload;

        console.log("leadEventPayload", leadEventPayload);

        await Promise.all([
          // Use recordLeadSync which waits for the operation to complete
          recordLeadSync(leadEventPayload),

          // Cache the latest lead event for 5 minutes because the ingested event is not available immediately on Tinybird
          // we're setting two keys because we want to support the use case where the customer has multiple lead events
          redis.set(`leadCache:${customer.id}`, cacheLeadEventPayload, {
            ex: 60 * 5,
          }),
          redis.set(
            `leadCache:${customer.id}:${stringifiedEventName}`,
            cacheLeadEventPayload,
            {
              ex: 60 * 5,
            },
          ),
        ]);
      }

      waitUntil(
        (async () => {
          // For async mode, create customer in the background
          if (mode === "async") {
            customer = await upsertCustomer();

            console.log("customer upserted", customer);

            const leadEventPayload = createLeadEventPayload(customer.id);
            console.log("leadEventPayload", leadEventPayload);

            // Use recordLead which doesn't wait
            await recordLead(leadEventPayload);
          }

          // Always process link/project updates, partner rewards, and webhooks in the background
          const [link, ] = await Promise.all([
            // update link leads count
            prisma.link.update({
              where: {
                id: clickData.link_id,
              },
              data: {
                leads: {
                  increment: eventQuantity ?? 1,
                },
              },
              include: includeTags,
            }),

            // update workspace usage
            prisma.project.update({
              where: {
                id: workspaceId,
              },
              data: {
                leadsUsage: {
                  increment: eventQuantity ?? 1,
                },
                eventsUsage: {
                  increment: eventQuantity ?? 1,
                },
                totalEvents: {
                  increment: eventQuantity ?? 1,
                },
              },
            }),

            logConversionEvent({
              workspace_id: workspaceId,
              link_id: clickData.link_id,
              path: "/track/lead",
              body: JSON.stringify(body),
            }),
          ]);

          if (link.programId && link.partnerId) {
            await createPartnerCommission({
              event: "lead",
              programId: link.programId,
              partnerId: link.partnerId,
              linkId: link.id,
              eventId: leadEventId,
              customerId: customer?.id,
              quantity: eventQuantity ?? 1,
            });
          }

          // update customer hot score
          if (customer) {
            const hotScore = await computeCustomerHotScore(customer.id, workspaceId);
            console.log("update customer hot score", hotScore);

            await prisma.customer.update({
              where: { id: customer.id },
              data: {
                hotScore,
                lastHotScoreAt: new Date(),
              },
            });
          }

          await sendWorkspaceWebhook({
            trigger: "lead.created",
            data: transformLeadEventData({
              ...clickData,
              eventName,
              link,
              customer,
            }),
            workspace,
          });
        })(),
      );
    }

    const lead = trackLeadResponseSchema.parse({
      click: {
        id: clickId,
      },
      customer: {
        name: finalCustomerName,
        email: customerEmail,
        avatar: customerAvatar,
        externalId: customerExternalId,
      },
    });

    console.log("new lead", lead);

    return NextResponse.json({
      ...lead,
      // for backwards compatibility – will remove soon
      clickId,
      customerName: finalCustomerName,
      customerEmail: customerEmail,
      customerAvatar: customerAvatar,
    });
  },
  {
    requiredPlan: [
      "free",
      "starter",
      "pro",
      "business",
      "business plus",
      "business extra",
      "business max",
      "advanced",
      "enterprise",
    ],
    requiredPermissions: ["lead.write"],
  },
);
