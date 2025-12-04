import { InfoTooltip, SimpleTooltipContent } from "@dub/ui";
import { memo } from "react";
import { Controller } from "react-hook-form";

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
        {/* <InfoTooltip
          content={
            <SimpleTooltipContent
              title="Add a custom title to your short link for easy identification."
              cta="Learn more."
              href="https://dub.co/help/article/link-comments"
            />
          }
        /> */}
      </div>
      <Controller
        name="comments"
        render={({ field }) => (
          <input
            id="comments"
            name="comments"
            type="text"
            className="mt-2 block w-full rounded-xl border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-0 sm:text-sm"
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
