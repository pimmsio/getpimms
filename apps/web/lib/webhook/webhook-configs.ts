import { getFirstAvailableField } from "@/lib/webhook/custom";
import { type WebhookConfig } from "@/lib/webhook/process-webhook";
import { checkValidSignature } from "@/lib/webhook/signature-utils";
import { WebhookError } from "@/lib/webhook/utils";

/**
 * Shared webhook configurations for different apps
 * Used by both the generic /api/webhook/[app] route and individual app routes
 *
 * Error messages are automatically generated from the app name:
 * - failedReason: "Missing pimms_id in {app} webhook"
 * - errorPrefix: "Error processing {app} webhook"
 */
export const WEBHOOK_CONFIGS: Record<string, WebhookConfig> = {
  default: {
    parseBody: (body) => JSON.parse(body),
    extractPimmsId: (parsed) => getFirstAvailableField(parsed, ["pimms_id"]),
    extractData: (parsed) => parsed,
    isTYReconciliationEnabled: true,
  },
  elementor: {
    parseBody: (body: string) => {
      const formData = new URLSearchParams(body);
      const data: Record<string, string> = {};
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }
      return data;
    },
    extractPimmsId: (parsed) => getFirstAvailableField(parsed, ["pimms_id"]),
    extractData: (parsed) => parsed,
    isTYReconciliationEnabled: false,
  },
  webflow: {
    parseBody: (body) => JSON.parse(body),
    extractPimmsId: (parsed) =>
      getFirstAvailableField(parsed?.payload?.data || {}, ["pimms_id"]),
    extractData: (parsed) => parsed?.payload?.data || {},
    filterEvent: (parsed) => {
      const eventType = parsed.triggerType;
      console.log("eventType", eventType);
      if (!eventType || eventType !== "form_submission") {
        throw new WebhookError("Unsupported event, skipping...", 200);
      }
      return true;
    },
    isTYReconciliationEnabled: false,
  },
  calcom: {
    parseBody: (body) => JSON.parse(body),
    validateSignature: (req: Request, body: string) =>
      checkValidSignature(req, body, "x-cal-signature-256"),
    filterEvent: (parsed) => {
      const eventType = parsed.triggerEvent;
      if (eventType !== "BOOKING_CREATED") {
        throw new WebhookError("Unsupported event, skipping...", 200);
      }
      return true;
    },
    extractPimmsId: (parsed) => {
      const payload = parsed.payload;
      const pimmsIdFromUserFields =
        payload?.userFieldsResponses?.pimms_id?.value;
      const pimmsIdFromResponses = payload?.responses?.pimms_id?.value;
      return pimmsIdFromUserFields || pimmsIdFromResponses || null;
    },
    extractData: (parsed) => {
      const payload = parsed.payload;
      const attendee = payload?.attendees?.[0];
      return {
        email: attendee?.email,
        name: attendee?.name,
      };
    },
    isTYReconciliationEnabled: false,
  },
};
