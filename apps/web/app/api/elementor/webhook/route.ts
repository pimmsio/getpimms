import { withAxiom } from "next-axiom";
import {
  getClickData,
  getFirstAvailableField,
  getLink,
  isValidPimmsId,
} from "@/lib/webhook/custom";
import { getWorkspaceIdFromUrl, handleWebhookError } from "@/lib/webhook/utils";
import { customerCreated, getCustomerData } from "@/lib/webhook/customer-created";

export const POST = withAxiom(async (req: Request) => {
  const rawBody = await req.text();
  console.log("rawBody", rawBody);

  let response = "OK";

  try {
    const workspaceId = getWorkspaceIdFromUrl(req);

    // Parse URL-encoded form data from POST body
    const formData = new URLSearchParams(rawBody);
    const data: Record<string, string> = {};
    
    // Convert URLSearchParams to a regular object
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    console.log("Parsed form data:", data);

    const pimmsId = getFirstAvailableField(data, ["pimms_id"]);

    const clickData = await getClickData(pimmsId);
    const link = await getLink(clickData);
    const isValid = await isValidPimmsId(link, workspaceId);

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
