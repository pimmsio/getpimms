import { Link, Webhook, WebhookReceiver } from "@dub/prisma/client";
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

export function fixSomeWorkspaceId(input: string | null): string | null {
  if (!input) return null;
  return input.startsWith("ws_cm") ? input.slice(3) : input;
}

export const getUntrustedWorkspaceIdFromUrl = (req: Request) => {
  const url = new URL(req.url);

  const workspaceId = fixSomeWorkspaceId(url.searchParams.get("workspace_id"));

  if (!workspaceId) {
    throw new WebhookError("Missing workspace_id", 400);
  }

  return workspaceId;
};

export const getUntrustedWorkspaceIdFromUrlNoFix = (req: Request) => {
  const url = new URL(req.url);

  const workspaceId = url.searchParams.get("workspace_id");

  if (!workspaceId) {
    throw new WebhookError("Missing workspace_id", 400);
  }

  return workspaceId;
};

export const getWorkspaceIdFromLink = (link: Link) => {
  if (!link.projectId) {
    throw new WebhookError("Missing projectId in link, skipping...", 200);
  }

  return link.projectId;
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
