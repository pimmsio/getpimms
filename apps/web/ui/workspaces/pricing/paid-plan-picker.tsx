"use client";

import { Combobox } from "@dub/ui";
import { cn } from "@dub/utils";
import { ChevronsUpDown } from "lucide-react";
import { useMemo } from "react";

export type PaidPlanId = "pro" | "business";

export function PaidPlanPicker({
  value,
  onChange,
  className,
}: {
  value: PaidPlanId;
  onChange: (value: PaidPlanId) => void;
  className?: string;
}) {
  const options = useMemo(
    () => [
      { value: "pro" as const, label: "Pro" },
      { value: "business" as const, label: "Business" },
    ],
    [],
  );

  const selected = useMemo(() => {
    const opt = options.find((o) => o.value === value);
    return opt ? { value: opt.value, label: opt.label } : null;
  }, [options, value]);

  return (
    <Combobox
      selected={selected}
      setSelected={(option) => {
        if (!option) return;
        onChange(option.value as PaidPlanId);
      }}
      options={options}
      caret={<ChevronsUpDown className="ml-2 size-4 shrink-0 text-neutral-400" />}
      searchPlaceholder="Search plans..."
      matchTriggerWidth
      buttonProps={{
        className: cn("app-btn-secondary w-full justify-between", className),
        textWrapperClassName:
          "min-w-0 truncate text-left text-xl font-semibold leading-7 text-neutral-900 md:text-2xl",
      }}
      optionClassName="md:min-w-[250px]"
    >
      {selected ? selected.label : "Choose a plan"}
    </Combobox>
  );
}


