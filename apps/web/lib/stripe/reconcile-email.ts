import { stripe } from "@/lib/stripe";
import { redis } from "@/lib/upstash";
import { sendEmail } from "@dub/email";
import SupportRequestEmail from "@dub/email/templates/support-email";
import { prisma } from "@dub/prisma";
import { getPlanFromPriceId, nanoid } from "@dub/utils";
import type Stripe from "stripe";

const EMAIL_WINDOW_SECONDS = 60 * 30;
const MAX_ITEMS = 20;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

type PendingStripeCheckoutEmail = {
  id: string;
  ts: number;
  email: string;
  payload: Stripe.Event;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return "unknown";
  const prefix = local.slice(0, 2);
  return `${prefix}***@${domain}`;
}

function getQueueKey(email: string) {
  return `stripe:pending-checkout:${normalizeEmail(email)}`;
}

function normalizeQueueItem<T extends { ts?: number }>(popped: unknown): T | null {
  if (typeof popped === "string") {
    return JSON.parse(popped) as T;
  }
  if (typeof popped === "object" && popped !== null) {
    return popped as T;
  }
  return null;
}

async function pushToQueue(
  email: string,
  item: PendingStripeCheckoutEmail,
) {
  const key = getQueueKey(email);
  const value = JSON.stringify(item);
  const pipeline = redis.pipeline();
  pipeline.lpush(key, value);
  pipeline.ltrim(key, 0, MAX_ITEMS - 1);
  pipeline.expire(key, EMAIL_WINDOW_SECONDS);
  await pipeline.exec();
  return { key, value };
}

async function takeLatestFromQueue(
  email: string,
): Promise<PendingStripeCheckoutEmail | null> {
  const key = getQueueKey(email);
  for (let i = 0; i < MAX_ITEMS; i++) {
    const popped = await redis.lpop(key);
    if (!popped) break;

    try {
      const parsed = normalizeQueueItem<PendingStripeCheckoutEmail>(popped);
      if (!parsed?.ts) continue;
      return parsed;
    } catch (error) {
      console.log("[Stripe Reconcile] Malformed pending checkout, skipping", {
        emailKey: key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return null;
}

async function notifyAdminMultipleWorkspaces({
  email,
  userId,
  workspaceIds,
  eventId,
}: {
  email: string;
  userId: string;
  workspaceIds: string[];
  eventId: string;
}) {
  if (!ADMIN_EMAIL) {
    console.log("[Stripe Reconcile] ADMIN_EMAIL not set, skipping admin email", {
      email: maskEmail(email),
      userId,
      eventId,
      workspaceCount: workspaceIds.length,
    });
    return;
  }

  await sendEmail({
    subject: "Stripe reconciliation blocked: multiple workspaces",
    email: ADMIN_EMAIL,
    react: SupportRequestEmail({
      email: ADMIN_EMAIL,
      message: [
        "Stripe reconciliation skipped due to multiple workspaces.",
        `UserId: ${userId}`,
        `Email: ${email}`,
        `WorkspaceIds: ${workspaceIds.join(", ")}`,
        `EventId: ${eventId}`,
      ].join("\n"),
    }),
  });
}

async function notifyAdminReconcileFailure({
  email,
  userId,
  eventId,
  reason,
  details,
}: {
  email: string;
  userId: string;
  eventId: string;
  reason: string;
  details?: string[];
}) {
  if (!ADMIN_EMAIL) {
    console.log("[Stripe Reconcile] ADMIN_EMAIL not set, skipping failure email", {
      email: maskEmail(email),
      userId,
      eventId,
      reason,
    });
    return;
  }

  await sendEmail({
    subject: "Stripe reconciliation failed",
    email: ADMIN_EMAIL,
    react: SupportRequestEmail({
      email: ADMIN_EMAIL,
      message: [
        "Stripe reconciliation failed.",
        `Reason: ${reason}`,
        `UserId: ${userId}`,
        `Email: ${email}`,
        `EventId: ${eventId}`,
        ...(details ?? []),
      ].join("\n"),
    }),
  });
}

export async function pushStripePendingCheckoutByEmail({
  email,
  payload,
  reason,
}: {
  email: string;
  payload: Stripe.Event;
  reason: string;
}): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const item: PendingStripeCheckoutEmail = {
    id: nanoid(12),
    ts: Date.now(),
    email: normalizedEmail,
    payload,
  };
  const { key, value } = await pushToQueue(normalizedEmail, item);
  console.log("[Stripe Reconcile] Stored pending checkout for email", {
    email: maskEmail(normalizedEmail),
    reason,
    key,
    eventId: payload.id,
    payloadSize: value.length,
  });
}

async function getPriceIdFromCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<{ priceId: string; source: "line_items" | "subscription" } | null> {
  if (session.mode === "payment") {
    const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
      session.id,
      { expand: ["line_items"] },
    );
    const lineItem = sessionWithLineItems.line_items?.data[0];
    if (!lineItem?.price?.id) return null;
    return { priceId: lineItem.price.id, source: "line_items" };
  }

  if (!session.subscription) return null;
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string,
  );
  return { priceId: subscription.items.data[0].price.id, source: "subscription" };
}

export async function reconcileStripePendingCheckoutByEmail({
  email,
  userId,
}: {
  email: string;
  userId: string;
}): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const pending = await takeLatestFromQueue(normalizedEmail);
  if (!pending) {
    console.log("[Stripe Reconcile] No pending checkout for email", {
      email: maskEmail(normalizedEmail),
      userId,
    });
    await notifyAdminReconcileFailure({
      email: normalizedEmail,
      userId,
      eventId: "unknown",
      reason: "no_pending_checkout",
    });
    return;
  }

  const event = pending.payload as Stripe.Event;
  const session = event.data.object as Stripe.Checkout.Session;
  const stripeCustomerId = session.customer?.toString();

  const userWorkspaces = await prisma.projectUsers.findMany({
    where: { userId },
    select: { projectId: true },
  });
  const workspaceIds = userWorkspaces.map((item) => item.projectId);

  if (workspaceIds.length > 1) {
    await notifyAdminMultipleWorkspaces({
      email: normalizedEmail,
      userId,
      workspaceIds,
      eventId: event.id,
    });
    
    console.log("[Stripe Reconcile] Multiple workspaces found, skipping", {
      email: maskEmail(normalizedEmail),
      userId,
      workspaceCount: workspaceIds.length,
      eventId: event.id,
    });
    return;
  }

  const workspaceId = workspaceIds[0];
  if (!workspaceId) {
    console.log("[Stripe Reconcile] No workspace found for user, skipping", {
      email: maskEmail(normalizedEmail),
      userId,
      eventId: event.id,
    });
    await notifyAdminReconcileFailure({
      email: normalizedEmail,
      userId,
      eventId: event.id,
      reason: "no_workspace",
    });
    return;
  }

  if (!stripeCustomerId) {
    console.log("[Stripe Reconcile] Pending checkout missing customer id", {
      email: maskEmail(normalizedEmail),
      eventId: event.id,
      sessionId: session.id,
    });
    await notifyAdminReconcileFailure({
      email: normalizedEmail,
      userId,
      eventId: event.id,
      reason: "missing_customer_id",
      details: [`SessionId: ${session.id}`],
    });
    return;
  }

  const priceResult = await getPriceIdFromCheckoutSession(session);
  if (!priceResult?.priceId) {
    console.log("[Stripe Reconcile] Pending checkout missing price id", {
      email: maskEmail(normalizedEmail),
      eventId: event.id,
      sessionId: session.id,
    });
    await notifyAdminReconcileFailure({
      email: normalizedEmail,
      userId,
      eventId: event.id,
      reason: "missing_price_id",
      details: [`SessionId: ${session.id}`],
    });
    return;
  }

  const plan = getPlanFromPriceId(priceResult.priceId);
  if (!plan) {
    console.log("[Stripe Reconcile] Pending checkout has invalid price id", {
      email: maskEmail(normalizedEmail),
      priceId: priceResult.priceId,
      eventId: event.id,
    });
    await notifyAdminReconcileFailure({
      email: normalizedEmail,
      userId,
      eventId: event.id,
      reason: "invalid_price_id",
      details: [`PriceId: ${priceResult.priceId}`],
    });
    return;
  }

  const planName = plan.name.toLowerCase();

  await Promise.allSettled([
    prisma.project.update({
      where: { id: workspaceId },
      data: {
        stripeId: stripeCustomerId,
        billingCycleStart: new Date().getDate(),
        plan: planName,
        usageLimit: plan.limits.clicks!,
        linksLimit: plan.limits.links!,
        domainsLimit: plan.limits.domains!,
        aiLimit: plan.limits.ai!,
        tagsLimit: plan.limits.tags!,
        foldersLimit: plan.limits.folders!,
        usersLimit: plan.limits.users!,
        salesLimit: plan.limits.sales!,
      },
    }),
    prisma.restrictedToken.updateMany({
      where: { projectId: workspaceId },
      data: { rateLimit: plan.limits.api },
    }),
  ]);

  console.log("[Stripe Reconcile] Workspace updated from pending checkout", {
    email: maskEmail(normalizedEmail),
    userId,
    workspaceId,
    stripeCustomerId,
    eventId: event.id,
    plan: planName,
    priceSource: priceResult.source,
  });
}
