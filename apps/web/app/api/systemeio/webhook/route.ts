import { handleWebhookError, WebhookError } from "@/lib/webhook/utils";
import { withAxiom } from "next-axiom";
import { customCustomerCreated } from "./customer-created";
import { customSaleCreated } from "./sale-created";
import { checkValidSignature } from "./utils";

const relevantEvents = new Set(["CONTACT_OPT_IN", "SALE_NEW"]);

export const POST = withAxiom(async (req: Request) => {
  const rawBody = await req.text();
  console.log("rawBody", rawBody);

  const eventType = req.headers.get("x-webhook-event");
  console.log("eventType", eventType);

  let response = "OK";

  try {
    checkValidSignature(req, rawBody);

    if (!eventType || !relevantEvents.has(eventType)) {
      throw new WebhookError("Unsupported event, skipping...", 200);
    }

    const body = JSON.parse(rawBody);

    switch (eventType) {
      case "CONTACT_OPT_IN":
        response = await customCustomerCreated(body);
        break;
      case "SALE_NEW":
        response = await customSaleCreated(body);
        break;
    }
  } catch (error: any) {
    return handleWebhookError(error, `Error processing ${eventType}`);
  }

  return new Response(response, { status: 200 });
});
