import crypto from "crypto";
import { withAxiom } from "next-axiom";
import { customerCreated } from "./customer-created";
import { saleCreated } from "./sale-created";

const relevantEvents = new Set(["CONTACT_OPT_IN", "SALE_NEW"]);

export const POST = withAxiom(async (req: Request) => {
  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature");
  const eventType = req.headers.get("x-webhook-event");

  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspace_id");

  console.log("workspaceId", workspaceId);
  console.log("eventType", eventType);
  console.log("rawBody", rawBody);

  if (!workspaceId || !signature) {
    return new Response("Missing workspace_id or signature", { status: 400 });
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
    return new Response("Invalid signature", { status: 401 });
  }

  if (!eventType || !relevantEvents.has(eventType)) {
    return new Response("Unsupported event, skipping...", { status: 200 });
  }

  const body = JSON.parse(rawBody);
  let response = "OK";

  try {
    switch (eventType) {
      case "CONTACT_OPT_IN":
        response = await customerCreated(body);
        break;
      case "SALE_NEW":
        response = await saleCreated(body);
        break;
    }
  } catch (error: any) {
    console.error(`SystemeIO webhook ${eventType} processing error:`, error);
    response = `Error processing ${eventType}: ${error.message || "Unknown error"}`;
  }

  return new Response(response, { status: 200 });
});
