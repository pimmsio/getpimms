"use client";

import { createContext, useContext } from "react";

type UtmSectionContextType = {
  expandUtmSection: () => void;
};

const UtmSectionContext = createContext<UtmSectionContextType | null>(null);

export const UtmSectionProvider = UtmSectionContext.Provider;

export function useUtmSectionContext() {
  const context = useContext(UtmSectionContext);
  if (!context) {
    throw new Error("useUtmSectionContext must be used within UtmSectionProvider");
  }
  return context;
}

export function useUtmSectionContextOptional() {
  return useContext(UtmSectionContext);
}

