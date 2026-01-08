import { WebhookError } from "@/lib/webhook/utils";
import { processStripeCheckoutCompleted } from "./handlers/stripe-checkout-completed";
import { processCustomerCreatedFromPimmsId } from "@/lib/webhook/customer-created";

/**
 * Processes a pending webhook with an attributed clickId from a TY link hit.
 *
 * This is used in the "webhook-first then TY" flow: when a webhook arrives
 * without pimms_id, it's stored as pending. When the TY link is hit later,
 * this function processes the pending webhook using the attributed clickId.
 */
export async function processTyPendingWebhook({
  provider,
  workspaceId,
  clickId,
  payload,
}: {
  provider: string;
  workspaceId: string;
  clickId: string;
  payload: unknown;
}): Promise<string> {
  if (provider === "stripe") {
    return await processStripeCheckoutCompleted({
      clickId,
      workspaceId,
      payload,
    });
  }

  if (provider === "generic") {
    return await processCustomerCreatedFromPimmsId({
      clickId,
      workspaceId,
      data: payload as Record<string, any>,
    });
  }

  throw new WebhookError(
    `Unsupported pending TY webhook provider: ${provider}`,
    200,
  );
}
