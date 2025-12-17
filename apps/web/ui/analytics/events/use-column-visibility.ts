import { useLocalStorage } from "@dub/ui";
import { VisibilityState } from "@tanstack/react-table";
import { useEffect, useMemo } from "react";

// Single unified Conversions view (leads + sales)
export const conversionColumns = {
  all: [
    "hotScore",
    "customer",
    "lastEvent",
    "triggeredLink",
    "touchpoints",
    "customerCountry",
    "referer",
    "created",
    "saleAmount",
    "timestamp",
    "menu",
  ],
  defaultVisible: [
    "hotScore",
    "customer",
    "lastEvent",
    "triggeredLink",
    "touchpoints",
    "customerCountry",
    "referer",
    "created",
    "saleAmount",
    "menu",
  ],
} as const;

const getDefaultVisibility = () =>
  Object.fromEntries(
    conversionColumns.all.map((id) => [
      id,
      (conversionColumns.defaultVisible as readonly string[]).includes(id),
    ]),
  ) as VisibilityState;

export function useColumnVisibility() {
  const defaultVisibility = getDefaultVisibility();
  const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>(
    "events-table-columns",
    defaultVisibility,
  );

  // Migrate: ensure new columns are visible by default and remove stale ones
  const migratedVisibility = useMemo(() => {
    const allColumnIds = conversionColumns.all as readonly string[];
    const defaultVisibleIds = conversionColumns.defaultVisible as readonly string[];
    const newColumns = ['customerCountry'];
    
    // Start with current columnVisibility, but force new columns to be visible
    const result: VisibilityState = { ...columnVisibility };
    
    // Remove stale columns that no longer exist
    for (const columnId in result) {
      if (!allColumnIds.includes(columnId)) {
        delete result[columnId];
      }
    }
    
    // ALWAYS force new columns to be visible (override any localStorage value)
    for (const columnId of newColumns) {
      result[columnId] = true;
    }
    
    // Ensure all default visible columns are in the result
    for (const columnId of defaultVisibleIds) {
      if (!(columnId in result)) {
        result[columnId] = true;
      }
    }
    
    // Ensure all columns in the schema are present (set to false if not in defaultVisible)
    for (const columnId of allColumnIds) {
      if (!(columnId in result)) {
        result[columnId] = defaultVisibleIds.includes(columnId);
      }
    }
    
    return result;
  }, [columnVisibility]);

  // Always update localStorage on mount to force migration
  useEffect(() => {
    const newColumns = ['customerCountry'];
    const allColumnIds = conversionColumns.all as readonly string[];
    
    // Check if migration is needed
    let needsUpdate = false;
    
    // Check if new columns need to be forced visible
    for (const columnId of newColumns) {
      if (columnVisibility[columnId] !== true) {
        needsUpdate = true;
        break;
      }
    }
    
    // Check for stale columns
    for (const columnId in columnVisibility) {
      if (!allColumnIds.includes(columnId)) {
        needsUpdate = true;
        break;
      }
    }
    
    // Check if migrated visibility differs from current
    for (const key in migratedVisibility) {
      if (migratedVisibility[key] !== columnVisibility[key]) {
        needsUpdate = true;
        break;
      }
    }
    for (const key in columnVisibility) {
      if (migratedVisibility[key] !== columnVisibility[key]) {
        needsUpdate = true;
        break;
      }
    }
    
    if (needsUpdate) {
      setColumnVisibility(migratedVisibility);
    }
  }, []); // Run once on mount

  return {
    columnVisibility: migratedVisibility,
    setColumnVisibility: (visibility: VisibilityState) => setColumnVisibility(visibility),
  };
}
