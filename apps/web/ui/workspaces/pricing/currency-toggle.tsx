"use client";

import { BillingCurrency, cn } from "@dub/utils";

export function CurrencyToggle({
  value,
  onChange,
  className,
}: {
  value: BillingCurrency;
  onChange: (currency: BillingCurrency) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5",
        className,
      )}
      role="group"
      aria-label="Select currency"
    >
      {(["EUR", "USD"] as const).map((currency) => (
        <button
          key={currency}
          type="button"
          onClick={() => onChange(currency)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === currency
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-600 hover:text-neutral-900",
          )}
        >
          {currency}
        </button>
      ))}
    </div>
  );
}
