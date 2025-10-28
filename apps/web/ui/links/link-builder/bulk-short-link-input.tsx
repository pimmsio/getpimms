"use client";

import { COLORS_LIST } from "@/ui/links/tag-badge";
import { cn, normalizeUtmValue } from "@dub/utils";
import { X } from "lucide-react";
import { useState } from "react";

export function BulkShortLinkInput({
  keys,
  onChange,
  colors,
}: {
  keys: string[];
  onChange: (keys: string[]) => void;
  colors: string[];
}) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKey();
    } else if (e.key === "Backspace" && inputValue === "" && keys.length > 0) {
      // Remove last key on backspace if input is empty
      onChange(keys.slice(0, -1));
    }
  };

  const addKey = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !keys.includes(trimmed)) {
      onChange([...keys, trimmed]);
      setInputValue("");
    }
  };

  const removeKey = (keyToRemove: string) => {
    onChange(keys.filter((k) => k !== keyToRemove));
  };

  const getColorForIndex = (index: number) => {
    if (colors[index]) {
      const colorConfig = COLORS_LIST.find((c) => c.color === colors[index]);
      return colorConfig?.css || "bg-neutral-100 text-neutral-600";
    }
    return "bg-neutral-100 text-neutral-600";
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-900">
        Short Link Keys
      </label>
      <div className="flex min-h-[42px] w-full flex-wrap items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2">
        {keys.map((key, index) => (
          <div
            key={key}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium",
              getColorForIndex(index),
            )}
          >
            <span className="font-mono">{key}</span>
            <button
              type="button"
              onClick={() => removeKey(key)}
              className="hover:opacity-70"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addKey}
          placeholder={keys.length === 0 ? "Add keys (press Enter)..." : ""}
          className="min-w-[120px] flex-1 border-none bg-transparent text-sm outline-none placeholder:text-neutral-400"
        />
      </div>
      <p className="text-xs text-neutral-500">
        Add multiple keys to create links with different slugs. Keys inherit colors from UTM templates.
      </p>
    </div>
  );
}

