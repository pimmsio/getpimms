import { withWorkspace } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

// GET /api/workspaces/[idOrSlug]/billing/has-active-subscription - check if workspace has an active subscription
export const GET = withWorkspace(async ({ workspace }) => {
  if (!workspace.stripeId) {
    return NextResponse.json({ hasActiveSubscription: false });
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: workspace.stripeId,
      status: "active",
      limit: 1,
    });

    return NextResponse.json({
      hasActiveSubscription: subscriptions.data.length > 0,
    });
  } catch (error) {
    console.error("Error checking active subscription", error);
    return NextResponse.json({ hasActiveSubscription: false });
  }
});
