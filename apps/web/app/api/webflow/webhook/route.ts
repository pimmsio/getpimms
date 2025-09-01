import {
  getClickData,
  getFirstAvailableField,
  getLink,
  isValidPimmsId,
} from "@/lib/webhook/custom";
import { customerCreated, getCustomerData } from "@/lib/webhook/customer-created";
import { getWorkspaceIdFromUrl, handleWebhookError, WebhookError } from "@/lib/webhook/utils";
import { withAxiom } from "next-axiom";

const relevantEvents = new Set(["form_submission"]);

export const POST = withAxiom(async (req: Request) => {
  const rawBody = await req.text();
  console.log("rawBody", rawBody);

  let response = "OK";

  try {
    const workspaceId = getWorkspaceIdFromUrl(req);

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

        const clickData = await getClickData(pimmsId);
        const link = await getLink(clickData);

        console.log("clickData", clickData.click_id);
        console.log("link found", link.id, link.projectId);

        const isValid = await isValidPimmsId(link, workspaceId);

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
