"use client";

import { cn } from "@dub/utils";
import { Check, Copy } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

export function CopyField({
  label,
  value,
  copyValue,
  disabled,
}: {
  label: string;
  value: string;
  copyValue?: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);
  const textToCopy = copyValue ?? value;

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const copy = async () => {
    if (disabled) return;
    if (!textToCopy) return;
    setCopied(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setCopied(false);
      timerRef.current = null;
    }, 2000);

    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      // ignore (we still show feedback)
    }
  };

  return (
    <div>
      <div className="text-xs font-medium text-neutral-700">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <input
          value={value}
          readOnly
          onClick={copy}
          className={cn(
            "h-10 w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-900",
            !disabled && textToCopy ? "cursor-pointer" : "cursor-default opacity-60",
          )}
        />
        <button
          type="button"
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
            (disabled || !textToCopy) && "cursor-not-allowed opacity-60 hover:bg-white",
          )}
          onClick={copy}
          disabled={disabled || !textToCopy}
          aria-label={copied ? "Copied" : "Copy"}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
      </div>
    </div>
  );
}

