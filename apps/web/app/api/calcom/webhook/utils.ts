import { getUntrustedWorkspaceIdFromUrlNoFix, WebhookError } from "@/lib/webhook/utils";
import crypto from "crypto";

export const checkValidSignature = (req: Request, rawBody: string) => {
  // Get workspace ID to use as the secret key (users should configure this as their Cal.com webhook secret)
  const untrustedWorkspaceId = getUntrustedWorkspaceIdFromUrlNoFix(req);

  // Cal.com sends signature in x-cal-signature-256 header
  const signature = req.headers.get("x-cal-signature-256");

  if (!signature) {
    throw new WebhookError("Cal.com signature (x-cal-signature-256) is required", 400);
  }

  // Create HMAC using workspace ID as secret key and update with webhook payload
  const expectedSignature = crypto
    .createHmac("sha256", untrustedWorkspaceId)
    .update(rawBody)
    .digest("hex");

  // Compare the hash received in header with the one we created
  const isValid = crypto.timingSafeEqual(
    new Uint8Array(Buffer.from(expectedSignature, "hex")),
    new Uint8Array(Buffer.from(signature, "hex")),
  );

  if (!isValid) {
    throw new WebhookError("Invalid Cal.com signature - payload authenticity cannot be verified", 401);
  }
};
