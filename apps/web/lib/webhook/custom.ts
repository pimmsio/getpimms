import { getClickEvent, tb } from "@/lib/tinybird";
import { prisma } from "@dub/prisma";
import { Link } from "@prisma/client";
import { fixSomeWorkspaceId, WebhookError } from "./utils";
import z from "../zod";

const normalize = (str: string) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

/** For tokenization: lowercased, accents removed, but separators preserved */
const toTokenizable = (str: string) =>
  str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const TOKEN_SEP = /[\s_\-/,]+|et|and|&/;
const FIRST_NAME_TOKENS = new Set(["prenom", "firstname", "first"]);
const LAST_NAME_TOKENS = new Set(["nom", "lastname", "surname", "last"]);

/**
 * Detects if a field key/label represents a compound name field (first + last name combined).
 * Token-based: splits by separators so "prenom" and "nom" are distinct (avoids "nom" inside "prenom").
 */
export function isCompoundNameField(fieldKey: string): boolean {
  const tokens = new Set(
    toTokenizable(fieldKey)
      .split(TOKEN_SEP)
      .map((t) => t.replace(/[^a-z0-9]/g, ""))
      .filter(Boolean),
  );
  const hasFirst = [...FIRST_NAME_TOKENS].some((t) => tokens.has(t));
  const hasLast = [...LAST_NAME_TOKENS].some((t) => tokens.has(t));
  return hasFirst && hasLast;
}

/** Word boundary: key must be preceded/followed by non-alphanumeric or start/end */
const wordBoundaryMatch = (fieldKey: string, normKey: string) =>
  fieldKey === normKey ||
  new RegExp(`(^|[^a-z0-9])${normKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9])`).test(
    fieldKey,
  );

export function getFirstAvailableField(
  data: Record<string, any>,
  keys: string[],
  matchPrefix: boolean = false,
  excludeCompoundNameFields: boolean = false,
): string | null {
  const normalizedEntries: Array<[string, { key: string; value: any }]> =
    Object.entries(data).map(([key, value]) => [
      normalize(key),
      { key, value },
    ]);

  for (const key of keys) {
    const normKey = normalize(key);

    for (const [fieldKey, entry] of normalizedEntries) {
      const { key: originalKey, value } = entry;
      if (excludeCompoundNameFields && isCompoundNameField(originalKey)) {
        continue;
      }
      const isMatch = matchPrefix
        ? wordBoundaryMatch(fieldKey, normKey)
        : fieldKey === normKey;

      if (isMatch && value) return value;
    }
  }

  return null;
}

/**
 * Converts an array of field objects with label/value to a flat object
 * Useful for webhooks that send fields as arrays (e.g., Tally)
 * Uses both label and key (slug) when available so compound fields are findable via either
 */
export function fieldsArrayToMap(
  fields: Array<{ label?: string; key?: string; value?: any; [key: string]: any }>,
): Record<string, any> {
  const fieldsMap: Record<string, any> = {};
  for (const field of fields) {
    if (field.value === undefined || field.value === null) continue;
    if (field.label) {
      fieldsMap[field.label] = field.value;
    }
    if (field.key) {
      fieldsMap[field.key] = field.value;
    }
  }
  return fieldsMap;
}

/**
 * Extracts common user fields (email, name, firstname, lastname) from data
 * Detects compound name fields (e.g. "Prénom et nom") and uses them as fullName only
 */
export function extractUserFields(
  data: Record<string, any>,
): {
  email: string | null;
  name: string | null;
  firstname: string | null;
  lastname: string | null;
  fullname: string | null;
} {
  const email = getFirstAvailableField(data, ["email"], true);

  // Priority 1: explicit compound field detection (covers slugs, atypical keys)
  let fullName: string | null = null;
  for (const [key, value] of Object.entries(data)) {
    if (value && isCompoundNameField(key)) {
      fullName = String(value).trim();
      break;
    }
  }

  // Exclude compound fields from first/last to avoid double attribution
  const firstName = getFirstAvailableField(
    data,
    ["firstname", "prenom"],
    true,
    true,
  );
  const lastName = getFirstAvailableField(
    data,
    ["lastname", "surname", "nom"],
    true,
    true,
  );

  // Fallback: fullName from standard keys if no compound found
  // Exclude "nom" alone — it typically means last name, not full name
  if (!fullName) {
    fullName = getFirstAvailableField(
      data,
      ["fullname", "name", "nomcomplet"],
      true,
      false,
    );
  }

  const name =
    fullName ||
    (firstName && lastName
      ? `${firstName} ${lastName}`
      : firstName || lastName || null);

  return {
    email,
    name,
    firstname: firstName,
    lastname: lastName,
    fullname: fullName,
  };
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