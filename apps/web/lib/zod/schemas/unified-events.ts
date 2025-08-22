import z from "@/lib/zod";
import { normalizePaymentProcessor } from "../../sales/payment-processor";
import { clickEventSchema } from "./clicks";
import { CustomerSchema } from "./customers";
import { commonDeprecatedEventFields } from "./deprecated";
import { linkEventSchema } from "./links";

// Unified event schema for both leads and sales
export const unifiedEventResponseSchema = z
  .object({
    event: z.enum(["lead", "sale"]),
    timestamp: z.coerce.string(),
    eventId: z.string(),
    eventName: z.string(),
    // nested objects
    link: linkEventSchema,
    click: clickEventSchema,
    customer: CustomerSchema,
    // Unified sale info - always present but amount is 0 for leads
    sale: z.object({
      amount: z.number(), // 0 for leads, actual amount for sales
      invoiceId: z.string().nullable().optional(),
      paymentProcessor: z
        .string()
        .transform((val) => normalizePaymentProcessor(val))
        .nullable()
        .optional(),
    }),
    saleAmount: z.number(), // Top-level for compatibility
    // Optional fields for backwards compatibility
    invoice_id: z.string().optional(),
    payment_processor: z.string().optional(),
  })
  .merge(commonDeprecatedEventFields)
  .openapi({ ref: "UnifiedEvent" });
