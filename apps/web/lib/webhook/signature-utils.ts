import { getUntrustedWorkspaceIdFromUrlNoFix, WebhookError } from "@/lib/webhook/utils";
import crypto from "crypto";

/**
 * Generic webhook signature validation utility
 * Validates HMAC SHA-256 signatures using workspace ID as the secret key
 * 
 * @param req - The incoming request
 * @param rawBody - The raw request body as a string
 * @param headerName - The header name containing the signature (e.g., "x-cal-signature-256")
 * @returns void - Throws WebhookError if validation fails
 */
export const checkValidSignature = (
  req: Request,
  rawBody: string,
  headerName: string = "x-cal-signature-256",
) => {
  // Get workspace ID to use as the secret key
  const untrustedWorkspaceId = getUntrustedWorkspaceIdFromUrlNoFix(req);

  // Get signature from the specified header
  const signature = req.headers.get(headerName);

  if (!signature) {
    throw new WebhookError(
      `Webhook signature (${headerName}) is required`,
      400,
    );
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
    throw new WebhookError(
      `Invalid webhook signature (${headerName}) - payload authenticity cannot be verified`,
      401,
    );
  }
};
