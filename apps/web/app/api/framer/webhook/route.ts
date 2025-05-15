import { withAxiom } from "next-axiom";
import { customerCreated } from "./customer-created";
import {
  getClickData,
  getFirstAvailableField,
  getLink,
  isValidPimmsId,
} from "@/lib/webhook/custom";
import { parseWorkspaceId } from "@/lib/webhook/utils";

export const POST = withAxiom(async (req: Request) => {
  const rawBody = await req.text();

  const url = new URL(req.url);
  const workspaceId = parseWorkspaceId(url.searchParams.get("workspace_id"));

  console.log("workspaceId", workspaceId);
  console.log("rawBody", rawBody);

  if (!workspaceId) {
    return new Response("Missing workspace_id", { status: 400 });
  }

  let response = "OK";

  try {
    const data = JSON.parse(rawBody);
    const pimmsId = getFirstAvailableField(data, ["pimms_id"]);

    console.log("pimmsId", pimmsId);

    if (!pimmsId) {
      throw new Error("Missing pimms_id in data, skipping...");
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

  return new Response(response, { status: 200 });
});
