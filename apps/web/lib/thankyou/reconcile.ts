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
import { redis } from "@/lib/upstash";
import { APP_DOMAIN_WITH_NGROK, nanoid } from "@dub/utils";

// 10-minute reconciliation window: webhooks and TY hits can match within this timeframe
export const WINDOW_SECONDS = 60 * 10;
const WINDOW_MS = WINDOW_SECONDS * 1000;
// Maximum items to keep in Redis lists (prevents unbounded growth)
const MAX_ITEMS = 50;

function normalizeQueueItem<T extends { ts?: number }>(
  popped: unknown,
): T | null {
  // Redis stores strings; some clients can auto-deserialize JSON and return objects.
  if (typeof popped === "string") {
    return JSON.parse(popped) as T;
  }
  if (typeof popped === "object" && popped !== null) {
    return popped as T;
  }
  return null;
}

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

  console.log(`[TY Reconciliation] pushToTyQueue: Pushing to ${queueType} queue`, {
      workspaceId,
      queueType,
      key,
      itemId: item.id,
      timestamp: new Date(item.ts).toISOString(),
  });

  // Use a pipeline to preserve ordering (LPUSH → LTRIM → EXPIRE).
  const pipeline = redis.pipeline();
  pipeline.lpush(key, value);
  pipeline.ltrim(key, 0, MAX_ITEMS - 1);
  pipeline.expire(key, WINDOW_SECONDS);
  await pipeline.exec();

  console.log(`[TY Reconciliation] pushToTyQueue: Item pushed to ${queueType} queue`, {
      workspaceId,
      queueType,
      key,
      itemId: item.id,
      expirationSeconds: WINDOW_SECONDS,
  });

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

  console.log(`[TY Reconciliation] takeLatestFromTyQueue: Checking ${queueType} queue`, {
    workspaceId,
    queueType,
    key,
  });

  // Robust strategy:
  // - We store list entries as JSON strings (via JSON.stringify in pushToTyQueue)
  // - Redis itself returns strings, but some clients (e.g. Upstash) can auto-deserialize JSON
  //   and return objects. We therefore normalize both shapes.
  // - We use LPOP because we LPUSH newest entries; this avoids LRANGE+LREM string-equality
  //   pitfalls and makes removal deterministic.
  for (let i = 0; i < MAX_ITEMS; i++) {
    const popped = await redis.lpop(key);

    if (!popped) {
      break; // queue is empty
    }

    try {
      const parsed = normalizeQueueItem<T>(popped);
      if (!parsed?.ts) {
        continue;
      }

      const now = Date.now();
      const ageMs = now - parsed.ts;
      const withinWindow = isWithinTimeWindow(parsed.ts, now);

      if (withinWindow) {
        console.log(`[TY Reconciliation] takeLatestFromTyQueue: Found valid entry and removed`, {
          workspaceId,
          queueType,
          ageMs,
          itemId: (parsed as any).id,
        });
        return parsed;
      }
    } catch (error) {
      console.log(`[TY Reconciliation] takeLatestFromTyQueue: Malformed entry, removing`, {
        workspaceId,
        queueType,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(`[TY Reconciliation] takeLatestFromTyQueue: No valid entry found`, {
    workspaceId,
    queueType,
  });

  return null;
}

/**
 * Stores a thank-you link click in the waiting queue.
 * Called when a TY link is clicked and we're waiting for a matching webhook.
 */
export async function pushTyWaitingConversion(
  input: { workspaceId: string } & Omit<TyWaitingConversion, "id" | "ts">,
): Promise<TyWaitingConversion> {
  console.log("[TY Reconciliation] pushTyWaitingConversion: Storing waiting conversion", {
    workspaceId: input.workspaceId,
    clickId: input.clickId,
    linkId: input.linkId,
  });
  const { workspaceId, ...rest } = input;
  const item: TyWaitingConversion = { id: nanoid(12), ts: Date.now(), ...rest };
  const result = await pushToTyQueue(workspaceId, "waiting", item);
  console.log("[TY Reconciliation] pushTyWaitingConversion: Waiting conversion stored", {
    workspaceId,
    conversionId: item.id,
    clickId: input.clickId,
  });
  return result.item;
}

/**
 * Retrieves and removes the most recent waiting conversion that's still within the time window.
 * Called when a webhook arrives and we need to find a matching TY link click.
 */
export async function takeLatestTyWaitingConversion(
  workspaceId: string,
): Promise<TyWaitingConversion | null> {
  console.log("[TY Reconciliation] takeLatestTyWaitingConversion: Checking waiting queue", {
    workspaceId,
  });
  const result = await takeLatestFromTyQueue<TyWaitingConversion>(workspaceId, "waiting");
  if (result) {
    console.log("[TY Reconciliation] takeLatestTyWaitingConversion: Found waiting conversion", {
      workspaceId,
      clickId: result.clickId,
      linkId: result.linkId,
      ageMs: Date.now() - result.ts,
    });
  } else {
    console.log("[TY Reconciliation] takeLatestTyWaitingConversion: No waiting conversion found", {
      workspaceId,
    });
  }
  return result;
}

/**
 * Stores a webhook in the pending queue.
 * Called when a webhook arrives and we're waiting for a matching TY link click.
 */
export async function pushTyPendingWebhook(
  input: Omit<TyPendingWebhook, "id" | "ts"> & { workspaceId: string },
): Promise<{ item: TyPendingWebhook; raw: string }> {
  console.log("[TY Reconciliation] pushTyPendingWebhook: Storing webhook in pending queue", {
    workspaceId: input.workspaceId,
    provider: input.provider,
  });

  const item: TyPendingWebhook = {
    id: nanoid(12),
    ts: Date.now(),
    provider: input.provider,
    payload: input.payload,
  };
  const result = await pushToTyQueue(input.workspaceId, "webhook", item);
  console.log("[TY Reconciliation] pushTyPendingWebhook: Webhook stored", {
    workspaceId: input.workspaceId,
    provider: input.provider,
    webhookId: item.id,
    payloadSize: result.raw.length,
  });
  return result;
}

/**
 * Retrieves and removes the most recent pending webhook that's still within the time window.
 * Called when a TY link is clicked and we need to find a matching webhook.
 */
export async function takeLatestTyPendingWebhook(
  workspaceId: string,
): Promise<TyPendingWebhook | null> {
  console.log("[TY Reconciliation] takeLatestTyPendingWebhook: Checking pending webhook queue", {
    workspaceId,
  });
  const result = await takeLatestFromTyQueue<TyPendingWebhook>(workspaceId, "webhook");
  if (result) {
    console.log("[TY Reconciliation] takeLatestTyPendingWebhook: Found pending webhook", {
      workspaceId,
      provider: result.provider,
      webhookId: result.id,
      ageMs: Date.now() - result.ts,
    });
  } else {
    console.log("[TY Reconciliation] takeLatestTyPendingWebhook: No pending webhook found", {
      workspaceId,
    });
  }
  return result;
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
  console.log("[TY Reconciliation] scheduleTyWebhookExpire: Scheduling expiration job", {
    workspaceId,
    provider,
    delaySeconds: WINDOW_SECONDS,
    failedReason,
  });
  // Schedule job to run after WINDOW_SECONDS (10 minutes)
  // If webhook hasn't been matched by then, it will create a WebhookError
  await qstash.publishJSON({
    url: `${APP_DOMAIN_WITH_NGROK}/api/cron/thankyou/webhook-expire`,
    method: "POST",
    body: { workspaceId, provider, raw, failedReason },
    delay: WINDOW_SECONDS,
  });
  console.log("[TY Reconciliation] scheduleTyWebhookExpire: Expiration job scheduled", {
    workspaceId,
    provider,
    willExpireAt: new Date(Date.now() + WINDOW_SECONDS * 1000).toISOString(),
  });
}

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
  payload: unknown;
  failedReason: string;
}): Promise<
  | { pimmsId: string; shouldReturnEarly: false }
  | { pimmsId: null; shouldReturnEarly: true }
> {
  console.log("[TY Reconciliation] Starting reconciliation", {
    provider,
    workspaceId,
    failedReason,
  });

  // Check if a TY link was clicked first (waiting conversion exists in queue)
  console.log("[TY Reconciliation] Checking for waiting conversion");
  const waiting = await takeLatestTyWaitingConversion(workspaceId);

  if (waiting?.clickId) {
    // ✅ Scenario 1: TY link hit first - match found!
    console.log("[TY Reconciliation] Match found - TY link clicked first", {
      provider,
      clickId: waiting.clickId,
      linkId: waiting.linkId,
      timestamp: new Date(waiting.ts).toISOString(),
    });
    return { pimmsId: waiting.clickId, shouldReturnEarly: false };
  }

  // ⏳ Scenario 2: Webhook arrived first - store and wait for TY link click
  console.log("[TY Reconciliation] No waiting conversion found - webhook arrived first", {
    provider,
  });
  console.log("[TY Reconciliation] Storing webhook in pending queue", {
    provider,
    workspaceId,
  });
  const pending = await pushTyPendingWebhook({ workspaceId, provider, payload });

  console.log("[TY Reconciliation] Scheduling webhook expiration job", {
    provider,
    workspaceId,
    webhookId: pending.item.id,
    willExpireIn: `${WINDOW_SECONDS}s`,
  });
  await scheduleTyWebhookExpire({
    workspaceId,
    provider,
    raw: pending.raw,
    failedReason,
  });

  // Webhook will be processed later when TY link is clicked
  console.log("[TY Reconciliation] Webhook stored - waiting for TY link click", {
    provider,
    workspaceId,
    webhookId: pending.item.id,
  });
  return { pimmsId: null, shouldReturnEarly: true };
}
