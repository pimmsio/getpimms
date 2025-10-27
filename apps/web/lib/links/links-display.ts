export const linksViewModes = ["cards", "rows"] as const;

export type LinksViewMode = (typeof linksViewModes)[number];

export const linksSortOptions = [
  {
    display: "Date created",
    slug: "createdAt",
  },
  {
    display: "Total clicks",
    slug: "clicks",
  },
  {
    display: "Last clicked",
    slug: "lastClicked",
  },
  {
    display: "Total sales",
    slug: "saleAmount",
  },
  {
    display: "UTM Source",
    slug: "utm_source",
  },
  {
    display: "UTM Medium",
    slug: "utm_medium",
  },
  {
    display: "UTM Campaign",
    slug: "utm_campaign",
  },
] as const;

export type LinksSortSlug = (typeof linksSortOptions)[number]["slug"];

export const linksDisplayPropertyIds = [
  "icon",
  "link",
  "url",
  "title",
  "description",
  "comments",
  "createdAt",
  "user",
  "tags",
  "analytics",
  "utm_columns",
] as const;

export const linksDisplayProperties: {
  id: LinksDisplayProperty;
  label: string;
  switch?: LinksDisplayProperty;
  mobile?: boolean;
}[] = [
  { id: "link", label: "Short link", switch: "title" },
  { id: "url", label: "Destination URL", switch: "description" },
  { id: "title", label: "Title", switch: "link" },
  { id: "description", label: "Description", switch: "url" },
  { id: "createdAt", label: "Created Date", mobile: false },
  { id: "user", label: "Creator", mobile: false },
  { id: "tags", label: "Tags" },
  { id: "analytics", label: "Analytics" },
  { id: "utm_columns", label: "UTM Columns", mobile: false },
];

export type LinksDisplayProperty = (typeof linksDisplayPropertyIds)[number];

export const defaultLinksDisplayProperties: LinksDisplayProperty[] = [
  "icon",
  "link",
  "url",
  "createdAt",
  "user",
  "tags",
  "analytics",
  "utm_columns",
];
