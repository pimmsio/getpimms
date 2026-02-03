"use client";

import { BillingCurrency } from "@dub/utils";
import { useCallback, useState } from "react";
import useSWR from "swr";

const CURRENCY_COOKIE = "pimms_currency";
const CURRENCY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function getCurrencyFromCookie(): BillingCurrency | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CURRENCY_COOKIE}=([^;]*)`),
  );
  const val = match?.[1]?.toUpperCase();
  return val === "EUR" || val === "USD" ? val : null;
}

function setCurrencyCookie(currency: BillingCurrency) {
  if (typeof document === "undefined") return;
  document.cookie = `${CURRENCY_COOKIE}=${currency}; path=/; max-age=${CURRENCY_COOKIE_MAX_AGE}; SameSite=Lax`;
}

async function fetchGeoCurrency(): Promise<{ currency: BillingCurrency }> {
  const res = await fetch("/api/geo");
  if (!res.ok) throw new Error("Failed to fetch geo");
  const data = await res.json();
  return { currency: data.currency === "USD" ? "USD" : "EUR" };
}

/**
 * For anonymous/public pricing pages: infers currency from IP (geo API),
 * with cookie override. Use when there is no workspace (e.g. marketing /pricing).
 */
export function usePricingCurrency() {
  const [override, setOverride] = useState<BillingCurrency | null>(() =>
    typeof document !== "undefined" ? getCurrencyFromCookie() : null,
  );
  const { data, isLoading } = useSWR(
    "/api/geo",
    fetchGeoCurrency,
    { revalidateOnFocus: false },
  );

  const geoCurrency: BillingCurrency = data?.currency === "USD" ? "USD" : "EUR";
  const currency: BillingCurrency = override ?? geoCurrency;

  const setCurrency = useCallback((next: BillingCurrency) => {
    setOverride(next);
    setCurrencyCookie(next);
  }, []);

  return {
    currency,
    setCurrency,
    isLoading: !override && isLoading,
  };
}
