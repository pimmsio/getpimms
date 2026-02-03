import { DubApiError } from "@/lib/api/errors";
import { isDubAdmin, withWorkspace } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { APP_DOMAIN } from "@dub/utils";
import { NextResponse } from "next/server";

export const POST = withWorkspace(async ({ req, workspace, session }) => {
  let { plan, period, baseUrl, onboarding, currency } = await req.json();

  if (!plan || !period) {
    return new Response("Invalid plan or period", { status: 400 });
  }

  plan = plan.replace(" ", "+");
  const currencyCode = (currency ?? workspace.currency ?? "EUR")
    .toString()
    .toLowerCase() as "eur" | "usd";

  // Stripe allows only one lookup_key per price. Use currency suffix: pro_monthly_eur, pro_monthly_usd
  const lookupKey = `${plan}_${period}_${currencyCode}`;

  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
  });

  if (!prices.data || prices.data.length === 0) {
    return new Response(
      `Price not found for ${lookupKey}`,
      { status: 404 },
    );
  }

  const priceId = prices.data[0].id;
  const isLifetime = period === "lifetime";

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

  // For lifetime payments, always create a new checkout session (one-time payment)
  // For subscriptions, use billing portal if user has active subscription
  if (!isLifetime && workspace.stripeId && activeSubscription) {
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
              price: priceId,
            },
          ],
        },
      },
    });
    return NextResponse.json({ url });
  } else {
    // const customer = await getPimmsCustomer(session.user.id);

    // For both new users and users with canceled subscriptions
    // For lifetime payments, use "payment" mode (one-time)
    // For subscriptions, use "subscription" mode
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
      line_items: [{ price: priceId, quantity: 1 }],
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
      mode: isLifetime ? "payment" : "subscription",
      client_reference_id: workspace.id,
      metadata: {
        pimmsCustomerId: session.user.id,
      },
    });

    return NextResponse.json(stripeSession);
  }
});
