import { convertCurrency } from "@/lib/analytics/convert-currency";
import { DubApiError } from "@/lib/api/errors";
import { includeTags } from "@/lib/api/links/include-tags";
import { parseRequestBody } from "@/lib/api/utils";
import { withWorkspace } from "@/lib/auth";
import { getLeadEvent, recordSale } from "@/lib/tinybird";
import { logConversionEvent } from "@/lib/tinybird/log-conversion-events";
import { redis } from "@/lib/upstash";
import { sendWorkspaceWebhook } from "@/lib/webhook/publish";
import { transformSaleEventData } from "@/lib/webhook/transform";
import { clickEventSchemaTB } from "@/lib/zod/schemas/clicks";
import { leadEventSchemaTB } from "@/lib/zod/schemas/leads";
import {
  trackSaleRequestSchema,
  trackSaleResponseSchema,
} from "@/lib/zod/schemas/sales";
import { prisma } from "@dub/prisma";
import { nanoid } from "@dub/utils";
import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";
import { z } from "zod";

type LeadEvent = z.infer<typeof leadEventSchemaTB>;

// POST /api/track/sale – Track a sale conversion event
export const POST = withWorkspace(
  async ({ req, workspace }) => {
    const userAgent = req.headers.get("user-agent")?.toLowerCase() || "";

    console.log("workspace.id", workspace.id);

    const body = await parseRequestBody(req);

    console.log("body", body);

    let {
      externalId,
      customerId, // deprecated
      paymentProcessor,
      invoiceId,
      amount,
      currency,
      metadata,
      eventName,
      leadEventName,
    } = trackSaleRequestSchema.parse(body);

    if (invoiceId) {
      // Skip if invoice id is already processed
      const ok = await redis.set(`dub_sale_events:invoiceId:${invoiceId}`, 1, {
        ex: 60 * 60 * 24 * 7,
        nx: true,
      });

      if (!ok) {
        return NextResponse.json({
          eventName,
          customer: null,
          sale: null,
        });
      }
    }

    const customerExternalId = customerId || externalId;

    console.log("customerExternalId", customerExternalId);

    if (!customerExternalId) {
      throw new DubApiError({
        code: "bad_request",
        message: "externalId is required",
      });
    }

    // Find customer
    const customer = await prisma.customer.findUnique({
      where: {
        projectId_externalId: {
          projectId: workspace.id,
          externalId: customerExternalId,
        },
      },
    });

    console.log("customer", customer);

    if (!customer) {
      waitUntil(
        logConversionEvent({
          workspace_id: workspace.id,
          path: "/track/sale",
          body: JSON.stringify(body),
          error: `Customer not found for externalId: ${customerExternalId}`,
        }),
      );

      return NextResponse.json({
        eventName,
        customer: null,
        sale: null,
      });
    }

    console.log("leadEventName", leadEventName);

    // Find lead event
    const leadEvent = await getLeadEvent({
      customerId: customer.id,
      eventName: leadEventName,
    });

    console.log("leadEvent", leadEvent);

    let leadEventData: LeadEvent | null = null;

    if (!leadEvent || leadEvent.data.length === 0) {
      // Check cache to see if the lead event exists
      // if leadEventName is provided, we only check for that specific event
      // otherwise, we check for all cached lead events for that customer

      const cachedLeadEvent = await redis.get<LeadEvent>(
        `leadCache:${customer.id}${leadEventName ? `:${leadEventName.toLowerCase().replace(" ", "-")}` : ""}`,
      );

      if (!cachedLeadEvent) {
        console.log("cachedLeadEvent not found, checking cache");
        if (userAgent.includes("zapier") || userAgent.includes("make")) {
          return NextResponse.json(
            {
              success: false,
              error: `Lead event not found for externalId: ${customerExternalId} and eventName: ${leadEventName}`,
            },
            { status: 200 },
          );
        }

        throw new DubApiError({
          code: "not_found",
          message: `Lead event not found for externalId: ${customerExternalId} and eventName: ${leadEventName}`,
        });
      }

      leadEventData = cachedLeadEvent;
    } else {
      leadEventData = leadEvent.data[0];
    }

    console.log("leadEventData", leadEventData);

    const clickData = clickEventSchemaTB
      .omit({ timestamp: true })
      .parse(leadEventData);

    console.log("clickData", clickData);

    // if currency is not USD, convert it to USD  based on the current FX rate
    // TODO: allow custom "defaultCurrency" on workspace table in the future
    if (currency !== "usd") {
      const { currency: convertedCurrency, amount: convertedAmount } =
        await convertCurrency({ currency, amount });

      currency = convertedCurrency;
      amount = convertedAmount;
    }

    console.log("currency", currency);
    console.log("amount", amount);

    const eventId = nanoid(16);

    const saleData = {
      ...clickData,
      event_id: eventId,
      event_name: eventName,
      customer_id: customer.id,
      payment_processor: paymentProcessor,
      amount,
      currency,
      invoice_id: invoiceId || "",
      metadata: metadata ? JSON.stringify(metadata) : "",
    };

    console.log("saleData", saleData);

    waitUntil(
      (async () => {
        const [_sale, link, _project] = await Promise.all([
          recordSale(saleData),

          // update link sales count
          prisma.link.update({
            where: {
              id: clickData.link_id,
            },
            data: {
              sales: {
                increment: 1,
              },
              saleAmount: {
                increment: amount,
              },
            },
            include: includeTags,
          }),
          // update workspace sales usage
          prisma.project.update({
            where: {
              id: workspace.id,
            },
            data: {
              usage: {
                increment: 1,
              },
              salesUsage: {
                increment: amount,
              },
            },
          }),

          prisma.customer.update({
            where: { id: customer.id },
            data: {
              lastEventAt: new Date(),
              lastActivityLinkId: clickData.link_id,
              lastActivityType: "sale",
            },
          }),

          logConversionEvent({
            workspace_id: workspace.id,
            link_id: clickData.link_id,
            path: "/track/sale",
            body: JSON.stringify(body),
          }),
        ]);

        // Send workspace webhook
        const sale = transformSaleEventData({
          ...saleData,
          clickedAt: customer.clickedAt || customer.createdAt,
          link,
          customer,
        });

        await sendWorkspaceWebhook({
          trigger: "sale.created",
          data: sale,
          workspace,
        });
      })(),
    );

    const sale = trackSaleResponseSchema.parse({
      eventName,
      customer,
      sale: {
        amount,
        currency,
        invoiceId,
        paymentProcessor,
        metadata,
      },
    });

    console.log("new sale response", sale);

    return NextResponse.json({
      ...sale,
      // for backwards compatibility – will remove soon
      amount,
      currency,
      invoiceId,
      paymentProcessor,
      metadata,
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
    requiredPermissions: ["sale.write"],
  },
);
