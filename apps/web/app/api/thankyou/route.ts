import { processTyPendingWebhook } from "@/lib/thankyou/process-pending-webhook";
import {
  pushTyWaitingConversion,
  takeLatestTyPendingWebhook,
} from "@/lib/thankyou/reconcile";
import { tyLastClickKey } from "@/lib/thankyou/last-click";
import { redis } from "@/lib/upstash";
import { prismaEdge } from "@dub/prisma/edge";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Validates and returns the pimms_redirect URL if it's a safe absolute URL.
 * Prevents open-redirect attacks by rejecting non-http(s) schemes.
 */
function getValidatedRedirectUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
  } catch {
    // malformed URL
  }
  return null;
}

/**
 * Appends pimms_redirected=1 to the redirect URL so the client-side detection
 * script knows the TY redirect already happened and skips re-firing.
 */
function withRedirectedFlag(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("pimms_redirected", "1");
    return u.toString();
  } catch {
    return url;
  }
}

export const GET = async (req: Request) => {
  const url = new URL(req.url);
  const linkId = url.searchParams.get("linkId");
  const pimmsRedirect = getValidatedRedirectUrl(
    url.searchParams.get("pimms_redirect"),
  );

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
    console.log("[TY] Not a thank-you link, redirecting", {
      linkId,
      key: link.key,
    });
    return NextResponse.redirect(
      withRedirectedFlag(pimmsRedirect || link.url || "/"),
      302,
    );
  }

  const redirectTo = pimmsRedirect || link.url || "/";

  const anonymousId =
    (await cookies()).get("pimms_anonymous_id")?.value || null;

  if (!anonymousId) {
    console.log("[TY] No anonymousId found, cannot attribute", { linkId });
    return NextResponse.redirect(withRedirectedFlag(redirectTo), 302);
  }

  const workspaceId = link.projectId;
  console.log("[TY] Processing thank-you link", {
    linkId,
    workspaceId,
    anonymousId,
  });

  const lastClick = await redis.get<{
    clickId: string;
    linkId: string;
    timestamp: string;
  }>(tyLastClickKey(workspaceId, anonymousId));

  if (!lastClick?.clickId || !lastClick?.linkId) {
    console.log("[TY] No lastClick found in Redis", {
      workspaceId,
      anonymousId: anonymousId.substring(0, 8) + "...",
    });
    return NextResponse.redirect(withRedirectedFlag(redirectTo), 302);
  }

  console.log("[TY] Found lastClick", {
    clickId: lastClick.clickId,
    linkId: lastClick.linkId,
    timestamp: lastClick.timestamp,
  });

  try {
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
  }

  const finalUrl = withRedirectedFlag(redirectTo);
  console.log("[TY] Redirecting to destination URL", {
    linkId,
    destinationUrl: finalUrl,
  });
  return NextResponse.redirect(finalUrl, 302);
};
