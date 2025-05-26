import { getClickEvent } from "@/lib/tinybird";
import { prisma } from "@dub/prisma";
import { Link } from "@prisma/client";
import { parseWorkspaceId } from "./utils";

export function getFirstAvailableField(
  data: Record<string, any>,
  keys: string[],
  matchPrefix: boolean = false,
): string | null {
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD") // decompose accents
      .replace(/[\u0300-\u036f]/g, "") // remove diacritics
      .replace(/[^a-z0-9]/g, ""); // remove all non-alphanum

  const normalizedEntries = Object.entries(data).map(([key, value]) => [
    normalize(key),
    value,
  ]);

  for (const key of keys) {
    const normKey = normalize(key);

    for (const [fieldKey, value] of normalizedEntries) {
      const isMatch = matchPrefix
        ? fieldKey.startsWith(normKey)
        : fieldKey === normKey;

      if (isMatch && value) return value;
    }
  }

  return null;
}

export const getClickData = async (pimmsId: string) => {
  if (!pimmsId) {
    throw new Error("Missing pimms_id, skipping...");
  }

  const clickEvent = await getClickEvent({ clickId: pimmsId });
  if (!clickEvent || clickEvent.data.length === 0) {
    throw new Error(`Click event with ID ${pimmsId} not found, skipping...`);
  }

  return clickEvent.data[0];
};

export const getLink = async (clickData: any) => {
  const linkId = clickData.link_id;

  const link = await prisma.link.findUnique({ where: { id: linkId } });

  if (!link || !link.projectId) throw new Error("Invalid link or project");

  return link;
};

export const isValidPimmsId = async (link: Link, workspaceId: string) => {
  if (!link || !link.projectId || !workspaceId) {
    throw new Error("Missing link, skipping...");
  }

  const parsedWorkspaceId = parseWorkspaceId(workspaceId);
  const parsedProjectId = parseWorkspaceId(link.projectId);

  return parsedWorkspaceId === parsedProjectId;
};
