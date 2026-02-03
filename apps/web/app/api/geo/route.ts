import { USD_COUNTRY_CODES } from "@dub/utils";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export type GeoCurrency = "EUR" | "USD";

/**
 * Returns inferred currency from IP geolocation (Vercel headers).
 * Used for pricing page default when user has no workspace/cookie preference.
 */
export async function GET() {
  const headersList = await headers();
  const country = headersList.get("x-vercel-ip-country")?.toUpperCase() ?? null;

  const currency: GeoCurrency =
    country && USD_COUNTRY_CODES.includes(country) ? "USD" : "EUR";

  return NextResponse.json({
    currency,
    country: country ?? undefined,
  });
}
