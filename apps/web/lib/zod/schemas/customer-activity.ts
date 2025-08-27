import { z } from "zod";
import { clickEventResponseSchema } from "./clicks";
import { leadEventResponseSchema } from "./leads";
import { LinkSchema } from "./links";
import { saleEventResponseSchema } from "./sales";

export const customerActivityEventSchema = z.discriminatedUnion("event", [
  clickEventResponseSchema,
  leadEventResponseSchema.omit({ customer: true }),
  saleEventResponseSchema.omit({ customer: true }),
]);

export const customerActivityResponseSchema = z.object({
  ltv: z.number(),
  timeToLead: z.number().nullable(),
  timeToSale: z.number().nullable(),
  events: z.array(customerActivityEventSchema),
  link: LinkSchema.pick({
    id: true,
    domain: true,
    key: true,
    shortLink: true,
  }).nullish(),
  // New hotness fields for surfacing hot periods and reasons
  hot: z
    .object({
      score: z.number().min(0).max(100),
      tier: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
      isHot: z.boolean(),
      reasons: z.array(z.string()),
      hotWindows: z.array(
        z.object({
          start: z.string(),
          end: z.string(),
          score: z.number().min(0).max(100),
          reasons: z.array(z.string()),
        }),
      ),
      lastHotScoreAt: z.date().nullish(),
    })
    .optional(),
});
