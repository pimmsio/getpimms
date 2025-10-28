"use client";

import { DomainProps } from "@/lib/types";
import { cn } from "@dub/utils";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

export function BulkDomainSelector({
  domains,
  selectedDomain,
  onChange,
}: {
  domains: DomainProps[];
  selectedDomain: string;
  onChange: (domain: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selected = domains.find((d) => d.slug === selectedDomain);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-900">
        Domain
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-full items-center justify-between rounded-lg border border-neutral-300 bg-white px-3 text-sm hover:bg-neutral-50"
        >
          <span className="font-mono">{selected?.slug || "Select domain"}</span>
          <ChevronDown className="size-4 text-neutral-400" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full z-20 mt-1 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
              {domains.map((domain) => (
                <button
                  key={domain.slug}
                  type="button"
                  onClick={() => {
                    onChange(domain.slug);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-50",
                    selectedDomain === domain.slug && "bg-neutral-50",
                  )}
                >
                  <span className="font-mono">{domain.slug}</span>
                  {selectedDomain === domain.slug && (
                    <Check className="size-4 text-neutral-900" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <p className="text-xs text-neutral-500">
        All links will be created under this domain
      </p>
    </div>
  );
}

