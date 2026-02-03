"use client";

import { Badge } from "@dub/ui";
import { BillingCurrency, cn } from "@dub/utils";
import NumberFlow from "@number-flow/react";
import { ReactNode } from "react";

export function PricingOptionCard({
  title,
  price,
  periodLabel,
  currency = "EUR",
  helperTop,
  helperBottom,
  badge,
  cta,
  className,
}: {
  title: string;
  price: number;
  periodLabel: string;
  currency?: BillingCurrency;
  helperTop?: ReactNode;
  helperBottom?: ReactNode;
  badge?: string;
  cta: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm",
        "transition-shadow hover:shadow-md",
        className,
      )}
    >
      {badge ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="blue">{badge}</Badge>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <div className="text-base font-semibold text-neutral-900">{title}</div>

        <div className="flex flex-col gap-1">
          <div className="flex items-end gap-1">
            <NumberFlow
              value={price}
              className="text-3xl font-semibold tabular-nums text-neutral-900"
              format={{
                style: "currency",
                currency,
                maximumFractionDigits: 0,
                ...(currency === "USD" && {
                  currencyDisplay: "narrowSymbol" as const,
                }),
              }}
            />
            <div className="pb-1 text-base font-medium text-neutral-500">
              {periodLabel}
            </div>
          </div>

          {helperTop ? (
            <div className="text-sm text-neutral-500">{helperTop}</div>
          ) : null}
        </div>
      </div>

      <div className="mt-auto pt-4">{cta}</div>

      {helperBottom ? (
        <div className="mt-3 text-sm text-neutral-500">{helperBottom}</div>
      ) : null}
    </div>
  );
}


