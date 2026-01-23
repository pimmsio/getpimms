import { handleTyReconciliation } from "@/lib/thankyou/reconcile";
import { getClickEvent, getLeadEvent } from "@/lib/tinybird";
import { prisma } from "@dub/prisma";
import { Customer } from "@dub/prisma/client";
import z from "@/lib/zod";
import { clickEventSchemaTB } from "@/lib/zod/schemas/clicks";
import { leadEventSchemaTB } from "@/lib/zod/schemas/leads";
import type Stripe from "stripe";
import {
  recordStripeCheckoutSale,
  recordStripeCheckoutSaleFromExistingCustomer,
} from "./utils";

// Handle event "checkout.session.completed"
export async function checkoutSessionCompleted(event: Stripe.Event) {
  console.log("[Stripe Webhook] Processing checkout.session.completed event");
  
  const charge = event.data.object as Stripe.Checkout.Session;
  const pimmsCustomerId = charge.metadata?.pimmsCustomerId;
  const clientReferenceId = charge.client_reference_id;
  const stripeAccountId = event.account as string || "acct_1OKQowBN5sOoOmBU";
  const stripeCustomerId = charge.customer as string;
  const stripeCustomerName = charge.customer_details?.name;
  const stripeCustomerEmail = charge.customer_details?.email;

  console.log("[Stripe Webhook] Extracted data", {
    hasPimmsCustomerId: !!pimmsCustomerId,
    hasClientReferenceId: !!clientReferenceId,
    stripeAccountId,
    hasStripeCustomerId: !!stripeCustomerId,
    hasCustomerEmail: !!stripeCustomerEmail,
  });

  let customer: Customer;
  let existingCustomer: Customer | null = null;
  let clickEvent: z.infer<typeof clickEventSchemaTB> | null = null;
  let leadEvent: z.infer<typeof leadEventSchemaTB>;
  let linkId: string;

  /*
    for regular stripe checkout setup:
    - if pimmsCustomerId is found, we update the customer with the stripe customerId
    - we then find the lead event using the customer's unique ID on PiMMs
    - the lead event will then be passed to the remaining logic to record a sale
  */
  if (pimmsCustomerId) {
    console.log("[Stripe Webhook] Path: pimmsCustomerId found", {
      pimmsCustomerId,
    });

    try {
      console.log("[Stripe Webhook] Updating customer with stripeCustomerId", {
        pimmsCustomerId,
        stripeAccountId,
        stripeCustomerId,
      });
      // Update customer with stripe customerId if exists
      customer = await prisma.customer.update({
        where: {
          projectConnectId_externalId: {
            projectConnectId: stripeAccountId,
            externalId: pimmsCustomerId,
          },
        },
        data: {
          stripeCustomerId,
        },
      });
      console.log("[Stripe Webhook] Customer updated", {
        customerId: customer.id,
        projectId: customer.projectId,
      });
    } catch (error) {
      // Skip if customer not found
      console.error("[Stripe Webhook] Customer not found", {
        pimmsCustomerId,
        error: error instanceof Error ? error.message : String(error),
      });
      return `Customer with pimmsCustomerId ${pimmsCustomerId} not found, skipping...`;
    }

    console.log("[Stripe Webhook] Finding lead event", {
      customerId: customer.id,
    });
    // Find lead
    leadEvent = await getLeadEvent({ customerId: customer.id }).then(
      (res) => res.data[0],
    );

    linkId = leadEvent.link_id;
    console.log("[Stripe Webhook] Lead event found", {
      linkId,
      leadEventId: leadEvent.event_id,
    });

    // Record the sale using the utility function (customer and leadEvent already exist)
    // Use customer.projectId - no need to lookup workspace since we already have it from customer
    console.log("[Stripe Webhook] Recording sale from existing customer");
    const result = await recordStripeCheckoutSaleFromExistingCustomer({
      charge,
      customer,
      leadEvent,
      linkId,
      workspaceId: customer.projectId,
      stripeCustomerId,
    });
    console.log("[Stripe Webhook] Sale recorded successfully", {
      result: result.substring(0, 100),
    });
    return result;

    /*
      for stripe checkout links:
      - if client_reference_id is a pimms_id, we find the click event
      - the click event will be used to create a lead event + customer
      - the lead event will then be passed to the remaining logic to record a sale
    */
  } else {
    console.log("[Stripe Webhook] Path: client_reference_id");
    let pimmsClickId: string | null = null;

    if (clientReferenceId?.startsWith("pimms_id_")) {
      pimmsClickId = clientReferenceId.split("pimms_id_")[1];
      console.log("[Stripe Webhook] Extracted pimmsClickId from client_reference_id", {
        pimmsClickId: pimmsClickId.substring(0, 20) + "...",
      });
    }

    console.log("[Stripe Webhook] Looking up workspace", {
      stripeAccountId,
    });
    const workspace = await prisma.project.findUnique({
      where: {
        stripeConnectId: stripeAccountId,
      },
      select: {
        id: true,
      },
    });

    if (!workspace) {
      console.error("[Stripe Webhook] Workspace not found", {
        stripeAccountId,
      });
      return `Workspace with stripeConnectId ${stripeAccountId} not found, skipping...`;
    }

    console.log("[Stripe Webhook] Workspace found", {
      workspaceId: workspace.id,
    });

    if (!pimmsClickId) {
      console.log("[Stripe Webhook] No pimmsClickId, attempting TY reconciliation");
      const result = await handleTyReconciliation({
        workspaceId: workspace.id,
        provider: "stripe",
        payload: event,
        failedReason:
          "Customer ID not found in Stripe checkout session metadata and client_reference_id is not a pimms_id",
      });
      if (result.shouldReturnEarly) {
        console.log("[Stripe Webhook] TY reconciliation: webhook stored, returning early");
        return "OK";
      }
      pimmsClickId = result.pimmsId;
      console.log("[Stripe Webhook] TY reconciliation: pimmsClickId found", {
        pimmsClickId: pimmsClickId.substring(0, 20) + "...",
      });
    }

    console.log("[Stripe Webhook] Looking up click event", {
      pimmsClickId: pimmsClickId.substring(0, 20) + "...",
    });
    clickEvent = await getClickEvent({ clickId: pimmsClickId }).then(
      (res) => res.data[0],
    );

    if (!clickEvent) {
      console.error("[Stripe Webhook] Click event not found", {
        pimmsClickId: pimmsClickId.substring(0, 20) + "...",
      });
      return `Click event with pimms_id ${pimmsClickId} not found, skipping...`;
    }

    console.log("[Stripe Webhook] Click event found", {
      clickId: clickEvent.click_id?.substring(0, 20) + "...",
      linkId: clickEvent.link_id,
    });

    // Find existing customer (the utility function will also check, but we pass it to avoid duplicate logic)
    console.log("[Stripe Webhook] Checking for existing customer");
    existingCustomer = await prisma.customer.findFirst({
      where: {
        projectId: workspace.id,
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

    console.log("[Stripe Webhook] Existing customer check", {
      found: !!existingCustomer,
      customerId: existingCustomer?.id,
    });

    // Record the sale using the utility function
    // Note: recordStripeCheckoutSale will perform the same lookup internally, but we pass existingCustomer
    // to ensure consistency. The utility function will still do its own lookup for safety.
    console.log("[Stripe Webhook] Recording sale");
    const result = await recordStripeCheckoutSale({
      charge,
      workspaceId: workspace.id,
      stripeAccountId,
      stripeCustomerId,
      stripeCustomerName: stripeCustomerName ?? null,
      stripeCustomerEmail: stripeCustomerEmail ?? null,
      clickEvent,
      existingCustomer,
    });
    console.log("[Stripe Webhook] Sale recorded successfully", {
      result: result.substring(0, 100),
    });
    return result;
  }
}
