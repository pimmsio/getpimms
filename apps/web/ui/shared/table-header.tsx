import React from "react";

export function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
      {children}
    </span>
  );
}
