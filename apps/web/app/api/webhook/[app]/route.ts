/**
 * Generic webhook handler for various apps
 * 
 * Supported apps: framer, elementor, webflow
 * 
 * Usage: POST /api/webhook/[app]
 * Example: POST /api/webhook/framer
 */
import { processWebhook } from "@/lib/webhook/process-webhook";
import { WEBHOOK_CONFIGS } from "@/lib/webhook/webhook-configs";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ app: string }> },
) {
  const { app } = await params;
  const appName = app.toLowerCase();
  const config = WEBHOOK_CONFIGS[appName] || WEBHOOK_CONFIGS.default;

  console.log("[Webhook Handler] Processing webhook", {
    app,
    appName,
    hasCustomConfig: !!WEBHOOK_CONFIGS[appName],
    usingDefault: !WEBHOOK_CONFIGS[appName],
  });

  return processWebhook(config, appName)(req);
}
