import { redis } from "@/lib/upstash";
import { APP_DOMAIN_WITH_NGROK, nanoid } from "@dub/utils";

// Get the installation URL for Slack
export const getStripeInstallationUrl = async (workspaceId: string) => {
  const state = nanoid(16);
  await redis.set(`stripe:install:state:${state}`, workspaceId, {
    ex: 30 * 60,
  });

  const url = new URL(process.env.STRIPE_APP_INSTALL_URL!);
  url.searchParams.set(
    "redirect_uri",
    `${APP_DOMAIN_WITH_NGROK}/api/stripe/integration/callback`,
  );
  url.searchParams.set("state", state);

  return url.toString();
};