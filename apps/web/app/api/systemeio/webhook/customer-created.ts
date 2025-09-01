import { findLink, getClickData, getWorkspaceIdFromLink } from "@/lib/webhook/custom";
import { customerCreated, getName } from "@/lib/webhook/customer-created";
import { WebhookError } from "@/lib/webhook/utils";
import { prisma } from "@dub/prisma";

export async function customCustomerCreated(body: any) {
  const contact = body.contact;
  const email = contact.email;
  const fields = contact.fields || [];

  // 1. Prioritize pimms_id from sourceURL
  const clickId = getClickId(contact);

  // 3. Build full name
  const firstName = getField(fields, "first_name");
  const lastName = getField(fields, "last_name"); // not 'surname'
  const countryCode = (getField(fields, "country") || "FR").toUpperCase();
  const name = getName(firstName, lastName, null);

  const clickData = await getClickData(clickId);
  const linkId = clickData.link_id;

  const link = await findLink(linkId);
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

const getClickId = (contact: any) => {
  let clickId: string | null = null;

  try {
    const sourceURL = contact.sourceURL;
    if (sourceURL) {
      const url = new URL(sourceURL);
      clickId = url.searchParams.get("pimms_id");
    }
  } catch (_) {}

  // 2. Fallback to pimms_id field
  if (!clickId) {
    clickId = getField(contact.fields, "pimms_id");
  }

  if (!clickId) {
    throw new WebhookError("Missing pimms_id, skipping...", 200);
  }

  console.log("clickId", clickId);

  return clickId;
}