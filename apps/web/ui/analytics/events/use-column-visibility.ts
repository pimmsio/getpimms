import { useLocalStorage } from "@dub/ui";
import { VisibilityState } from "@tanstack/react-table";

// Single unified Conversions view (leads + sales)
export const conversionColumns = {
  all: [
    "hotScore",
    "customer",
    "lastEvent",
    "triggeredLink",
    "saleAmount",
    "timestamp",
    "menu",
  ],
  defaultVisible: [
    "hotScore",
    "customer",
    "lastEvent",
    "triggeredLink",
    "saleAmount",
    "timestamp",
    "menu",
  ],
} as const;

const getDefaultVisibility = () =>
  Object.fromEntries(
    conversionColumns.all.map((id) => [id, conversionColumns.defaultVisible.includes(id)]),
  ) as VisibilityState;

export function useColumnVisibility() {
  const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>(
    "events-table-columns",
    getDefaultVisibility(),
  );

  return {
    columnVisibility,
    setColumnVisibility: (visibility: VisibilityState) => setColumnVisibility(visibility),
  };
}
