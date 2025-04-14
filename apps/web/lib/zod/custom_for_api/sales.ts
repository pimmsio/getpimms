import z from "@/lib/zod";

export const trackSaleRequestSchema = z.object({
  externalId: z
    .string()
    .trim()
    .max(100)
    .default("") // Remove this after migrating users from customerId to externalId
    .describe(
      "This is the unique identifier for the customer in the client's app. This is used to track the customer's journey.",
    ),
  amount: z
    .number({ required_error: "amount is required" })
    .int()
    .min(0, "amount cannot be negative")
    .describe("The amount of the sale. Should be passed in cents."),
  paymentProcessor: z
    .enum(["stripe", "shopify", "paddle"])
    .describe("The payment processor via which the sale was made."),
  eventName: z
    .string()
    .max(50)
    .optional()
    .default("Purchase")
    .describe(
      "The name of the sale event. It can be used to track different types of event for example 'Purchase', 'Upgrade', 'Payment', etc.",
    )
    .openapi({ example: "Purchase" }),
  invoiceId: z
    .string()
    .nullish()
    .default(null)
    .describe("The invoice ID of the sale."),
  currency: z
    .string()
    .default("usd")
    .transform((val) => val.toLowerCase())
    .describe("The currency of the sale. Accepts ISO 4217 currency codes."),
  metadata: z
    .record(z.unknown())
    .nullish()
    .default(null)
    .describe("Additional metadata to be stored with the sale event."),
});

export const trackSaleResponseSchema = z.object({
  eventName: z.string(),
  customer: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string().nullable(),
      avatar: z.string().nullable(),
      externalId: z.string().nullable(),
    })
    .nullable(),
  sale: z
    .object({
      amount: z.number(),
      currency: z.string(),
      paymentProcessor: z.string(),
      invoiceId: z.string().nullable(),
      metadata: z.record(z.unknown()).nullable(),
    })
    .nullable(),
});