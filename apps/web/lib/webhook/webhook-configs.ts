import {
  extractUserFields,
  fieldsArrayToMap,
  getFirstAvailableField,
} from "@/lib/webhook/custom";
import { type WebhookConfig } from "@/lib/webhook/process-webhook";
import { checkValidSignature } from "@/lib/webhook/signature-utils";
import {
  getUntrustedWorkspaceIdFromUrlNoFix,
  WebhookError,
} from "@/lib/webhook/utils";
import crypto from "crypto";

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
  brevo: {
    parseBody: (body) => {
      console.log("body", body);
      return JSON.parse(body);
    },
    validateSignature: (req: Request, body: string) => {
      // Extract Bearer token from Authorization header
      const authHeader = req.headers.get("Authorization");
      console.log("authHeader", authHeader);
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new WebhookError("Missing or invalid Authorization header", 401);
      }

      const token = authHeader.substring(7); // Remove "Bearer " prefix

      // Extract workspace_id from URL query parameter
      const workspaceId = getUntrustedWorkspaceIdFromUrlNoFix(req);

      console.log("token", token);
      console.log("workspaceId", workspaceId);
      // Validate that token matches workspace_id
      if (token !== workspaceId) {
        throw new WebhookError("Invalid Bearer token", 401);
      }
    },
    filterEvent: (parsed) => {
      const eventName = parsed.event_name;
      if (!eventName || (eventName !== "form_submitted" && eventName !== "meeting_booked")) {
        throw new WebhookError("Unsupported event, skipping...", 200);
      }
      return true;
    },
    extractPimmsId: () => null,
    extractData: (parsed) => {
      const eventName = parsed.event_name;
      const identifiers = parsed.identifiers || {};
      let allData: Record<string, any> = { ...identifiers };

      // Handle different event types
      if (eventName === "form_submitted") {
        // For form_submitted: use contact_properties
        // Example: { contact_properties: { EMAIL: "...", OPT_IN: true }, identifiers: { email_id: "..." } }
        const contactProperties = parsed.contact_properties || {};
        console.log("contactProperties", contactProperties);
        allData = { ...contactProperties, ...identifiers };
      } else if (eventName === "meeting_booked") {
        // For meeting_booked: use event_participants array (first participant)
        // Example: { event_participants: [{ EMAIL: "...", FIRSTNAME: "...", LASTNAME: "..." }], identifiers: { email_id: "..." } }
        const participants = parsed.event_participants || [];
        const firstParticipant = participants[0] || {};
        console.log("event_participants", participants);
        console.log("firstParticipant", firstParticipant);
        // Merge firstParticipant with identifiers (firstParticipant takes precedence)
        allData = { ...identifiers, ...firstParticipant };
      }

      console.log("identifiers", identifiers);
      console.log("allData", allData);
      return extractUserFields(allData);
    },
    provider: "brevo",
    isTYReconciliationEnabled: true,
  },
  tally: {
    parseBody: (body) => JSON.parse(body),
    validateSignature: (req: Request, body: string) => {
      // Get workspace ID from URL query parameter to use as the signing key
      const untrustedWorkspaceId = getUntrustedWorkspaceIdFromUrlNoFix(req);

      // Tally.so uses 'Tally-Signature' header
      const signature = req.headers.get("tally-signature");

      if (!signature) {
        throw new WebhookError("Tally-Signature header is required", 400);
      }

      // Tally.so uses HMAC SHA256 with base64 encoding
      const expectedSignature = crypto
        .createHmac("sha256", untrustedWorkspaceId)
        .update(body)
        .digest("base64");

      // Compare signatures using timing-safe comparison
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "base64"),
        Buffer.from(signature, "base64"),
      );

      if (!isValid) {
        throw new WebhookError("Invalid Tally-Signature", 401);
      }
    },
    extractPimmsId: (parsed) => {
      // Tally webhook structure: data.fields is an array of field objects
      // Each field has: { key, label, type, value }
      // We need to find the field with label "pimms_id" (exact match for pimms_id)
      const fields = parsed?.data?.fields || [];
      
      // Use exact match for pimms_id to avoid false positives
      for (const field of fields) {
        if (field.label === "pimms_id" && field.value) {
          return field.value;
        }
      }
      
      return null;
    },
    extractData: (parsed) => {
      // Convert fields array to flat object with labels as keys
      const fields = parsed?.data?.fields || [];
      const fieldsMap = fieldsArrayToMap(fields);
      return extractUserFields(fieldsMap);
    },
    isTYReconciliationEnabled: true,
  },
};
