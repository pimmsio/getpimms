export const linksViewModes = ["cards", "rows"] as const;

export type LinksViewMode = (typeof linksViewModes)[number];

export const linksGroupByOptions = [
  {
    display: "None",
    slug: null,
  },
  {
    display: "Destination URL",
    slug: "url",
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
  {
    display: "UTM Term",
    slug: "utm_term",
  },
  {
    display: "UTM Content",
    slug: "utm_content",
  },
] as const;

export type LinksGroupBySlug = (typeof linksGroupByOptions)[number]["slug"];

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
] as const;

export const linksDisplayProperties: {
  id: LinksDisplayProperty;
  label: string;
}[] = [
  { id: "link", label: "Short link" },
  { id: "url", label: "Destination URL" },
  { id: "title", label: "Meta title" },
  { id: "description", label: "Meta description" },
  { id: "comments", label: "Title" },
  { id: "createdAt", label: "Date" },
];

export type LinksDisplayProperty = (typeof linksDisplayPropertyIds)[number];

export const defaultLinksDisplayProperties: LinksDisplayProperty[] = [
  "icon",
  "link",  // Line 1, position 1: Short link
  "comments",  // Line 1, position 2: Title
  "url",  // Line 2, position 1: Destination URL
  "createdAt",  // Line 2, position 2: Date
  "title",
  "description",
];
