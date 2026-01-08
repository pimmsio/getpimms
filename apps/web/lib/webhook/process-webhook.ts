import { handleTyReconciliation } from "@/lib/thankyou/reconcile";
import { processCustomerCreatedFromPimmsId } from "@/lib/webhook/customer-created";
import {
  getUntrustedWorkspaceIdFromUrl,
  handleWebhookError,
  WebhookError,
} from "@/lib/webhook/utils";
import { prisma } from "@dub/prisma";
import { withAxiom } from "next-axiom";

type WebhookData = Record<string, any>;

export type WebhookConfig = {
  provider?: string;
  parseBody: (body: string) => Record<string, any>;
  extractPimmsId: (parsed: WebhookData) => string | null;
  extractData: (parsed: WebhookData) => WebhookData;
  validateSignature?: (req: Request, body: string) => void;
  filterEvent?: (parsed: WebhookData) => boolean;
  isTYReconciliationEnabled?: boolean;
};

export const processWebhook = (
  config: WebhookConfig,
  appName: string = "webhook",
) => {
  const {
    provider = "generic",
    parseBody,
    validateSignature,
    filterEvent,
    extractData,
    extractPimmsId,
    isTYReconciliationEnabled,
  } = config;

  // Generate error messages from app name
  const failedReason = `Missing pimms_id in ${appName} webhook`;
  const errorPrefix = `Error processing ${appName} webhook`;

  return withAxiom(async (req: Request) => {
    const body = await req.text();
    console.log(`[Webhook:${appName}] Raw body received`, {
      bodyLength: body.length,
      hasBody: !!body,
    });

    let response = "OK";

    try {
      // Optional signature validation
      if (validateSignature) {
        console.log(`[Webhook:${appName}] Validating signature`);
        validateSignature(req, body);
        console.log(`[Webhook:${appName}] Signature validation passed`);
      } else {
        console.log(`[Webhook:${appName}] No signature validation configured`);
      }

      const untrustedWorkspaceId = getUntrustedWorkspaceIdFromUrl(req);
      console.log(`[Webhook:${appName}] Workspace ID extracted`, {
        workspaceId: untrustedWorkspaceId,
      });

      // Parse body
      const parsed = parseBody(body);
      console.log(`[Webhook:${appName}] Body parsed`, {
        hasParsedData: !!parsed,
        keys: Object.keys(parsed || {}),
      });

      // Optional event filtering
      if (filterEvent) {
        console.log(`[Webhook:${appName}] Filtering event`);
        const eventPassed = filterEvent(parsed);
        if (!eventPassed) {
          console.log(`[Webhook:${appName}] Event filtered out, returning OK`);
          return new Response("OK", { status: 200 });
        }
        console.log(`[Webhook:${appName}] Event passed filter`);
      }

      // Extract data for processing
      const extracted = extractData(parsed);
      console.log(`[Webhook:${appName}] Data extracted`, {
        hasExtractedData: !!extracted,
        extractedKeys: Object.keys(extracted || {}),
      });

      // Extract pimmsId
      let pimmsId = extractPimmsId(parsed);
      console.log(`[Webhook:${appName}] PimmsId extracted`, {
        hasPimmsId: !!pimmsId,
        pimmsId: pimmsId?.substring(0, 20) + (pimmsId ? "..." : ""),
      });

      if (!pimmsId) {
        if (isTYReconciliationEnabled) {
          // TY reconciliation flow: try to match with pending TY link hits
          console.log(`[Webhook:${appName}] No pimmsId, attempting TY reconciliation`);
          const result = await handleTyReconciliation({
            workspaceId: untrustedWorkspaceId,
            provider,
            payload: extracted,
            failedReason,
          });
          if (result.shouldReturnEarly) {
            console.log(`[Webhook:${appName}] TY reconciliation: webhook stored, returning early`);
            return new Response("OK", { status: 200 });
          }
          pimmsId = result.pimmsId;
          console.log(`[Webhook:${appName}] TY reconciliation: pimmsId found`, {
            pimmsId: pimmsId?.substring(0, 20) + "...",
          });
        } else {
          // Original behavior: create webhookError and throw
          console.log(`[Webhook:${appName}] No pimmsId, creating webhook error`);
          await prisma.webhookError.create({
            data: {
              projectId: untrustedWorkspaceId,
              failedReason,
              hasPimmsId: false,
            },
          });
          throw new WebhookError("Missing pimms_id, skipping...", 200);
        }
      }

      console.log(`[Webhook:${appName}] Processing customer from pimmsId`, {
        pimmsId: pimmsId.substring(0, 20) + "...",
        workspaceId: untrustedWorkspaceId,
      });
      response = await processCustomerCreatedFromPimmsId({
        clickId: pimmsId,
        workspaceId: untrustedWorkspaceId,
        data: extracted,
      });
      console.log(`[Webhook:${appName}] Successfully processed`, {
        response: response.substring(0, 100),
      });
    } catch (error) {
      console.error(`[Webhook:${appName}] Error processing webhook`, {
        error: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : typeof error,
      });
      return handleWebhookError(error, errorPrefix);
    }

    return new Response(response, { status: 200 });
  });
};
