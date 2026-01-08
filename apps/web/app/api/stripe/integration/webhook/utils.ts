import { convertCurrency } from "@/lib/analytics/convert-currency";
import { createId } from "@/lib/api/create-id";
import { includeTags } from "@/lib/api/links/include-tags";
import { generateRandomName } from "@/lib/names";
import {
  getClickEvent,
  recordLead,
  recordSale,
} from "@/lib/tinybird";
import { redis } from "@/lib/upstash";
import { computeAnonymousCustomerFields } from "@/lib/webhook/custom";
import { sendWorkspaceWebhook } from "@/lib/webhook/publish";
import { computeCustomerHotScore } from "@/lib/analytics/compute-customer-hot-score";
import {
  transformLeadEventData,
  transformSaleEventData,
} from "@/lib/webhook/transform";
import { prisma } from "@dub/prisma";
import { nanoid } from "@dub/utils";
import { waitUntil } from "@vercel/functions";
import type Stripe from "stripe";
import { Customer } from "@dub/prisma/client";
import z from "@/lib/zod";
import { clickEventSchemaTB } from "@/lib/zod/schemas/clicks";
import { leadEventSchemaTB } from "@/lib/zod/schemas/leads";

export async function createNewCustomer(event: Stripe.Event) {
  const stripeCustomer = event.data.object as Stripe.Customer;
  const stripeAccountId = event.account as string;
  const pimmsCustomerExternalId = stripeCustomer.metadata?.pimmsCustomerId;
  const clickId = stripeCustomer.metadata?.pimmsClickId;

  // The client app should always send pimmsClickId (pimms_id) via metadata
  if (!clickId) {
    return "Click ID not found in Stripe customer metadata, skipping...";
  }

  // Find click
  const clickEvent = await getClickEvent({ clickId });
  if (!clickEvent || clickEvent.data.length === 0) {
    return `Click event with ID ${clickId} not found, skipping...`;
  }

  const clickData = clickEvent.data[0];

  // Find link
  const linkId = clickData.link_id;
  const link = await prisma.link.findUnique({
    where: {
      id: linkId,
    },
  });

  if (!link || !link.projectId) {
    return `Link with ID ${linkId} not found or does not have a project, skipping...`;
  }

  const workspaceId = link.projectId;

  // Create a new customer
  const { anonymousId, totalClicks } =
    await computeAnonymousCustomerFields(clickData);

  const customer = await prisma.customer.create({
    data: {
      id: createId({ prefix: "cus_" }),
      name: stripeCustomer.name || generateRandomName(),
      email: stripeCustomer.email,
      stripeCustomerId: stripeCustomer.id,
      projectConnectId: stripeAccountId,
      externalId: pimmsCustomerExternalId,
      projectId: workspaceId,
      linkId,
      clickId,
      lastActivityLinkId: linkId,
      lastActivityType: "lead",
      clickedAt: new Date(clickData.timestamp + "Z"),
      country: clickData.country,
      anonymousId,
      totalClicks,
      lastEventAt: new Date(),
    },
  });

  const eventName = "New customer";

  const leadData = {
    ...clickData,
    event_id: nanoid(16),
    event_name: eventName,
    customer_id: customer.id,
  };

  const [_lead, linkUpdated, workspace] = await Promise.all([
    // Record lead
    recordLead(leadData),

    // update link leads count
    prisma.link.update({
      where: {
        id: linkId,
      },
      data: {
        leads: {
          increment: 1,
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
        usage: {
          increment: 1,
        },
      },
    }),
  ]);

  waitUntil(
    (async () => {
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          hotScore: await computeCustomerHotScore(customer.id, workspaceId),
          lastHotScoreAt: new Date(),
        },
      });

      await sendWorkspaceWebhook({
        trigger: "lead.created",
        workspace,
        data: transformLeadEventData({
          ...clickData,
          eventName,
          link: linkUpdated,
          customer,
        }),
      });
    })(),
  );

  return `New PIMMS customer created: ${customer.id}. Lead event recorded: ${leadData.event_id}`;
}

/**
 * Records a sale from a Stripe checkout session, handling customer creation/update,
 * lead event creation, sale recording, and all related updates and webhooks.
 * This function can handle both new customers (from click events) and existing customers.
 */
export async function recordStripeCheckoutSale({
  charge,
  workspaceId,
  stripeAccountId,
  stripeCustomerId,
  stripeCustomerName,
  stripeCustomerEmail,
  clickEvent,
  existingCustomer,
}: {
  charge: Stripe.Checkout.Session;
  workspaceId: string;
  stripeAccountId: string;
  stripeCustomerId: string | null;
  stripeCustomerName: string | null;
  stripeCustomerEmail: string | null;
  clickEvent: z.infer<typeof clickEventSchemaTB> | null;
  existingCustomer: Customer | null;
}) {
  console.log("[Stripe Sale] Recording sale from checkout", {
    workspaceId,
    hasClickEvent: !!clickEvent,
    hasExistingCustomer: !!existingCustomer,
    invoiceId: charge.invoice,
  });

  let customer: Customer;
  let leadEvent: z.infer<typeof leadEventSchemaTB>;
  let linkId: string;

  // If we have a clickEvent, create/update customer from it
  if (!clickEvent) {
    throw new Error(
      "clickEvent is required for recording sale from checkout session",
    );
  }

  // If existingCustomer was passed, use it; otherwise look it up
  // This avoids duplicate queries when called from checkout-session-completed.ts
  if (!existingCustomer) {
    existingCustomer = await prisma.customer.findFirst({
      where: {
        projectId: workspaceId,
        // check for existing customer with the same externalId (via clickId or email)
        // TODO: should we support checks for email and stripeCustomerId too?
        OR: [
          {
            externalId: clickEvent.click_id,
          },
          {
            externalId: stripeCustomerEmail,
          },
        ],
      },
    });
  }

  const { anonymousId, totalClicks } =
    await computeAnonymousCustomerFields(clickEvent);

  const payload = {
    name: stripeCustomerName,
    email: stripeCustomerEmail,
    // stripeCustomerId can potentially be null, so we use email as fallback
    externalId: stripeCustomerId || stripeCustomerEmail,
    projectId: workspaceId,
    projectConnectId: stripeAccountId,
    stripeCustomerId,
    clickId: clickEvent.click_id,
    linkId: clickEvent.link_id,
    lastActivityLinkId: clickEvent.link_id,
    lastActivityType: "lead",
    country: clickEvent.country,
    clickedAt: new Date(clickEvent.timestamp + "Z"),
    anonymousId,
    totalClicks,
    lastEventAt: new Date(),
  };

  if (existingCustomer) {
    console.log("[Stripe Sale] Updating existing customer", {
      customerId: existingCustomer.id,
    });
    customer = await prisma.customer.update({
      where: {
        id: existingCustomer.id,
      },
      data: payload,
    });
  } else {
    console.log("[Stripe Sale] Creating new customer");
    customer = await prisma.customer.create({
      data: {
        id: createId({ prefix: "cus_" }),
        ...payload,
      },
    });
    console.log("[Stripe Sale] Customer created", {
      customerId: customer.id,
    });
  }

  // remove timestamp from clickEvent
  const { timestamp, ...rest } = clickEvent;
  leadEvent = {
    ...rest,
    event_id: nanoid(16),
    event_name: "Register",
    customer_id: customer.id,
    metadata: "",
  };

  if (!existingCustomer) {
    console.log("[Stripe Sale] Recording lead event", {
      leadEventId: leadEvent.event_id,
    });
    await recordLead(leadEvent);
  } else {
    console.log("[Stripe Sale] Skipping lead recording (existing customer)");
  }

  linkId = clickEvent.link_id;

  // Record the sale (with clickEvent context - new lead was created if no existing customer)
  console.log("[Stripe Sale] Recording sale from checkout");
  const result = await recordSaleFromCheckout({
    charge,
    customer,
    leadEvent,
    linkId,
    workspaceId,
    stripeCustomerId,
    clickEvent: clickEvent,
    existingCustomer: !!existingCustomer,
  });
  console.log("[Stripe Sale] Sale recorded successfully");
  return result;
}

/**
 * Records a sale from a Stripe checkout session when customer and leadEvent already exist.
 * Used for the pimmsCustomerId path where we already have the customer.
 */
export async function recordStripeCheckoutSaleFromExistingCustomer({
  charge,
  customer,
  leadEvent,
  linkId,
  workspaceId,
  stripeCustomerId,
}: {
  charge: Stripe.Checkout.Session;
  customer: Customer;
  leadEvent: z.infer<typeof leadEventSchemaTB>;
  linkId: string;
  workspaceId: string;
  stripeCustomerId: string | null;
}) {
  console.log("[Stripe Sale] Recording sale from existing customer", {
    customerId: customer.id,
    linkId,
    workspaceId,
    invoiceId: charge.invoice,
  });
  // Record the sale (no clickEvent context - customer and lead already existed)
  const result = await recordSaleFromCheckout({
    charge,
    customer,
    leadEvent,
    linkId,
    workspaceId,
    stripeCustomerId,
    clickEvent: null,
    existingCustomer: true, // We know the customer existed
  });
  console.log("[Stripe Sale] Sale recorded successfully from existing customer");
  return result;
}

/**
 * Internal function that handles the actual sale recording logic.
 * This is shared between both paths (with and without clickEvent).
 */
async function recordSaleFromCheckout({
  charge,
  customer,
  leadEvent,
  linkId,
  workspaceId,
  stripeCustomerId,
  clickEvent,
  existingCustomer,
}: {
  charge: Stripe.Checkout.Session;
  customer: Customer;
  leadEvent: z.infer<typeof leadEventSchemaTB>;
  linkId: string;
  workspaceId: string;
  stripeCustomerId: string | null;
  clickEvent: z.infer<typeof clickEventSchemaTB> | null;
  existingCustomer: boolean;
}) {
  console.log("[Stripe Sale] recordSaleFromCheckout called", {
    invoiceId: charge.invoice,
    amountTotal: charge.amount_total,
    mode: charge.mode,
    customerId: customer.id,
    linkId,
  });

  const invoiceId = charge.invoice as string;

  if (charge.amount_total === 0) {
    console.log("[Stripe Sale] Skipping: amount is 0");
    return `Checkout session completed for Stripe customer ${stripeCustomerId} with invoice ID ${invoiceId} but amount is 0, skipping...`;
  }

  if (charge.mode === "setup") {
    console.log("[Stripe Sale] Skipping: mode is setup");
    return `Checkout session completed for Stripe customer ${stripeCustomerId} but mode is setup, skipping...`;
  }

  if (invoiceId) {
    // Skip if invoice id is already processed
    console.log("[Stripe Sale] Checking invoice deduplication", {
      invoiceId,
    });
    const ok = await redis.set(`pimms_sale_events:invoiceId:${invoiceId}`, 1, {
      ex: 60 * 60 * 24 * 7,
      nx: true,
    });

    if (!ok) {
      console.log("[Stripe Sale] Skipping: invoice already processed", {
        invoiceId,
      });
      return `Invoice with ID ${invoiceId} already processed, skipping...`;
    }
    console.log("[Stripe Sale] Invoice not processed before, continuing");
  }

  if (charge.currency && charge.currency !== "usd" && charge.amount_total) {
    // support for Stripe Adaptive Pricing: https://docs.stripe.com/payments/checkout/adaptive-pricing
    if (charge.currency_conversion) {
      charge.currency = charge.currency_conversion.source_currency;
      charge.amount_total = charge.currency_conversion.amount_total;

      // if Stripe Adaptive Pricing is not enabled, we convert the amount to USD based on the current FX rate
      // TODO: allow custom "defaultCurrency" on workspace table in the future
    } else {
      const { currency: convertedCurrency, amount: convertedAmount } =
        await convertCurrency({
          currency: charge.currency,
          amount: charge.amount_total,
        });

      charge.currency = convertedCurrency;
      charge.amount_total = convertedAmount;
    }
  }

  const eventId = nanoid(16);

  const saleData = {
    ...leadEvent,
    event_id: eventId,
    // if the charge is a one-time payment, we set the event name to "Purchase"
    event_name:
      charge.mode === "payment" ? "Purchase" : "Subscription creation",
    payment_processor: "stripe",
    amount: charge.amount_total!,
    currency: charge.currency!,
    invoice_id: invoiceId || "",
    metadata: JSON.stringify({
      charge,
    }),
  };

  console.log("saleData", saleData);

  const link = await prisma.link.findUnique({
    where: {
      id: linkId,
    },
  });

  const [_sale, linkUpdated, workspace] = await Promise.all([
    recordSale(saleData),

    // update link sales count
    link &&
      prisma.link.update({
        where: {
          id: link.id,
        },
        data: {
          // if the clickEvent variable exists, it means that a new lead was created
          ...(clickEvent && {
            leads: {
              increment: 1,
            },
          }),
          sales: {
            increment: 1,
          },
          saleAmount: {
            increment: charge.amount_total!,
          },
        },
        include: includeTags,
      }),

    // update workspace sales usage
    prisma.project.update({
      where: {
        id: customer.projectId,
      },
      data: {
        usage: {
          increment: clickEvent ? 2 : 1,
        },
        salesUsage: {
          increment: charge.amount_total!,
        },
      },
    }),
  ]);

  waitUntil(
    (async () => {
      // update customer hot score
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          hotScore: await computeCustomerHotScore(customer.id, workspaceId),
          lastHotScoreAt: new Date(),
          lastEventAt: new Date(),
          lastActivityLinkId: linkId,
          lastActivityType: "sale",
        },
      });

      // if the clickEvent variable exists and there was no existing customer before,
      // we send a lead.created webhook
      if (clickEvent && !existingCustomer) {
        await sendWorkspaceWebhook({
          trigger: "lead.created",
          workspace,
          data: transformLeadEventData({
            ...clickEvent,
            eventName: "Checkout session completed",
            link: linkUpdated,
            customer,
          }),
        });
      }

      // send workspace webhook
      await sendWorkspaceWebhook({
        trigger: "sale.created",
        workspace,
        data: transformSaleEventData({
          ...saleData,
          clickedAt: customer.clickedAt || customer.createdAt,
          link: linkUpdated,
          customer,
        }),
      });
    })(),
  );

  return `Sale recorded for customer ${customer.id} with invoice ID ${invoiceId}`;
}
