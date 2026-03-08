import { handleTyReconciliation } from "@/lib/thankyou/reconcile";
import { getClickEvent } from "@/lib/tinybird";
import { stripe } from "@/lib/stripe";
import { prisma } from "@dub/prisma";
import type Stripe from "stripe";
import { recordStripePaymentIntentSale } from "./utils";

/**
 * Handle event "payment_intent.succeeded"
 *
 * Used by platforms like Podia that create PaymentIntents directly instead of
 * Checkout Sessions. Skips if a Checkout Session exists for this PI (to avoid
 * duplicate processing with checkout.session.completed).
 */
export async function paymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const stripeAccountId =
    (event.account as string) || "acct_1OKQowBN5sOoOmBU";

  console.log("[Stripe PI Webhook] Processing payment_intent.succeeded", {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount_received,
    currency: paymentIntent.currency,
    stripeAccountId,
  });

  // Skip if this PaymentIntent was created by a Checkout Session
  // (checkout.session.completed handler will process it instead)
  try {
    const sessions = await stripe.checkout.sessions.list(
      { payment_intent: paymentIntent.id, limit: 1 },
      { stripeAccount: stripeAccountId },
    );
    if (sessions.data.length > 0) {
      console.log(
        "[Stripe PI Webhook] Checkout Session exists, deferring to checkout.session.completed",
        { sessionId: sessions.data[0].id },
      );
      return "Payment handled by checkout.session.completed, skipping...";
    }
  } catch (error) {
    console.log(
      "[Stripe PI Webhook] Could not check for Checkout Sessions, continuing",
      { error: error instanceof Error ? error.message : String(error) },
    );
  }

  // Look up workspace
  const workspace = await prisma.project.findUnique({
    where: { stripeConnectId: stripeAccountId },
    select: { id: true },
  });

  if (!workspace) {
    console.error("[Stripe PI Webhook] Workspace not found", {
      stripeAccountId,
    });
    return `Workspace with stripeConnectId ${stripeAccountId} not found, skipping...`;
  }

  console.log("[Stripe PI Webhook] Workspace found", {
    workspaceId: workspace.id,
  });

  // Fetch customer details from Stripe (PI only has customer ID, no email/name)
  let stripeCustomerName: string | null = null;
  let stripeCustomerEmail: string | null = null;
  const stripeCustomerId = paymentIntent.customer as string | null;

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
    } catch (error) {
      console.log("[Stripe PI Webhook] Could not fetch customer", {
        stripeCustomerId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log("[Stripe PI Webhook] Customer details", {
    stripeCustomerId,
    hasEmail: !!stripeCustomerEmail,
    hasName: !!stripeCustomerName,
  });

  // Check for pimmsCustomerId in PI metadata (direct integration path)
  const pimmsClickId = paymentIntent.metadata?.pimmsClickId || null;

  let clickId: string | null = pimmsClickId;

  if (!clickId) {
    // TY reconciliation: match with a waiting TY link click or store as pending
    console.log(
      "[Stripe PI Webhook] No pimmsClickId, attempting TY reconciliation",
    );
    const result = await handleTyReconciliation({
      workspaceId: workspace.id,
      provider: "stripe-payment-intent",
      payload: event,
      failedReason:
        "pimmsClickId not found in PaymentIntent metadata (platform like Podia)",
    });

    if (result.shouldReturnEarly) {
      console.log(
        "[Stripe PI Webhook] TY reconciliation: webhook stored, returning early",
      );
      return "OK";
    }
    clickId = result.pimmsId;
  }

  console.log("[Stripe PI Webhook] Looking up click event", { clickId });
  const clickEventResult = await getClickEvent({ clickId });
  const clickEvent = clickEventResult?.data[0];

  if (!clickEvent) {
    console.error("[Stripe PI Webhook] Click event not found", { clickId });
    return `Click event with pimms_id ${clickId} not found, skipping...`;
  }

  console.log("[Stripe PI Webhook] Click event found", {
    clickId: clickEvent.click_id,
    linkId: clickEvent.link_id,
  });

  // Find existing customer
  const existingCustomer = await prisma.customer.findFirst({
    where: {
      projectId: workspace.id,
      OR: [
        { externalId: clickEvent.click_id },
        ...(stripeCustomerEmail
          ? [{ externalId: stripeCustomerEmail }]
          : []),
      ],
    },
  });

  console.log("[Stripe PI Webhook] Existing customer check", {
    found: !!existingCustomer,
    customerId: existingCustomer?.id,
  });

  console.log("[Stripe PI Webhook] Recording sale");
  const result = await recordStripePaymentIntentSale({
    paymentIntent,
    workspaceId: workspace.id,
    stripeAccountId,
    stripeCustomerId,
    stripeCustomerName,
    stripeCustomerEmail,
    clickEvent,
    existingCustomer,
  });

  console.log("[Stripe PI Webhook] Done", {
    result: result.substring(0, 100),
  });
  return result;
}
