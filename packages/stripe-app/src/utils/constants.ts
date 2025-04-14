import { StripeMode } from "./types";

// Pimms
export const DUB_CLIENT_ID =
  "pimms_app_4b7e941fc05cf3a1941857797d106a9034760b70f7130bba";
export const DUB_HOST = "https://app.pimms.io";
export const DUB_API_HOST = "https://api.pimms.io";

// Stripe
export const STRIPE_MODE: StripeMode = "live" as StripeMode;
export const STRIPE_REDIRECT_URL = `https://dashboard.stripe.com/${STRIPE_MODE === "live" ? "" : "test/"}apps-oauth/pimms.io`;
