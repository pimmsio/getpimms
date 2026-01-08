/**
 * TY (Thank-You) Link Reconciliation System
 * 
 * This module handles the reconciliation between webhooks from third-party providers (like Stripe)
 * and thank-you link clicks when a pimms_id is missing from the webhook payload.
 * 
 * Problem: Sometimes a webhook arrives BEFORE a user clicks the thank-you link, and sometimes
 * the thank-you link is clicked FIRST. Without a pimms_id, we can't link them together.
 * 
 * Solution: Use a time-based matching system with two queues in Redis:
 * 1. "Waiting Conversions" - TY link clicks waiting for a matching webhook
 * 2. "Pending Webhooks" - Webhooks waiting for a matching TY link click
 * 
 * Flow:
 * - When TY link is hit first: Store clickId in "waiting conversions" queue
 * - When webhook arrives first: Store webhook in "pending webhooks" queue
 * - When second event arrives: Match it with the first event and process both together
 * - If no match within 10 minutes: Create a WebhookError for manual review
 */

import { qstash } from "@/lib/cron";
import { APP_DOMAIN_WITH_NGROK } from "@dub/utils";
import { redis } from "@/lib/upstash";
import { nanoid } from "@dub/utils";

// 10-minute reconciliation window: webhooks and TY hits can match within this timeframe
export const WINDOW_SECONDS = 60 * 10;
const WINDOW_MS = WINDOW_SECONDS * 1000;
// Maximum items to keep in Redis lists (prevents unbounded growth)
const MAX_ITEMS = 50;

/**
 * TY Link Click Data (waiting for matching webhook)
 * This is created when a thank-you link is clicked BEFORE the corresponding webhook arrives.
 */
export type TyWaitingConversion = {
  id: string;
  ts: number;
  clickId: string; // The pimms_id that will be used to match with webhook
  linkId: string;
  anonymousId: string;
};

/**
 * Pending Webhook Data (waiting for matching TY link click)
 * This is created when a webhook arrives BEFORE the corresponding thank-you link is clicked.
 */
export type TyPendingWebhook = {
  id: string;
  ts: number;
  provider: string; // e.g., "stripe" or "generic"
  payload: unknown; // The full webhook payload to process later
};

/**
 * Redis key generators for workspace-specific queues
 */
function getQueueKey(workspaceId: string, type: "waiting" | "webhook") {
  return `ty:${type}:${workspaceId}`;
}

/**
 * Validates if a queue entry is still within the time window
 */
function isWithinTimeWindow(ts: number, now: number): boolean {
  return now - ts <= WINDOW_MS;
}

/**
 * Generic function to push an item to a TY queue
 * Handles Redis list operations: push, trim, and expiration
 */
async function pushToTyQueue<T extends { id: string; ts: number }>(
  workspaceId: string,
  queueType: "waiting" | "webhook",
  item: T,
): Promise<{ item: T; raw: string }> {
  const key = getQueueKey(workspaceId, queueType);
  const value = JSON.stringify(item);

  await Promise.all([
    redis.lpush(key, value),
    redis.ltrim(key, 0, MAX_ITEMS - 1),
    redis.expire(key, WINDOW_SECONDS),
  ]);

  return { item, raw: value };
}

/**
 * Generic function to retrieve and remove the most recent entry from a TY queue
 * Returns the first valid entry within the time window, or null if none found
 */
async function takeLatestFromTyQueue<T extends { ts: number }>(
  workspaceId: string,
  queueType: "waiting" | "webhook",
): Promise<T | null> {
  const key = getQueueKey(workspaceId, queueType);
  const now = Date.now();
  const values = await redis.lrange<string>(key, 0, MAX_ITEMS - 1);

  for (const v of values || []) {
    try {
      const parsed = JSON.parse(v) as T;
      if (parsed && isWithinTimeWindow(parsed.ts, now)) {
        await redis.lrem(key, 1, v);
        return parsed;
      }
    } catch {
      // ignore malformed entries
    }
  }

  return null;
}

/**
 * Stores a thank-you link click in the waiting queue.
 * Called when a TY link is clicked and we're waiting for a matching webhook.
 */
export async function pushTyWaitingConversion(
  input: { workspaceId: string } & Omit<TyWaitingConversion, "id" | "ts">,
): Promise<TyWaitingConversion> {
  const { workspaceId, ...rest } = input;
  const item: TyWaitingConversion = { id: nanoid(12), ts: Date.now(), ...rest };
  const result = await pushToTyQueue(workspaceId, "waiting", item);
  return result.item;
}

/**
 * Retrieves and removes the most recent waiting conversion that's still within the time window.
 * Called when a webhook arrives and we need to find a matching TY link click.
 */
export async function takeLatestTyWaitingConversion(
  workspaceId: string,
): Promise<TyWaitingConversion | null> {
  return takeLatestFromTyQueue<TyWaitingConversion>(workspaceId, "waiting");
}

/**
 * Stores a webhook in the pending queue.
 * Called when a webhook arrives and we're waiting for a matching TY link click.
 */
export async function pushTyPendingWebhook(
  input: Omit<TyPendingWebhook, "id" | "ts"> & { workspaceId: string },
): Promise<{ item: TyPendingWebhook; raw: string }> {
  const item: TyPendingWebhook = {
    id: nanoid(12),
    ts: Date.now(),
    provider: input.provider,
    payload: input.payload,
  };
  return pushToTyQueue(input.workspaceId, "webhook", item);
}

/**
 * Retrieves and removes the most recent pending webhook that's still within the time window.
 * Called when a TY link is clicked and we need to find a matching webhook.
 */
export async function takeLatestTyPendingWebhook(
  workspaceId: string,
): Promise<TyPendingWebhook | null> {
  return takeLatestFromTyQueue<TyPendingWebhook>(workspaceId, "webhook");
}

/**
 * Schedules a delayed job to create a WebhookError if a webhook is still pending
 * after the reconciliation window expires (no matching TY link click within 10 minutes).
 * 
 * This ensures we don't lose webhooks that never get matched - they'll be logged
 * as errors for manual review or retry.
 */
export async function scheduleTyWebhookExpire({
  workspaceId,
  provider,
  raw,
  failedReason,
}: {
  workspaceId: string;
  provider: string;
  raw: string; // The raw JSON string of the webhook payload
  failedReason: string; // Why the webhook couldn't be processed (e.g., "Missing pimms_id")
}) {
  // Schedule job to run after WINDOW_SECONDS (10 minutes)
  // If webhook hasn't been matched by then, it will create a WebhookError
  await qstash.publishJSON({
    url: `${APP_DOMAIN_WITH_NGROK}/api/cron/thankyou/webhook-expire`,
    method: "POST",
    body: { workspaceId, provider, raw, failedReason },
    delay: WINDOW_SECONDS,
  });
}

/**
 * Main reconciliation function: Handles TY (thank-you) link reconciliation for webhooks missing pimms_id.
 * 
 * This is called when a webhook arrives without a pimms_id. It attempts to match the webhook
 * with a thank-you link click that happened within the 10-minute reconciliation window.
 *
 * Two possible scenarios:
 * 
 * Scenario 1: TY link was clicked FIRST (clickId already in waiting queue)
 *   - Find the matching clickId from waiting conversions
 *   - Return it immediately so webhook can be processed with the clickId
 *   - Remove the matched entry from the waiting queue
 * 
 * Scenario 2: Webhook arrived FIRST (no matching clickId found)
 *   - Store the webhook in the pending queue
 *   - Schedule an expiration job (in 10 minutes) to create a WebhookError if no match
 *   - Return early - webhook will be processed later when TY link is clicked
 * 
 * @returns Object with:
 *   - pimmsId: The matched clickId if found, null otherwise
 *   - shouldReturnEarly: true if webhook should be deferred (stored for later processing)
 */
/**
 * Main reconciliation function: Handles TY (thank-you) link reconciliation for webhooks missing pimms_id.
 * 
 * This is called when a webhook arrives without a pimms_id. It attempts to match the webhook
 * with a thank-you link click that happened within the 10-minute reconciliation window.
 *
 * Two possible scenarios:
 * - Scenario 1: TY link was clicked FIRST → Match found, return clickId immediately
 * - Scenario 2: Webhook arrived FIRST → Store webhook, schedule expiration, return early
 */
export async function handleTyReconciliation({
  workspaceId,
  provider,
  payload,
  failedReason,
}: {
  workspaceId: string;
  provider: string;
  payload: any;
  failedReason: string;
}): Promise<
  | { pimmsId: string; shouldReturnEarly: false }
  | { pimmsId: null; shouldReturnEarly: true }
> {
  // Check if a TY link was clicked first (waiting conversion exists in queue)
  const waiting = await takeLatestTyWaitingConversion(workspaceId);
  
  if (waiting?.clickId) {
    // ✅ Scenario 1: TY link hit first - match found!
    return { pimmsId: waiting.clickId, shouldReturnEarly: false };
  }
  
  // ⏳ Scenario 2: Webhook arrived first - store and wait for TY link click
  const pending = await pushTyPendingWebhook({ workspaceId, provider, payload });
  
  await scheduleTyWebhookExpire({
    workspaceId,
    provider,
    raw: pending.raw,
    failedReason,
  });
  
  // Webhook will be processed later when TY link is clicked
  return { pimmsId: null, shouldReturnEarly: true };
}
