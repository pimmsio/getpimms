import z from "@/lib/zod";
import { booleanQuerySchema, getPaginationQuerySchema } from "./misc";

export const UTM_PARAMETERS_MAX_PAGE_SIZE = 100;

// Base query schema for all UTM parameter types
const getUtmParameterQuerySchemaBase = z
  .object({
    sortBy: z
      .enum(["name", "createdAt"])
      .optional()
      .default("name")
      .describe("The field to sort the parameters by."),
    sortOrder: z
      .enum(["asc", "desc"])
      .optional()
      .default("asc")
      .describe("The order to sort the parameters by."),
    search: z
      .string()
      .optional()
      .describe("The search term to filter the parameters by."),
    ids: z
      .union([z.string(), z.array(z.string())])
      .transform((v) => (Array.isArray(v) ? v : v.split(",")))
      .optional()
      .describe("IDs of parameters to filter by."),
  })
  .merge(getPaginationQuerySchema({ pageSize: UTM_PARAMETERS_MAX_PAGE_SIZE }));

export const getUtmSourcesQuerySchema = getUtmParameterQuerySchemaBase;
export const getUtmMediumsQuerySchema = getUtmParameterQuerySchemaBase;
export const getUtmCampaignsQuerySchema = getUtmParameterQuerySchemaBase;
export const getUtmTermsQuerySchema = getUtmParameterQuerySchemaBase;
export const getUtmContentsQuerySchema = getUtmParameterQuerySchemaBase;

// Extended schemas for UI
export const getUtmSourcesQuerySchemaExtended = getUtmSourcesQuerySchema.merge(
  z.object({
    includeLinksCount: booleanQuerySchema.default("false"),
  }),
);

export const getUtmMediumsQuerySchemaExtended = getUtmMediumsQuerySchema.merge(
  z.object({
    includeLinksCount: booleanQuerySchema.default("false"),
  }),
);

export const getUtmCampaignsQuerySchemaExtended =
  getUtmCampaignsQuerySchema.merge(
    z.object({
      includeLinksCount: booleanQuerySchema.default("false"),
    }),
  );

export const getUtmTermsQuerySchemaExtended = getUtmTermsQuerySchema.merge(
  z.object({
    includeLinksCount: booleanQuerySchema.default("false"),
  }),
);

export const getUtmContentsQuerySchemaExtended = getUtmContentsQuerySchema.merge(
  z.object({
    includeLinksCount: booleanQuerySchema.default("false"),
  }),
);

// Count schemas
export const getUtmSourcesCountQuerySchema = getUtmSourcesQuerySchema.omit({
  ids: true,
  page: true,
  pageSize: true,
});

export const getUtmMediumsCountQuerySchema = getUtmMediumsQuerySchema.omit({
  ids: true,
  page: true,
  pageSize: true,
});

export const getUtmCampaignsCountQuerySchema = getUtmCampaignsQuerySchema.omit({
  ids: true,
  page: true,
  pageSize: true,
});

export const getUtmTermsCountQuerySchema = getUtmTermsQuerySchema.omit({
  ids: true,
  page: true,
  pageSize: true,
});

export const getUtmContentsCountQuerySchema = getUtmContentsQuerySchema.omit({
  ids: true,
  page: true,
  pageSize: true,
});

// Create/Update body schemas (normalization is done client-side using workspace conventions)
export const createUtmSourceBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(190)
    .describe("The UTM source value to create."),
});

export const createUtmMediumBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(190)
    .describe("The UTM medium value to create."),
});

export const createUtmCampaignBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(190)
    .describe("The UTM campaign value to create."),
});

export const createUtmTermBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(190)
    .describe("The UTM term value to create."),
});

export const createUtmContentBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(190)
    .describe("The UTM content value to create."),
});

// Update schemas
export const updateUtmSourceBodySchema = createUtmSourceBodySchema;
export const updateUtmMediumBodySchema = createUtmMediumBodySchema;
export const updateUtmCampaignBodySchema = createUtmCampaignBodySchema;
export const updateUtmTermBodySchema = createUtmTermBodySchema;
export const updateUtmContentBodySchema = createUtmContentBodySchema;

// Bulk create schema
export const bulkCreateUtmParametersBodySchema = z.object({
  type: z.enum(["source", "medium", "campaign", "term", "content"]),
  names: z
    .array(z.string().trim().min(1).max(190))
    .min(1)
    .max(100)
    .describe("The UTM parameter values to create in bulk."),
});

// Response schemas
export const UtmSourceSchema = z.object({
  id: z.string().describe("The unique ID of the UTM source."),
  name: z.string().describe("The name of the UTM source."),
});

export const UtmMediumSchema = z.object({
  id: z.string().describe("The unique ID of the UTM medium."),
  name: z.string().describe("The name of the UTM medium."),
});

export const UtmCampaignSchema = z.object({
  id: z.string().describe("The unique ID of the UTM campaign."),
  name: z.string().describe("The name of the UTM campaign."),
});

export const UtmTermSchema = z.object({
  id: z.string().describe("The unique ID of the UTM term."),
  name: z.string().describe("The name of the UTM term."),
});

export const UtmContentSchema = z.object({
  id: z.string().describe("The unique ID of the UTM content."),
  name: z.string().describe("The name of the UTM content."),
});

