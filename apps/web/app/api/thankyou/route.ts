import { processTyPendingWebhook } from "@/lib/thankyou/process-pending-webhook";
import {
  pushTyWaitingConversion,
  takeLatestTyPendingWebhook,
} from "@/lib/thankyou/reconcile";
import { redis } from "@/lib/upstash";
import { prismaEdge } from "@dub/prisma/edge";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  const url = new URL(req.url);
  const linkId = url.searchParams.get("linkId");

  console.log("[TY] Thank-you link hit", { linkId });

  if (!linkId) {
    console.log("[TY] Missing linkId parameter");
    return NextResponse.json({ error: "Missing linkId" }, { status: 400 });
  }

  const link = await prismaEdge.link.findUnique({
    where: { id: linkId },
    select: {
      id: true,
      url: true,
      key: true,
      projectId: true,
    },
  });

  if (!link || !link.projectId) {
    console.log("[TY] Link not found", { linkId });
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const isTyLink = (link.key || "").toLowerCase().endsWith("/thankyou");
  if (!isTyLink) {
    // Safety: never run TY flow for non-TY links.
    console.log("[TY] Not a thank-you link, redirecting", {
      linkId,
      key: link.key,
    });
    return NextResponse.redirect(link.url || "/", 302);
  }

  const anonymousId =
    (await cookies()).get("pimms_anonymous_id")?.value || null;

  // If we can't identify the visitor, we can't attribute — just redirect.
  if (!anonymousId) {
    console.log("[TY] No anonymousId found, cannot attribute", { linkId });
    return NextResponse.redirect(link.url || "/", 302);
  }

  const workspaceId = link.projectId;
  console.log("[TY] Processing thank-you link", {
    linkId,
    workspaceId,
    anonymousId: anonymousId.substring(0, 8) + "...", // Log partial ID for privacy
  });

  const lastClick = await redis.get<{
    clickId: string;
    linkId: string;
    timestamp: string;
  }>(`ty:lastClick:${workspaceId}:${decodeURIComponent(anonymousId)}`);

  if (!lastClick?.clickId || !lastClick?.linkId) {
    console.log("[TY] No lastClick found in Redis", {
      workspaceId,
      anonymousId: anonymousId.substring(0, 8) + "...",
    });
    return NextResponse.redirect(link.url || "/", 302);
  }

  console.log("[TY] Found lastClick", {
    clickId: lastClick.clickId,
    linkId: lastClick.linkId,
    timestamp: lastClick.timestamp,
  });

  try {
    // Reverse order: if webhook arrived first, attempt to process it now.
    const pending = await takeLatestTyPendingWebhook(workspaceId);
    if (pending) {
      console.log("[TY] Found pending webhook, processing", {
        provider: pending.provider,
        clickId: lastClick.clickId,
        webhookId: pending.id,
      });
      await processTyPendingWebhook({
        provider: pending.provider,
        workspaceId,
        clickId: lastClick.clickId,
        payload: pending.payload,
      });
      console.log("[TY] Successfully processed pending webhook", {
        provider: pending.provider,
        clickId: lastClick.clickId,
      });
    } else {
      // Normal order: store a short-lived conversion marker to attach the next webhook.
      console.log("[TY] No pending webhook, storing waiting conversion", {
        clickId: lastClick.clickId,
        linkId: lastClick.linkId,
      });
      await pushTyWaitingConversion({
        workspaceId,
        clickId: lastClick.clickId,
        linkId: lastClick.linkId,
        anonymousId: decodeURIComponent(anonymousId),
      });
      console.log("[TY] Successfully stored waiting conversion", {
        clickId: lastClick.clickId,
      });
    }
  } catch (error) {
    console.error("[TY] Error processing pending webhook:", error, {
      linkId,
      workspaceId,
      clickId: lastClick.clickId,
    });
  } finally {
    console.log("[TY] Redirecting to destination URL", {
      linkId,
      destinationUrl: link.url,
    });
    return NextResponse.redirect(link.url || "/", 302);
  }
};
