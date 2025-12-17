"use client";

type LeadRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  hotScore?: number | null;
  lastEventAt?: string | Date | null;
  link?: {
    domain: string;
    key: string;
    url: string;
    shortLink?: string | null;
  } | null;
};

// Helper function to normalize text for CSV/TSV output
export const normalizeTextForCSV = (text: string): string => {
  return text
    .replace(/\r\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const asIso = (d: string | Date | null | undefined) =>
  d ? new Date(d).toISOString() : "";

export function leadsToTSV(leads: LeadRow[]) {
  const headers = [
    "Name",
    "Email",
    "Score",
    "Last activity",
    "Triggered link",
    "Destination URL",
  ];

  const rows = leads.map((l) => {
    const link = l.link;
    const triggered = link ? `${link.domain}${link.key === "_root" ? "" : `/${link.key}`}` : "";
    return [
      normalizeTextForCSV(l.name || ""),
      normalizeTextForCSV(l.email || ""),
      String(l.hotScore ?? 0),
      asIso(l.lastEventAt ?? null),
      triggered,
      link?.url || "",
    ].join("\t");
  });

  return [headers.join("\t"), ...rows].join("\n");
}

export function leadsToCSV(leads: LeadRow[]) {
  const headers = [
    "Name",
    "Email",
    "Score",
    "Last activity",
    "Triggered link",
    "Destination URL",
  ];

  const rows = leads.map((l) => {
    const link = l.link;
    const triggered = link ? `${link.domain}${link.key === "_root" ? "" : `/${link.key}`}` : "";
    return [
      l.name || "",
      l.email || "",
      String(l.hotScore ?? 0),
      asIso(l.lastEventAt ?? null),
      triggered,
      link?.url || "",
    ]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export async function copyLeadsForGoogleSheets(leads: LeadRow[]) {
  const tsv = leadsToTSV(leads);
  await navigator.clipboard.writeText(tsv);
  return true;
}

export function downloadLeadsAsCSV(leads: LeadRow[]) {
  const csv = leadsToCSV(leads);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `hot-leads-${Date.now()}.csv`;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

