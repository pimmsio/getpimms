import { Tooltip } from "@dub/ui";
import { cn } from "@dub/utils";

export function UrlModeToggle({
  mode,
  onChange,
}: {
  mode: "single" | "bulk";
  onChange: (mode: "single" | "bulk") => void;
}) {
  return (
    <div
      role="group"
      aria-label="Link creation mode"
      className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-100/80 p-1 shadow-sm"
    >
      <button
        type="button"
        onClick={() => onChange("single")}
        className={cn(
          "rounded-md px-3.5 py-2 text-sm font-medium transition-all",
          mode === "single"
            ? "bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200/80"
            : "text-neutral-600 hover:text-neutral-900 hover:bg-white/50",
        )}
      >
        Single link
      </button>
      <Tooltip
        side="bottom"
        content={
          <div className="max-w-xs px-4 py-2 text-center text-xs text-neutral-700">
            Create multiple short links at once by combining URLs with UTM
            templates.
          </div>
        }
      >
        <button
          type="button"
          onClick={() => onChange("bulk")}
          className={cn(
            "rounded-md px-3.5 py-2 text-sm font-medium transition-all",
            mode === "bulk"
              ? "bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200/80"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-white/50",
          )}
        >
          Multiple links
        </button>
      </Tooltip>
    </div>
  );
}
