"use client";

import { cn } from "@dub/utils";

export type ChoiceOption<T extends string> = {
  value: T;
  label: string;
};

export function ChoiceButtons<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
  ariaLabel,
}: {
  options: Array<ChoiceOption<T>>;
  value: T | null;
  onChange: (next: T) => void;
  columns?: 1 | 2 | 3;
  ariaLabel?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-2",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-3",
      )}
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-xl border px-4 py-3 text-left text-sm font-semibold transition",
              "focus:outline-none focus:ring-2 focus:ring-neutral-300",
              selected
                ? "border-neutral-900 bg-neutral-50 text-neutral-900"
                : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function MultiChoiceButtons<T extends string>({
  options,
  values,
  onToggle,
  columns = 2,
  ariaLabel,
}: {
  options: Array<ChoiceOption<T>>;
  values: T[];
  onToggle: (value: T) => void;
  columns?: 1 | 2 | 3;
  ariaLabel?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-2",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-3",
      )}
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const selected = values.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            className={cn(
              "rounded-xl border px-4 py-3 text-left text-sm font-semibold transition",
              "focus:outline-none focus:ring-2 focus:ring-neutral-300",
              selected
                ? "border-neutral-900 bg-neutral-50 text-neutral-900"
                : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}


