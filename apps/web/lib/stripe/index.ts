import Stripe from "stripe";

function createStripeClient(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;

  // Don't crash during `next build` in CI/local when secrets aren't present.
  // Routes that actually need Stripe will fail at runtime with a clear error.
  if (!apiKey) {
    return new Proxy({} as Stripe, {
      get() {
        throw new Error("STRIPE_SECRET_KEY is not set");
      },
    });
  }

  return new Stripe(apiKey, {
    appInfo: {
      name: "PIMMS",
      version: "0.1.0",
    },
  });
}

export const stripe = createStripeClient();
