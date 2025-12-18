import z from "@/lib/zod";
import { LinkSchema } from "./links";
import { booleanQuerySchema, getPaginationQuerySchema } from "./misc";

export const getCustomersQuerySchema = z.object({
  email: z
    .string()
    .optional()
    .describe(
      "A case-sensitive filter on the list based on the customer's `email` field. The value must be a string.",
    ),
  externalId: z
    .string()
    .optional()
    .describe(
      "A case-sensitive filter on the list based on the customer's `externalId` field. The value must be a string.",
    ),
  includeExpandedFields: booleanQuerySchema
    .optional()
    .describe(
      "Whether to include expanded fields on the customer (`link`).",
    ),
});

export const createCustomerBodySchema = z.object({
  email: z
    .string()
    .email()
    .nullish()
    .describe("Email of the customer in the client's app."),
  name: z
    .string()
    .nullish()
    .describe(
      "Name of the customer in the client's app. If not provided, a random name will be generated.",
    ),
  avatar: z
    .string()
    .url()
    .nullish()
    .describe("Avatar URL of the customer in the client's app."),
  externalId: z
    .string()
    .describe("Unique identifier for the customer in the client's app."),
  anonymousId: z
    .string()
    .nullish()
    .describe("Anonymous ID for the customer for history tracking."),
  totalClicks: z
    .number()
    .optional()
    .default(0)
    .describe("Total number of clicks for this customer."),
  hotScore: z
    .number()
    .optional()
    .default(0)
    .describe("Lead hotness score (0-100) for this customer."),
  lastHotScoreAt: z
    .date()
    .nullish()
    .describe("When the hot score was last calculated."),
  lastEventAt: z
    .date()
    .nullish()
    .describe("Last event timestamp (click/lead/sale)."),
});

export const updateCustomerBodySchema = createCustomerBodySchema.partial();

export const CustomerSchema = z.object({
  id: z
    .string()
    .describe(
      "The unique ID of the customer. You may use either the customer's `id` on PiMMs (obtained via `/customers` endpoint) or their `externalId` (unique ID within your system, prefixed with `ext_`, e.g. `ext_123`).",
    ),
  externalId: z
    .string()
    .describe("Unique identifier for the customer in the client's app."),
  name: z.string().describe("Name of the customer."),
  email: z.string().nullish().describe("Email of the customer."),
  avatar: z.string().nullish().describe("Avatar URL of the customer."),
  country: z.string().nullish().describe("Country of the customer."),
  anonymousId: z.string().nullish().describe("Anonymous ID for the customer for history tracking."),
  totalClicks: z.number().optional().default(0).describe("Total number of clicks for this customer."),
  hotScore: z.number().optional().default(0).describe("Lead hotness score (0-100) for this customer."),
  lastHotScoreAt: z.date().nullish().describe("When the hot score was last calculated."),
  lastEventAt: z.date().nullish().describe("Last event timestamp (click/lead/sale)."),
  createdAt: z.date().describe("The date the customer was created."),
  conversions: z.number().optional().describe("Number of conversion events (leads + sales) for this customer in the current query."),
});

// An extended schema that includes the customer's link.
export const CustomerEnrichedSchema = CustomerSchema.extend({
  link: LinkSchema.pick({
    id: true,
    domain: true,
    key: true,
    shortLink: true,
  }).nullish(),
});

export const CUSTOMERS_MAX_PAGE_SIZE = 100;

export const customersQuerySchema = z
  .object({
    search: z.string().optional(),
    ids: z
      .union([z.string(), z.array(z.string())])
      .transform((v) => (Array.isArray(v) ? v : v.split(",")))
      .optional()
      .describe("IDs of customers to filter by."),
  })
  .merge(getPaginationQuerySchema({ pageSize: CUSTOMERS_MAX_PAGE_SIZE }));
