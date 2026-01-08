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
  const charge = event.data.object as Stripe.Checkout.Session;
  const pimmsCustomerId = charge.metadata?.pimmsCustomerId;
  const clientReferenceId = charge.client_reference_id;
  const stripeAccountId = event.account as string || "acct_1OKQowBN5sOoOmBU";
  const stripeCustomerId = charge.customer as string;
  const stripeCustomerName = charge.customer_details?.name;
  const stripeCustomerEmail = charge.customer_details?.email;

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
    console.log("pimmsCustomerId", pimmsCustomerId);

    try {
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
    } catch (error) {
      // Skip if customer not found
      console.log(error);
      return `Customer with pimmsCustomerId ${pimmsCustomerId} not found, skipping...`;
    }

    // Find lead
    leadEvent = await getLeadEvent({ customerId: customer.id }).then(
      (res) => res.data[0],
    );

    linkId = leadEvent.link_id;

    // Record the sale using the utility function (customer and leadEvent already exist)
    // Use customer.projectId - no need to lookup workspace since we already have it from customer
    return await recordStripeCheckoutSaleFromExistingCustomer({
      charge,
      customer,
      leadEvent,
      linkId,
      workspaceId: customer.projectId,
      stripeCustomerId,
    });

    /*
      for stripe checkout links:
      - if client_reference_id is a pimms_id, we find the click event
      - the click event will be used to create a lead event + customer
      - the lead event will then be passed to the remaining logic to record a sale
    */
  } else {
    let pimmsClickId: string | null = null;

    if (clientReferenceId?.startsWith("pimms_id_")) {
      pimmsClickId = clientReferenceId.split("pimms_id_")[1];
    }


    const workspace = await prisma.project.findUnique({
      where: {
        stripeConnectId: stripeAccountId,
      },
      select: {
        id: true,
      },
    });

    if (!workspace) {
      return `Workspace with stripeConnectId ${stripeAccountId} not found, skipping...`;
    }

    if (!pimmsClickId) {
      const result = await handleTyReconciliation({
        workspaceId: workspace.id,
        provider: "stripe",
        payload: event,
        failedReason:
          "Customer ID not found in Stripe checkout session metadata and client_reference_id is not a pimms_id",
      });
      if (result.shouldReturnEarly) {
        return "OK";
      }
      pimmsClickId = result.pimmsId;
    }

    console.log("pimmsClickId", pimmsClickId);

    clickEvent = await getClickEvent({ clickId: pimmsClickId }).then(
      (res) => res.data[0],
    );

    if (!clickEvent) {
      return `Click event with pimms_id ${pimmsClickId} not found, skipping...`;
    }

    // Find existing customer (the utility function will also check, but we pass it to avoid duplicate logic)
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

    // Record the sale using the utility function
    // Note: recordStripeCheckoutSale will perform the same lookup internally, but we pass existingCustomer
    // to ensure consistency. The utility function will still do its own lookup for safety.
    return await recordStripeCheckoutSale({
      charge,
      workspaceId: workspace.id,
      stripeAccountId,
      stripeCustomerId,
      stripeCustomerName: stripeCustomerName ?? null,
      stripeCustomerEmail: stripeCustomerEmail ?? null,
      clickEvent,
      existingCustomer,
    });
  }
}
