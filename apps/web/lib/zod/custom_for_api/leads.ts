import z from "@/lib/zod";

export const trackLeadRequestSchema = z.object({
  clickId: z
    .string({ required_error: "clickId is required" })
    .trim()
    .min(1, "clickId is required")
    .describe("Unique identifier for the click event in PIMMS, typically retrieved from the 'pimms_id' browser cookie for accurate attribution."),
  eventName: z
    .string({ required_error: "eventName is required" })
    .trim()
    .min(1, "eventName is required")
    .max(50)
    .describe("Name of the specific lead or conversion event you want to track (e.g., 'Sign up', 'Free Trial Registration').")
    .openapi({ example: "Sign up" }),
  externalId: z
    .string()
    .trim()
    .max(100)
    .default("") // Remove this after migrating users from customerId to externalId
    .describe("A unique identifier from your internal system (such as user ID) to link customer journeys across platforms."),
  customerName: z
    .string()
    .max(100)
    .nullish()
    .default(null)
    .describe("Optional customer name, useful for personalized reporting and CRM integrations."),
  customerEmail: z
    .string()
    .email()
    .max(100)
    .nullish()
    .default(null)
    .describe("Customer email address to enhance CRM synchronization and facilitate personalized marketing efforts."),
  customerAvatar: z
    .string()
    .nullish()
    .default(null)
    .describe("URL to the customer's avatar image, used for richer user profiles in integrated CRM or analytics platforms."),
  metadata: z
    .record(z.unknown())
    .nullish()
    .default(null)
    .describe("Additional structured data or context about the lead event, aiding advanced segmentation and reporting."),
});

export const trackLeadResponseSchema = z.object({
  click: z.object({
    id: z.string().describe("The unique identifier of the recorded click event associated with this lead."),
  }),
  customer: z.object({
    name: z.string().nullable().describe("Customer name provided during the lead event."),
    email: z.string().nullable().describe("Customer email provided during the lead event."),
    avatar: z.string().nullable().describe("Customer avatar URL provided during the lead event."),
    externalId: z.string().nullable().describe("External ID from your internal database linking this lead to your own customer records."),
  }),
});

