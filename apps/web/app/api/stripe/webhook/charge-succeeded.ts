import { prisma } from "@dub/prisma";
import Stripe from "stripe";

/**
 * Stripe `charge.succeeded` webhook handler.
 *
 * Important: we intentionally keep this handler **free of partner/commission/payout logic**
 * and only update an internal Invoice record if the charge is associated to one.
 */
export async function chargeSucceeded(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;

  // Historically we used `transfer_group` to associate the charge to an internal invoice id.
  const { transfer_group: invoiceId, receipt_url: receiptUrl } = charge;

  if (!invoiceId) {
    // Not an invoice-linked charge; ignore.
    return;
  }

  await prisma.invoice.update({
    where: {
      id: invoiceId,
    },
    data: {
      status: "completed",
      paidAt: new Date(),
      ...(receiptUrl ? { receiptUrl } : {}),
    },
  });
}
