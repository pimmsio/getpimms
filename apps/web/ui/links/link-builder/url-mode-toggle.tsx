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
    <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
      <button
        type="button"
        onClick={() => onChange("single")}
        className={cn(
          "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
          mode === "single"
            ? "bg-white text-neutral-900"
            : "text-neutral-600 hover:text-neutral-900",
        )}
      >
        Single URL
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
            "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
            mode === "bulk"
              ? "bg-white text-neutral-900"
              : "text-neutral-600 hover:text-neutral-900",
          )}
        >
          Multiple URLs
        </button>
      </Tooltip>
    </div>
  );
}
