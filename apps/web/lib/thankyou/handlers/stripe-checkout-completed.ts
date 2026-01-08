import { recordStripeCheckoutSale } from "../../../app/api/stripe/integration/webhook/utils";
import { getClickEvent } from "@/lib/tinybird";
import { prisma } from "@dub/prisma";
import type Stripe from "stripe";

/**
 * Processes a pending Stripe checkout.session.completed webhook with an attributed clickId.
 * This directly records the sale with opt-in tracking (creating lead + customer if needed).
 */
export async function processStripeCheckoutCompleted({
  clickId,
  workspaceId,
  payload,
}: {
  clickId: string;
  workspaceId: string;
  payload: unknown;
}): Promise<string> {
  const event = payload as Stripe.Event;
  const charge = event.data.object as Stripe.Checkout.Session;
  const stripeAccountId = event.account as string || "acct_1OKQowBN5sOoOmBU";
  const stripeCustomerId = charge.customer as string;
  const stripeCustomerName = charge.customer_details?.name || null;
  const stripeCustomerEmail = charge.customer_details?.email || null;

  // Get click event
  const clickEventResult = await getClickEvent({ clickId });
  if (!clickEventResult || clickEventResult.data.length === 0) {
    return `Click event with pimms_id ${clickId} not found, skipping...`;
  }

  const clickEvent = clickEventResult.data[0];

  // Find existing customer
  const existingCustomer = await prisma.customer.findFirst({
    where: {
      projectId: workspaceId,
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

  // Record the sale using the utility function
  // This will create/update customer, create lead event, and record the sale
  return await recordStripeCheckoutSale({
    charge,
    workspaceId,
    stripeAccountId,
    stripeCustomerId,
    stripeCustomerName,
    stripeCustomerEmail,
    clickEvent,
    existingCustomer,
  });
}
