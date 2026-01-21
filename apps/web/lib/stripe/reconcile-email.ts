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
  // Extract sessionId and priceId from details if present
  const sessionIdMatch = details?.find((d) => d.startsWith("SessionId: "));
  const sessionId = sessionIdMatch?.replace("SessionId: ", "");
  const priceIdMatch = details?.find((d) => d.startsWith("PriceId: "));
  const priceId = priceIdMatch?.replace("PriceId: ", "");
  
  console.log(`[Stripe Reconcile] Reconcile failure: ${reason}`, {
    email: maskEmail(email),
    userId,
    eventId,
    ...(sessionId && { sessionId }),
    ...(priceId && { priceId }),
  });

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
    return;
  }

  const event = pending.payload as Stripe.Event;
  const session = event.data.object as Stripe.Checkout.Session;
  
  // Retrieve the full session from Stripe to get the customer that was created automatically
  // Stripe creates a customer automatically when using customer_email, but it might not be
  // immediately available in the webhook event, so we retrieve it fresh
  let stripeCustomerId = session.customer?.toString();
  if (!stripeCustomerId) {
    try {
      const freshSession = await stripe.checkout.sessions.retrieve(session.id);
      stripeCustomerId = freshSession.customer?.toString() || undefined;
    } catch (error) {
      // Ignore error, will try to find by email
    }
  }

  const userWorkspaces = await prisma.projectUsers.findMany({
    where: { userId },
    select: { projectId: true },
  });
  const workspaceIds = userWorkspaces.map((item) => item.projectId);

  if (workspaceIds.length > 1) {
    await notifyAdminReconcileFailure({
      email: normalizedEmail,
      userId,
      eventId: event.id,
      reason: "multiple_workspaces",
    });
    return;
  }

  const workspaceId = workspaceIds[0];
  if (!workspaceId) {
    await notifyAdminReconcileFailure({
      email: normalizedEmail,
      userId,
      eventId: event.id,
      reason: "no_workspace",
    });
    return;
  }

  // For one-time payments, the customer might not be set on the session initially
  // Try to retrieve or create the customer from Stripe
  let finalStripeCustomerId = stripeCustomerId;
  if (!finalStripeCustomerId) {
    // For one-time payments, try to get customer from payment intent
    if (session.payment_intent && typeof session.payment_intent === "string") {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          session.payment_intent,
        );
        finalStripeCustomerId = paymentIntent.customer?.toString() || undefined;
      } catch (error) {
        // Ignore error, will try to find or create customer
      }
    }
    
    // If still no customer, try to find existing customer by email first
    if (!finalStripeCustomerId && normalizedEmail) {
      try {
        const existingCustomers = await stripe.customers.list({
          email: normalizedEmail,
          limit: 1,
        });
        if (existingCustomers.data.length > 0) {
          finalStripeCustomerId = existingCustomers.data[0].id;
        }
      } catch (error) {
        // Ignore error, will create new customer
      }
    }
    
    // If still no customer, create one
    if (!finalStripeCustomerId && normalizedEmail) {
      try {
        const customer = await stripe.customers.create({
          email: normalizedEmail,
          metadata: {
            reconciledFrom: "pending_checkout",
            sessionId: session.id,
          },
        });
        finalStripeCustomerId = customer.id;
      } catch (error) {
        // Ignore error, will fail later if still no customer
      }
    }
    
    // If we have a customer but the payment intent doesn't, update it
    if (finalStripeCustomerId && session.payment_intent && typeof session.payment_intent === "string") {
      try {
        await stripe.paymentIntents.update(session.payment_intent, {
          customer: finalStripeCustomerId,
        });
      } catch (error) {
        // Ignore error, payment intent might already be completed
      }
    }
  }
  
  if (!finalStripeCustomerId) {
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

  // Get current workspace to preserve existing store data
  const workspace = await prisma.project.findUnique({
    where: { id: workspaceId },
    select: { store: true },
  });

  // Store reconciled session ID so it can be retrieved in invoices list
  // This is needed because the checkout session might not be associated with the customer
  const existingStore = (workspace?.store as Record<string, any>) || {};
  const reconciledSessions = (existingStore.reconciledSessions as string[]) || [];
  if (!reconciledSessions.includes(session.id)) {
    reconciledSessions.push(session.id);
  }

  await Promise.allSettled([
    prisma.project.update({
      where: { id: workspaceId },
      data: {
        stripeId: finalStripeCustomerId,
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
        store: {
          ...existingStore,
          reconciledSessions,
        },
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
    stripeCustomerId: finalStripeCustomerId,
    eventId: event.id,
    plan: planName,
    priceSource: priceResult.source,
  });
}
