import { recordStripePaymentIntentSale } from "../../../app/api/stripe/integration/webhook/utils";
import { getClickEvent } from "@/lib/tinybird";
import { stripe } from "@/lib/stripe";
import { prisma } from "@dub/prisma";
import type Stripe from "stripe";

/**
 * Processes a pending payment_intent.succeeded webhook with an attributed
 * clickId from a TY link hit.
 *
 * This is the "webhook-first then TY" path for platforms like Podia that use
 * PaymentIntents directly (not Checkout Sessions).
 */
export async function processStripePaymentIntentCompleted({
  clickId,
  workspaceId,
  payload,
}: {
  clickId: string;
  workspaceId: string;
  payload: unknown;
}): Promise<string> {
  console.log("[TY PI Handler] Processing pending payment_intent webhook", {
    clickId,
    workspaceId,
  });

  const event = payload as Stripe.Event;
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const stripeAccountId =
    (event.account as string) || "acct_1OKQowBN5sOoOmBU";
  const stripeCustomerId = paymentIntent.customer as string | null;

  console.log("[TY PI Handler] PaymentIntent details", {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount_received,
    currency: paymentIntent.currency,
    stripeAccountId,
    stripeCustomerId,
  });

  let stripeCustomerName: string | null = null;
  let stripeCustomerEmail: string | null = null;

  if (stripeCustomerId) {
    try {
      const stripeCustomer = await stripe.customers.retrieve(
        stripeCustomerId,
        { stripeAccount: stripeAccountId },
      );
      if (!("deleted" in stripeCustomer && stripeCustomer.deleted)) {
        stripeCustomerName = stripeCustomer.name ?? null;
        stripeCustomerEmail = stripeCustomer.email ?? null;
      }
      console.log("[TY PI Handler] Fetched customer from Stripe", {
        stripeCustomerId,
        hasEmail: !!stripeCustomerEmail,
        hasName: !!stripeCustomerName,
      });
    } catch (error) {
      console.log("[TY PI Handler] Could not fetch customer from Stripe", {
        stripeCustomerId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log("[TY PI Handler] Looking up click event", { clickId });
  const clickEventResult = await getClickEvent({ clickId });
  if (!clickEventResult || clickEventResult.data.length === 0) {
    console.log("[TY PI Handler] Click event not found", { clickId });
    return `Click event with pimms_id ${clickId} not found, skipping...`;
  }
  const clickEvent = clickEventResult.data[0];
  console.log("[TY PI Handler] Click event found", {
    clickId: clickEvent.click_id,
    linkId: clickEvent.link_id,
  });

  const existingCustomer = await prisma.customer.findFirst({
    where: {
      projectId: workspaceId,
      OR: [
        { externalId: clickEvent.click_id },
        ...(stripeCustomerEmail
          ? [{ externalId: stripeCustomerEmail }]
          : []),
      ],
    },
  });

  console.log("[TY PI Handler] Existing customer check", {
    found: !!existingCustomer,
    customerId: existingCustomer?.id,
  });

  console.log("[TY PI Handler] Recording sale");
  const result = await recordStripePaymentIntentSale({
    paymentIntent,
    workspaceId,
    stripeAccountId,
    stripeCustomerId,
    stripeCustomerName,
    stripeCustomerEmail,
    clickEvent,
    existingCustomer,
  });

  console.log("[TY PI Handler] Done", {
    result: result.substring(0, 100),
  });
  return result;
}
