import {
  getClickData,
  getFirstAvailableField,
  getLink,
  isValidPimmsId,
} from "@/lib/webhook/custom";
import { customerCreated, getCustomerData } from "@/lib/webhook/customer-created";
import { getUntrustedWorkspaceIdFromUrl, getWorkspaceIdFromLink, handleWebhookError, WebhookError } from "@/lib/webhook/utils";
import { withAxiom } from "next-axiom";
import { prisma } from "@dub/prisma";

const relevantEvents = new Set(["form_submission"]);

export const POST = withAxiom(async (req: Request) => {
  const rawBody = await req.text();
  console.log("rawBody", rawBody);

  let response = "OK";

  try {
    const untrustedWorkspaceId = getUntrustedWorkspaceIdFromUrl(req);

    const body = JSON.parse(rawBody);
    const eventType = body.triggerType;
    console.log("eventType", eventType);

    if (!eventType || !relevantEvents.has(eventType)) {
      throw new WebhookError("Unsupported event, skipping...", 200);
    }

    switch (eventType) {
      case "form_submission":
        const formPayload = body.payload;
        const data = formPayload?.data || {};

        const pimmsId = getFirstAvailableField(data, ["pimms_id"]);

        if (!pimmsId) {
          await prisma.webhookError.create({
            data: {
              projectId: untrustedWorkspaceId,
              failedReason: `Missing pimms_id in Webflow webhook, form id ${formPayload?.formId}`,
              hasPimmsId: false,
            },
          });
          
          throw new Error("Missing pimms_id, skipping...");
        }

        const clickData = await getClickData(pimmsId);
        const link = await getLink(clickData);
        const isValid = await isValidPimmsId(link, untrustedWorkspaceId);

        if (!isValid) {
          throw new Error("Invalid pimms_id, skipping...");
        }

        const customerData = await getCustomerData(data, pimmsId, link, clickData);
        response = await customerCreated(customerData);
        break;
    }
  } catch (error: any) {
    return handleWebhookError(error);
  }

  return new Response(response, { status: 200 });
});
