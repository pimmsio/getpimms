import { DubApiError } from "@/lib/api/errors";
import { isDubAdmin, withWorkspace } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { APP_DOMAIN } from "@dub/utils";
import { NextResponse } from "next/server";

export const POST = withWorkspace(async ({ req, workspace, session }) => {
  let { plan, eventsLimit, period, baseUrl, onboarding } = await req.json();

  if (!plan || !period || !eventsLimit) {
    return new Response("Invalid plan, period, or eventsLimit", { status: 400 });
  }

  plan = plan.replace(" ", "+");

  // Create lookup key based on tier: pro_5k_monthly, pro_20k_yearly, etc.
  const tierName = eventsLimit === 5000 ? '5k' : 
                   eventsLimit === 20000 ? '20k' :
                   eventsLimit === 40000 ? '40k' :
                   eventsLimit === 100000 ? '100k' : '200k';
  
  const lookupKey = `${plan}_${tierName}_${period}`;

  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
  });

  const activeSubscription = workspace.stripeId
    ? await stripe.subscriptions
        .list({
          customer: workspace.stripeId,
          status: "active",
        })
        .then((res) => res.data[0])
    : null;

  if (process.env.VERCEL === "1" && process.env.VERCEL_ENV === "preview") {
    const isAdminUser = await isDubAdmin(session.user.id);
    if (!isAdminUser) {
      throw new DubApiError({
        code: "unauthorized",
        message: "Unauthorized: Not an admin.",
      });
    }
  }

  // if the user has an active subscription, create billing portal to upgrade
  if (workspace.stripeId && activeSubscription) {
    const { url } = await stripe.billingPortal.sessions.create({
      customer: workspace.stripeId,
      return_url: baseUrl,
      flow_data: {
        type: "subscription_update_confirm",
        subscription_update_confirm: {
          subscription: activeSubscription.id,
          items: [
            {
              id: activeSubscription.items.data[0].id,
              quantity: 1,
              price: prices.data[0].id,
            },
          ],
        },
      },
    });
    return NextResponse.json({ url });
  } else {
    // const customer = await getPimmsCustomer(session.user.id);

    // For both new users and users with canceled subscriptions
    const stripeSession = await stripe.checkout.sessions.create({
      ...(workspace.stripeId
        ? {
            customer: workspace.stripeId,
            // need to pass this or Stripe will throw an error: https://git.new/kX4fi6B
            customer_update: {
              name: "auto",
              address: "auto",
            },
          }
        : {
            customer_email: session.user.email,
          }),
      billing_address_collection: "required",
      success_url: `${APP_DOMAIN}/${workspace.slug}?${onboarding ? "onboarded" : "upgraded"}=true&plan=${plan}&period=${period}`,
      cancel_url: baseUrl,
      line_items: [{ price: prices.data[0].id, quantity: 1 }],
      // ...(customer?.discount?.couponId
      //   ? {
      //       discounts: [
      //         {
      //           coupon:
      //             process.env.NODE_ENV !== "production" &&
      //             customer.discount.couponTestId
      //               ? customer.discount.couponTestId
      //               : customer.discount.couponId,
      //         },
      //       ],
      //     }
      //   : { allow_promotion_codes: true }),
      automatic_tax: {
        enabled: true,
      },
      tax_id_collection: {
        enabled: true,
      },
      mode: period === "lifetime" ? "payment" : "subscription",
      client_reference_id: workspace.id,
      metadata: {
        pimmsCustomerId: session.user.id,
        eventsLimit: eventsLimit.toString(),
        period: period,
      },
    });

    return NextResponse.json(stripeSession);
  }
});
