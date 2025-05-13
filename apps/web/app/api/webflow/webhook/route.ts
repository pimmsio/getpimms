import { withAxiom } from "next-axiom";
import { customerCreated } from "./customer-created";
import { getClickData, getFirstAvailableField, getLink, isValidPimmsId } from "./utils";
import { parseWorkspaceId } from "@/lib/webhook/utils";

const relevantEvents = new Set(["form_submission"]);

export const POST = withAxiom(async (req: Request) => {
  const rawBody = await req.text();

  const url = new URL(req.url);
  const workspaceId = parseWorkspaceId(url.searchParams.get("workspace_id"));

  console.log("workspaceId", workspaceId);
  console.log("rawBody", rawBody);

  if (!workspaceId) {
    return new Response("Missing workspace_id", { status: 400 });
  }

  const body = JSON.parse(rawBody);
  const eventType = body.triggerType;

  if (!eventType || !relevantEvents.has(eventType)) {
    return new Response("Unsupported event, skipping...", { status: 200 });
  }

  let response = "OK";

  switch (eventType) {
    case "form_submission":
      try {
        const formPayload = body.payload;
        const data = formPayload?.data || {};

        const pimmsId = getFirstAvailableField(data, ["pimms_id"]);

        console.log("pimmsId", pimmsId);

        if (!pimmsId) {
          throw new Error("Missing pimms_id in payload.data, skipping...");
        }

        const clickData = await getClickData(pimmsId);
        const link = await getLink(clickData);
        const isValid = await isValidPimmsId(link, workspaceId);

        if (!isValid) {
          throw new Error("Invalid pimms_id, skipping...");
        }

        response = await customerCreated(data, pimmsId, link, clickData);
      } catch (error: any) {
        console.error(error);
        response = error.message || "Unknown error";
      }
      break;
  }

  return new Response(response, { status: 200 });
});
