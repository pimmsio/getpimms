export const currencyFormatter = (
  value: number,
  options?: Intl.NumberFormatOptions,
) =>
  Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
