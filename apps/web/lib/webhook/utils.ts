import { Webhook, WebhookReceiver } from "@dub/prisma/client";
import { LINK_LEVEL_WEBHOOK_TRIGGERS } from "./constants";

export const WebhookError = class extends Error {
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }

  public readonly code: number;
};

const webhookReceivers: Record<string, WebhookReceiver> = {
  "zapier.com": "zapier",
  "hooks.zapier.com": "zapier",
  "make.com": "make",
  "hooks.slack.com": "slack",
  "api.segment.io": "segment",
};

export const isLinkLevelWebhook = (webhook: Pick<Webhook, "triggers">) => {
  if (!webhook.triggers) {
    return false;
  }

  const triggers =
    webhook.triggers as (typeof LINK_LEVEL_WEBHOOK_TRIGGERS)[number][];

  return triggers.some((trigger) =>
    LINK_LEVEL_WEBHOOK_TRIGGERS.includes(trigger),
  );
};

export const identifyWebhookReceiver = (url: string): WebhookReceiver => {
  const { hostname } = new URL(url);

  return webhookReceivers[hostname] || "user";
};

export function parseWorkspaceId(input: string | null): string | null {
  if (!input) return null;
  return input.startsWith("ws_") ? input.slice(3) : input;
}

export const getWorkspaceIdFromUrl = (req: Request, parse: boolean = true) => {
  const url = new URL(req.url);
  const originalWorkspaceId = url.searchParams.get("workspace_id");
  const workspaceId = parse ? parseWorkspaceId(url.searchParams.get("workspace_id")) : originalWorkspaceId;

  console.log("workspaceId from url", workspaceId);

  if (!workspaceId) {
    throw new WebhookError("Missing workspace_id", 400);
  }

  return workspaceId;
};

export const handleWebhookError = (error: any, prefix: string = "") => {
  console.error(error);
  const response = `${prefix ? `${prefix}: ` : ""} ${error.message || "Unknown error"}`;
  if (error instanceof WebhookError) {
    return new Response(response, { status: error.code });
  }

  // Fallback to 200: does not block the webhook from being processed
  return new Response(response, { status: 200 });
};
