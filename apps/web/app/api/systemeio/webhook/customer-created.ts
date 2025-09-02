import { findLink, getClickData, getWorkspaceIdFromLink } from "@/lib/webhook/custom";
import { customerCreated, getName } from "@/lib/webhook/customer-created";
import { getUntrustedWorkspaceIdFromUrl, WebhookError } from "@/lib/webhook/utils";
import { prisma } from "@dub/prisma";

export async function customCustomerCreated(req: Request, body: any) {
  const contact = body.contact;
  const email = contact.email;
  const fields = contact.fields || [];

  // 1. Prioritize pimms_id from sourceURL
  const untrustedWorkspaceId = getUntrustedWorkspaceIdFromUrl(req);
  const clickId = await getClickId(contact, untrustedWorkspaceId);

  // 3. Build full name
  const firstName = getField(fields, "first_name");
  const lastName = getField(fields, "last_name"); // not 'surname'
  const countryCode = (getField(fields, "country") || "FR").toUpperCase();
  const name = getName(firstName, lastName, null);

  const clickData = await getClickData(clickId);
  const linkId = clickData.link_id;

  const link = await findLink(linkId);
  // Check that the workspace id is valid
  const workspaceId = await getWorkspaceIdFromLink(link);

  return await customerCreated({
    clickData,
    link,
    workspaceId,
    pimmsId: clickId,
    email,
    name,
    countryCode,
  });
}

const getField = (fields: any[], slug: string) =>
  fields.find((f: any) => f.slug === slug)?.value;

const getClickId = async (contact: any, untrustedWorkspaceId: string) => {
  let clickId: string | null = null;

  const sourceURL = contact.sourceURL;

  try {
    const url = new URL(sourceURL);
    clickId = url.searchParams.get("pimms_id");
  } catch (_) {}

  // 2. Fallback to pimms_id field
  if (!clickId) {
    clickId = getField(contact.fields, "pimms_id");
  }

  if (!clickId) {
    const error = "Missing pimms_id";

    await prisma.webhookError.create({
      data: {
        projectId: untrustedWorkspaceId,
        url: sourceURL,
        failedReason: error,
        hasPimmsId: false,
      },
    });

    throw new WebhookError("Missing pimms_id, skipping...", 200);
  }

  console.log("clickId", clickId);

  return clickId;
}