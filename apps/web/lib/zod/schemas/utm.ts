import z from "@/lib/zod";

// Normalization is done client-side using workspace convention rules.
// Server schemas only trim and validate length.
export const createUTMTemplateBodySchema = z.object({
  name: z.string().trim().min(1, "UTM name is required").max(50),
  utm_source: z
    .string()
    .trim()
    .max(190)
    .nullish()
    .describe("The UTM source of the short link."),
  utm_medium: z
    .string()
    .trim()
    .max(190)
    .nullish()
    .describe("The UTM medium of the short link."),
  utm_campaign: z
    .string()
    .trim()
    .max(190)
    .nullish()
    .describe("The UTM campaign of the short link."),
  utm_term: z
    .string()
    .trim()
    .max(190)
    .nullish()
    .describe("The UTM term of the short link."),
  utm_content: z
    .string()
    .trim()
    .max(190)
    .nullish()
    .describe("The UTM content of the short link."),
  ref: z
    .string()
    .trim()
    .max(190)
    .nullish()
    .describe("The ref of the short link."),
});

export const updateUTMTemplateBodySchema = createUTMTemplateBodySchema;

export const getUtmTemplatesQuerySchema = z.object({
  sortBy: z
    .enum(["name", "createdAt", "updatedAt"])
    .optional()
    .default("name")
    .describe("The field to sort the templates by."),
  sortOrder: z
    .enum(["asc", "desc"])
    .optional()
    .default("asc")
    .describe("The order to sort the templates by."),
});

export const utmTagsSchema = z.object({
  utm_source: z
    .string()
    .trim()
    .max(190)
    .nullish()
    .describe("The UTM source of the short link."),
  utm_medium: z
    .string()
    .trim()
    .max(190)
    .nullish()
    .describe("The UTM medium of the short link."),
  utm_campaign: z
    .string()
    .trim()
    .max(190)
    .nullish()
    .describe("The UTM campaign of the short link."),
  utm_term: z
    .string()
    .trim()
    .max(190)
    .nullish()
    .describe("The UTM term of the short link."),
  utm_content: z
    .string()
    .trim()
    .max(190)
    .nullish()
    .describe("The UTM content of the short link."),
});

export const UTM_TAGS_PLURAL_LIST = [
  "utm_sources",
  "utm_mediums",
  "utm_campaigns",
  "utm_terms",
  "utm_contents",
];

export type UTM_TAGS_PLURAL =
  | "utm_sources"
  | "utm_mediums"
  | "utm_campaigns"
  | "utm_terms"
  | "utm_contents";
