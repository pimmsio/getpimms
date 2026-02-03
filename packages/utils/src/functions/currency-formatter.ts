export const currencyFormatter = (
  value: number,
  options?: Intl.NumberFormatOptions,
) => {
  const { currency = "EUR", ...rest } = options ?? {};
  const currencyCode = (currency ?? "EUR").toUpperCase();
  return Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "narrowSymbol", // Use symbol: € for EUR, $ for USD
    maximumFractionDigits: 0,
    ...rest,
  }).format(value);
};
