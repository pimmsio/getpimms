import { getWorkspaceIdFromUrl, WebhookError } from "@/lib/webhook/utils";
import crypto from "crypto";

export const checkValidSignature = (req: Request, rawBody: string) => {
  // Do not parse the workspace_id to check the signature
  const workspaceId = getWorkspaceIdFromUrl(req, false);

  const signature = req.headers.get("x-webhook-signature");

  if (!signature) {
    throw new WebhookError("Signature is required", 400);
  }

  const expectedSignature = crypto
    .createHmac("sha256", workspaceId)
    .update(rawBody)
    .digest("hex");

  const isValid = crypto.timingSafeEqual(
    new Uint8Array(Buffer.from(expectedSignature, "hex")),
    new Uint8Array(Buffer.from(signature, "hex")),
  );

  if (!isValid) {
    throw new WebhookError("Invalid signature", 401);
  }
};
