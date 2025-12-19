import { memo } from "react";
import { Controller } from "react-hook-form";
import { HelpTooltip } from "../help-tooltip";

export const LinkCommentsInput = memo(() => {
  return (
    <div>
      <div className="flex items-center gap-2">
        <label
          htmlFor="comments"
          className="hidden sm:block text-sm font-medium text-neutral-700"
        >
          Title
        </label>
        <HelpTooltip
          label="Help: Title"
          content="Internal title to help you identify this link in the dashboard."
          className="hidden sm:inline-flex"
        />
      </div>
      <Controller
        name="comments"
        render={({ field }) => (
          <input
            id="comments"
            name="comments"
            type="text"
            className="mt-2 block w-full rounded-lg border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-0 sm:text-sm"
            placeholder="Add a title"
            value={field.value ?? ""}
            onChange={(e) => field.onChange(e.target.value)}
          />
        )}
      />
    </div>
  );
});

LinkCommentsInput.displayName = "LinkCommentsInput";
