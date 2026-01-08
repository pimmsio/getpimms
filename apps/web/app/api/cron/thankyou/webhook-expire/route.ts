/**
 * Webhook Expiration Handler
 * 
 * This QStash-delayed job is called 10 minutes after a webhook was stored as pending
 * in the TY (thank-you) reconciliation system. Its purpose is to clean up webhooks
 * that never got matched with a thank-you link click.
 * 
 * Flow:
 * 1. When a webhook arrives without pimms_id, it's stored in Redis pending queue
 * 2. A delayed job is scheduled to run after 10 minutes (reconciliation window)
 * 3. This handler checks if the webhook is still in the queue (no match found)
 * 4. If still present, it's removed from Redis and logged as a WebhookError
 * 5. If already removed (matched), this handler does nothing (idempotent)
 * 
 * This ensures we don't lose track of webhooks that never get matched and provides
 * visibility for debugging/manual review.
 */

import { verifyQstashSignature } from "@/lib/cron/verify-qstash";
import { redis } from "@/lib/upstash";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";
import z from "@/lib/zod";

export const dynamic = "force-dynamic";

/**
 * Request body schema for the webhook expiration job
 */
const bodySchema = z.object({
  workspaceId: z.string().min(1), // Workspace ID that owns the webhook
  provider: z.string().min(1), // Webhook provider (e.g., "stripe" or "generic")
  raw: z.string().min(1), // The raw JSON string of the pending webhook payload
  failedReason: z.string().min(1), // Reason why the webhook couldn't be processed (e.g., "Missing pimms_id")
});

/**
 * POST /api/cron/thankyou/webhook-expire
 * 
 * QStash-delayed job handler that checks if a pending webhook is still unmatched
 * after the 10-minute reconciliation window expires.
 * 
 * This is scheduled by scheduleTyWebhookExpire() when a webhook arrives without
 * a pimms_id and no matching TY link click is found immediately.
 * 
 * Behavior:
 * - If webhook is still in Redis queue → Remove it and create WebhookError (unmatched)
 * - If webhook was already removed → Do nothing (successfully matched and processed)
 * 
 * This provides the same error tracking behavior as the pre-TY flow, ensuring
 * unmatched webhooks don't get lost.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  // Verify this request is actually from QStash (security)
  await verifyQstashSignature({ req, rawBody });

  const { workspaceId, provider, raw, failedReason } = bodySchema.parse(
    JSON.parse(rawBody),
  );

  // Redis key for the pending webhooks queue for this workspace
  const listKey = `ty:webhook:${workspaceId}`;

  // Try to remove the specific webhook entry from the queue
  // If it's still there, it means no TY link click matched it within 10 minutes
  const removed = await redis.lrem(listKey, 1, raw);
  
  if (removed) {
    // Webhook is still pending (no match found) - log it as an error
    // The [TY] prefix indicates this came through the TY reconciliation flow
    await prisma.webhookError.create({
      data: {
        projectId: workspaceId,
        failedReason: `[TY] ${provider}: ${failedReason}`,
        hasPimmsId: false, // Confirms no pimms_id was ever found/attached
      },
    });
  }
  // If removed === 0, the webhook was already processed (matched with TY link click)
  // No error needs to be logged in that case

  return NextResponse.json({ ok: true, removed: Number(removed || 0) });
}

