export const ALLOWED_PAYMENT_PROCESSORS = [
  "stripe",
  "shopify",
  "polar",
  "paddle",
  "paypal",
  "custom",
] as const;

export type AllowedPaymentProcessor = (typeof ALLOWED_PAYMENT_PROCESSORS)[number];

export function normalizePaymentProcessor(value: string | null | undefined): AllowedPaymentProcessor {
  const v = (value || "").toLowerCase();
  return (ALLOWED_PAYMENT_PROCESSORS as readonly string[]).includes(v)
    ? (v as AllowedPaymentProcessor)
    : "custom";
}


