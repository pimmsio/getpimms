import { withAxiom } from "next-axiom";
import {
  getClickData,
  getFirstAvailableField,
  getLink,
  isValidPimmsId,
} from "@/lib/webhook/custom";
import {  getUntrustedWorkspaceIdFromUrl, getWorkspaceIdFromLink, handleWebhookError } from "@/lib/webhook/utils";
import { customerCreated, getCustomerData } from "@/lib/webhook/customer-created";
import { prisma } from "@dub/prisma";

export const POST = withAxiom(async (req: Request) => {
  const rawBody = await req.text();
  console.log("rawBody", rawBody);

  let response = "OK";

  try {
    const untrustedWorkspaceId = getUntrustedWorkspaceIdFromUrl(req);

    const data = JSON.parse(rawBody);
    const pimmsId = getFirstAvailableField(data, ["pimms_id"]);

    if (!pimmsId) {
      await prisma.webhookError.create({
        data: {
          projectId: untrustedWorkspaceId,
          failedReason: "Missing pimms_id in Framer webhook",
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
  } catch (error: any) {
    return handleWebhookError(error);
  }

  return new Response(response, { status: 200 });
});
