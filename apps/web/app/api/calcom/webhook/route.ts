import { withAxiom } from "next-axiom";
import {
  getClickData,
  getLink,
  isValidPimmsId,
} from "@/lib/webhook/custom";
import { getUntrustedWorkspaceIdFromUrl, handleWebhookError, WebhookError } from "@/lib/webhook/utils";
import { customerCreated, getCustomerData } from "@/lib/webhook/customer-created";
import { prisma } from "@dub/prisma";
import { checkValidSignature } from "./utils";

const relevantEvents = new Set(["BOOKING_CREATED"]);

export const POST = withAxiom(async (req: Request) => {
  const rawBody = await req.text();
  console.log("rawBody", rawBody);

  let response = "OK";

  try {
    checkValidSignature(req, rawBody);

    const untrustedWorkspaceId = getUntrustedWorkspaceIdFromUrl(req);

    const body = JSON.parse(rawBody);
    const eventType = body.triggerEvent;
    console.log("eventType", eventType);

    if (!eventType || !relevantEvents.has(eventType)) {
      throw new WebhookError("Unsupported event, skipping...", 200);
    }

    switch (eventType) {
      case "BOOKING_CREATED":
        const payload = body.payload;
        
        // Extract attendee information (first attendee)
        const attendee = payload?.attendees?.[0];
        const email = attendee?.email;
        const name = attendee?.name;
        
        // Extract pimms_id from userFieldsResponses or responses
        const pimmsIdFromUserFields = payload?.userFieldsResponses?.pimms_id?.value;
        const pimmsIdFromResponses = payload?.responses?.pimms_id?.value;
        const pimmsId = pimmsIdFromUserFields || pimmsIdFromResponses;

        // Create data object for processing
        const data = {
          email,
          name,
          pimms_id: pimmsId,
          booking_id: payload?.bookingId?.toString(),
          title: payload?.title,
          start_time: payload?.startTime,
        };

        console.log("Cal.com webhook data:", data);

        if (!pimmsId) {
          await prisma.webhookError.create({
            data: {
              projectId: untrustedWorkspaceId,
              failedReason: `Missing pimms_id in Cal.com webhook, booking #${payload?.bookingId}`,
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
    return handleWebhookError(error, "Error processing Cal.com webhook");
  }

  return new Response(response, { status: 200 });
});