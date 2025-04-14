import z from "@/lib/zod";
import { parseUrlSchema, parseUrlSchemaAllowEmpty } from "../schemas/utils";
import { TagSchema } from "../schemas/tags";

export const createLinkBodySchema = z.object({
  url: parseUrlSchemaAllowEmpty().describe("Destination URL the deep link redirects to. Supports standard webpages and in-app routing for mobile apps.").openapi({ example: "https://pimms.io" }),
  domain: z.string().max(190).optional().describe("Custom domain for your branded deep link. Defaults to the workspace’s primary domain or 'pim.ms'."),
  key: z.string().max(190).optional().describe("Custom slug for the short URL. If omitted, an automatic 7-character key is generated."),
  externalId: z.string().min(1).max(255).transform((v) => (v?.startsWith("ext_") ? v.slice(4) : v)).nullish().describe("External identifier for syncing link data with your internal CRM or analytics tools. Passed in query parameters prefixed by 'ext_'.").openapi({ example: "123456" }),
  prefix: z.string().optional().describe("Custom URL path prefix for grouping auto-generated slugs (e.g., '/promo/' resulting in '/promo/abc123'). Ignored if 'key' is specified."),
  trackConversion: z.boolean().optional().describe("Enable detailed conversion tracking to attribute actions like signups or purchases directly to this link."),
  archived: z.boolean().optional().describe("Archive the link to hide it from primary analytics while keeping it active for redirects."),
  tagIds: z.union([z.string(), z.array(z.string())]).transform((v) => (Array.isArray(v) ? v : v.split(","))).optional().describe("List of existing tag IDs to categorize and filter links by campaigns, audiences, or purposes.").openapi({ example: ["clux0rgak00011..."] }),
  tagNames: z.union([z.string(), z.array(z.string())]).transform((v) => (Array.isArray(v) ? v : v.split(","))).optional().describe("New or existing tag names to assign for improved readability and organization."),
  comments: z.string().nullish().describe("Internal notes for team members about link context, purpose, or specific campaign details."),
  expiresAt: z.string().nullish().describe("ISO 8601 timestamp when the link should stop redirecting users."),
  expiredUrl: parseUrlSchema.nullish().describe("Fallback destination URL after link expiration, preventing broken user experiences."),
  title: z.string().nullish().describe("Custom Open Graph (OG) title to optimize social media sharing and improve link previews."),
  description: z.string().nullish().describe("Custom Open Graph description for better engagement when shared on social platforms."),
  image: z.string().nullish().describe("URL for a custom OG image to enhance visual appeal and click-through rates on social media."),
  video: z.string().nullish().describe("Custom video URL for rich media previews via Open Graph when sharing links."),
  ios: parseUrlSchema.nullish().describe("The iOS destination URL for the short link for iOS device targeting."),
  android: parseUrlSchema.nullish().describe("The Android destination URL for the short link for Android device targeting."),
  doIndex: z.boolean().optional().describe("Allow search engine indexing of the deep link. Defaults to false for privacy."),
  utm_source: z.string().nullish().describe("UTM source parameter for tracking the origin of traffic (e.g., 'linkedin', 'facebook', 'newsletter')."),
  utm_medium: z.string().nullish().describe("UTM medium parameter identifying traffic medium such as 'post', 'email', 'social', or 'cpc'."),
  utm_campaign: z.string().nullish().describe("UTM campaign parameter for tracking specific marketing initiatives or promotions."),
  utm_term: z.string().nullish().describe("UTM term parameter for keyword analysis, often used in paid search campaigns."),
  utm_content: z.string().nullish().describe("UTM content parameter distinguishing different content variations or link placements within a campaign."),
  ref: z.string().nullish().describe("Custom referral parameter appended as '?ref=' for downstream attribution and analysis."),
  webhookIds: z.array(z.string()).nullish().describe("Webhook IDs to trigger real-time notifications upon link clicks, ideal for integrating with analytics or marketing automation tools.")
});

export const updateLinkBodySchema = createLinkBodySchema.partial();

export const LinkSchema = z.object({
  id: z.string().describe("Unique internal identifier for the deep link."),
  domain: z.string().describe("Domain used for the deep link, e.g., 'yourbrand.com' or 'pim.ms'."),
  key: z.string().describe("Short URL slug appended after the domain, uniquely identifying the link."),
  url: z.string().url().describe("Complete original destination URL or mobile app route to which the link redirects users."),
  trackConversion: z.boolean().default(false).describe("Indicates whether this link actively tracks conversion events like leads or sales."),
  archived: z.boolean().default(false).describe("Determines if the link is archived, thus excluded from standard analytics views."),
  expiresAt: z.string().nullable().describe("Expiration timestamp in ISO 8601 format; after this, the link redirects to an expired URL or returns a 404."),
  title: z.string().nullable().describe("OG title for optimized social media link previews, fetched or set manually."),
  description: z.string().nullable().describe("OG description for enhanced social previews, either automatically fetched or manually customized."),
  image: z.string().nullable().describe("URL to the OG image displayed in social previews, improving shareability."),
  video: z.string().nullable().describe("Optional video URL used in rich media previews via Open Graph."),
  ios: z.string().nullable().describe("The iOS destination URL for the short link for iOS device targeting."),
  android: z.string().nullable().describe("The Android destination URL for the short link for Android device targeting."),
  tags: TagSchema.array().nullable().describe("Associated tags for organizing links by campaigns, audiences, or other criteria."),
  webhookIds: z.array(z.string()).describe("Webhooks triggered on each click event for real-time tracking and integration purposes."),
  comments: z.string().nullable().describe("Internal team notes describing the context, strategy, or use of the link."),
  shortLink: z.string().url().describe("Fully constructed deep link URL including domain and protocol."),
  qrCode: z.string().url().describe("Direct link to the dynamically generated QR code for offline or print campaigns."),
  utm_source: z.string().nullable().describe("Assigned UTM source parameter for tracking marketing origins."),
  utm_medium: z.string().nullable().describe("Assigned UTM medium for categorizing the traffic source.") ,
  utm_campaign: z.string().nullable().describe("Assigned UTM campaign for detailed campaign-level tracking."),
  utm_term: z.string().nullable().describe("Assigned UTM term parameter used for keyword or search tracking."),
  utm_content: z.string().nullable().describe("Assigned UTM content for distinguishing content variations within the same campaign."),
  userId: z.string().nullable().describe("Identifier of the user who created the link."),
  workspaceId: z.string().describe("Identifier of the workspace that the link belongs to."),
  clicks: z.number().default(0).describe("Total click count tracking user engagements."),
  lastClicked: z.string().nullable().describe("Timestamp of the most recent click event."),
  leads: z.number().default(0).describe("Total conversions attributed directly to this link."),
  createdAt: z.string().describe("Timestamp when the link was first created."),
  updatedAt: z.string().describe("Timestamp when the link was last modified.")
}).openapi({ title: "Link" });