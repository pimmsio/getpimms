import { withWorkspace } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { InvoiceSchema } from "@/lib/zod/schemas/invoices";
import { prisma } from "@dub/prisma";
import { APP_DOMAIN } from "@dub/utils";
import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  type: z.enum(["subscription", "payout"]).optional().default("subscription"),
});

export const GET = withWorkspace(async ({ workspace, searchParams, params }) => {
  if (!workspace.stripeId) {
    return NextResponse.json([]);
  }

  const { type } = querySchema.parse(searchParams);
  const workspaceSlug = workspace.slug || params.idOrSlug;

  const invoices =
    type === "subscription"
      ? await subscriptionInvoices(workspace.stripeId, workspaceSlug, workspace)
      : await payoutInvoices(workspace.id);

  return NextResponse.json(z.array(InvoiceSchema).parse(invoices));
});

const subscriptionInvoices = async (
  stripeId: string,
  workspaceSlug: string,
  workspace: { store?: any },
) => {
  try {
    // Get subscription invoices
    const invoices = await stripe.invoices.list({
      customer: stripeId,
    });

    // Get checkout sessions to identify lifetime deals (mode: "payment")
    const checkoutSessions = await stripe.checkout.sessions.list({
      customer: stripeId,
      limit: 100,
    });

    // Get reconciled session IDs from workspace metadata
    // These are sessions that were reconciled but might not be associated with the customer
    const store = (workspace.store as Record<string, any>) || {};
    const reconciledSessionIds = (store.reconciledSessions as string[]) || [];

    // Retrieve reconciled sessions directly by ID
    const reconciledSessions = await Promise.all(
      reconciledSessionIds.map(async (sessionId) => {
        try {
          return await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ["line_items"],
          });
        } catch (error) {
          // Session might not exist or be inaccessible, skip it
          return null;
        }
      }),
    );

    // Combine regular and reconciled sessions, deduplicate by ID
    const allSessions = new Map<string, typeof checkoutSessions.data[0]>();
    for (const session of checkoutSessions.data) {
      allSessions.set(session.id, session);
    }
    for (const session of reconciledSessions) {
      if (session && !allSessions.has(session.id)) {
        allSessions.set(session.id, session);
      }
    }

    // Get invoice IDs to exclude charges that are already covered by invoices
    const invoiceIds = new Set(invoices.data.map((inv) => inv.id));

    // Get lifetime deals from checkout sessions with mode: "payment" (one-time payments)
    // These are the true lifetime deals, not charges from subscriptions
    const lifetimeDealSessions = Array.from(allSessions.values()).filter(
      (session) => session.mode === "payment" && session.payment_status === "paid",
    );

    // Get charges for lifetime deals - retrieve session details to get amount
    const oneTimePayments = await Promise.all(
      lifetimeDealSessions.map(async (session) => {
        // Retrieve full session to get amount_total
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ["line_items"],
        });

        return {
          id: session.id, // Use session ID as identifier
          total: fullSession.amount_total || 0,
          createdAt: new Date(fullSession.created * 1000),
          description: "PIMMS lifetime deal",
          pdfUrl: `/api/workspaces/${workspaceSlug}/billing/invoices/lifetime/${session.id}`, // Generate PDF on demand
        };
      }),
    );

    // Combine subscription invoices and one-time payments, sorted by date
    const allInvoices = [
      ...invoices.data.map((invoice) => {
        return {
          id: invoice.id,
          total: invoice.amount_paid,
          createdAt: new Date(invoice.created * 1000),
          description: "PIMMS subscription",
          pdfUrl: invoice.invoice_pdf,
        };
      }),
      ...oneTimePayments,
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by date, newest first

    return allInvoices;
  } catch (error) {
    console.log(error);
    return [];
  }
};
const payoutInvoices = async (workspaceId: string) => {
  const invoices = await prisma.invoice.findMany({
    where: {
      workspaceId,
    },
    select: {
      id: true,
      total: true,
      createdAt: true,
      status: true,
      failedReason: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return invoices.map((invoice) => {
    return {
      ...invoice,
      description: "Dub Partner payout",
      pdfUrl:
        invoice.status === "completed"
          ? `${APP_DOMAIN}/invoices/${invoice.id}`
          : null,
    };
  });
};

