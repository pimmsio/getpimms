import z from "@/lib/zod";

export const metaTagsSchema = z.object({
  title: z
    .string()
    .nullable()
    .describe("The meta title tag for the URL.")
    .openapi({
      example: "PIMMS | Deep links that boost your conversions on social media",
    }),
  description: z
    .string()
    .nullable()
    .describe("The meta description tag for the URL.")
    .openapi({
      example: "PIMMS is the open-source link management infrastructure ...",
    }),
  image: z
    .string()
    .nullable()
    .describe("The OpenGraph image for the URL.")
    .openapi({ example: "https://assets.pimms.io/thumbnail.jpg?v=3" }),
});
