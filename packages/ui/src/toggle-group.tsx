"use client";

import { cn } from "@dub/utils";
import { LayoutGroup, motion } from "framer-motion";
import { useId } from "react";

interface ToggleOption {
  value: string;
  label: string | React.ReactNode;
  badge?: React.ReactNode;
}

export function ToggleGroup({
  options,
  selected,
  selectAction,
  className,
  optionClassName,
  indicatorClassName,
  style,
}: {
  options: ToggleOption[];
  selected: string | null;
  selectAction: (option: string) => void;
  className?: string;
  optionClassName?: string;
  indicatorClassName?: string;
  style?: React.CSSProperties;
}) {
  const layoutGroupId = useId();

  return (
    <LayoutGroup id={layoutGroupId}>
      <motion.div
        layout
        className={cn(
          // Minimal segmented control (match dashboard controls)
          "relative z-0 inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-100/60 p-1",
          className,
        )}
        style={style}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            data-selected={option.value === selected}
            className={cn(
              "relative z-10 flex h-7 items-center gap-2 rounded-md px-2.5 text-[11px] font-medium text-neutral-700 transition-colors",
              {
                "z-[11] hover:bg-white/70 hover:text-neutral-900":
                  option.value !== selected,
              },
              optionClassName,
            )}
            onClick={() => selectAction(option.value)}
          >
            {typeof option.label === "string" ? (
              <p>{option.label}</p>
            ) : (
              option.label
            )}
            {option.badge}
            {option.value === selected && (
              <motion.div
                layoutId={layoutGroupId}
                className={cn(
                  "absolute left-0 top-0 -z-[1] h-full w-full rounded-md border border-neutral-200 bg-white shadow-sm",
                  indicatorClassName,
                )}
                transition={{ duration: 0.25 }}
              />
            )}
          </button>
        ))}
      </motion.div>
    </LayoutGroup>
  );
}
