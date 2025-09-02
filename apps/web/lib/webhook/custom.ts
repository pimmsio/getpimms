import { getClickEvent, tb } from "@/lib/tinybird";
import { prisma } from "@dub/prisma";
import { Link } from "@prisma/client";
import { fixSomeWorkspaceId, WebhookError } from "./utils";
import z from "../zod";

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
        ? fieldKey.includes(normKey) // prefix or suffix
        : fieldKey === normKey;

      if (isMatch && value) return value;
    }
  }

  return null;
}

export const getClickData = async (pimmsId: string) => {
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

  const parsedWorkspaceId = fixSomeWorkspaceId(workspaceId);
  const parsedProjectId = link.projectId;

  return parsedWorkspaceId === parsedProjectId;
};

export const computeAnonymousCustomerFields = async (clickData: any) => {
  const anonymousId: string | null = clickData?.identity_hash || null;

  let totalHistoricalClicks = 0;
  let lastClickAt: Date | null = null;

  try {
    if (anonymousId) {
      const pipe = tb.buildPipe({
        pipe: "get_anonymous_event",
        parameters: z.object({
          identityHash: z.string(),
          limit: z.number().optional().default(1000),
        }),
        data: z.any(),
      });

      const resp = await pipe({ identityHash: anonymousId, limit: 1000 });
      const events = Array.isArray(resp?.data) ? resp.data : [];
      totalHistoricalClicks = events.length || 0;
      if (events.length > 0 && events[0]?.timestamp) {
        lastClickAt = new Date(events[0].timestamp + "Z");
      }
    }
  } catch (_) {
    // ignore errors and fallback to clickData timestamp
  }

  if (!lastClickAt && clickData?.timestamp) {
    lastClickAt = new Date(clickData.timestamp + "Z");
  }

  return {
    anonymousId,
    totalClicks: totalHistoricalClicks,
    lastClickAt,
  } as {
    anonymousId: string | null;
    totalClicks: number;
    lastClickAt: Date | null;
  };
};

export const findLink = async (linkId: string) => {
  const link = await prisma.link.findUnique({ where: { id: linkId } });
  
  if (!link || !link.projectId) {
    throw new WebhookError("Invalid link or project", 200);
  }

  return link;
};

export const getWorkspaceIdFromLink = async (link: Link) => {
  if (!link || !link.projectId) {
    throw new WebhookError("Invalid link or project", 200);
  }

  return link.projectId;
};

export const findWorkspace = async (workspaceId: string) => {
  const workspace = await prisma.project.findUnique({
    where: { id: workspaceId },
    select: { id: true },
  });

  if (!workspace) {
    return "Workspace not found, skipping...";
  }

  return workspace;
};