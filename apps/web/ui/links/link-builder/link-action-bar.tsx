import { Button } from "@dub/ui";
import { cn } from "@dub/utils";
import { PropsWithChildren } from "react";
import { useFormContext, useFormState } from "react-hook-form";
import { LinkFormData, useLinkBuilderContext } from "./link-builder-provider";
import { useMetatags } from "./use-metatags";

export function LinkActionBar({ children }: PropsWithChildren) {
  const { control, reset } = useFormContext<LinkFormData>();
  const { isDirty, isSubmitting, isSubmitSuccessful } = useFormState({
    control,
  });
  const { props } = useLinkBuilderContext();
  const { skipNextAutoFetch } = useMetatags();

  const handleDiscard = async () => {    
    if (props) {
      skipNextAutoFetch(); // Prevent auto-fetch on reset
      reset(props);
    } else {
      reset();
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 lg:bottom-4 z-50 w-full overflow-hidden [filter:drop-shadow(0_5px_8px_#222A351d)]",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-3xl items-center justify-between gap-4 overflow-hidden px-4 py-3",
          "border-t border-neutral-200 bg-white lg:rounded lg:border",
        )}
      >
        {children || (
          <span
            className="hidden text-sm font-medium text-neutral-600 lg:block"
            aria-hidden={!isDirty}
          >
            Unsaved changes
          </span>
        )}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            text="Discard"
            variant="secondary"
            className="hidden h-7 px-2.5 text-xs lg:flex"
            onClick={handleDiscard}
            disabled={!isDirty}
          />
          <Button
            type="submit"
            text="Save changes"
            variant="primary"
            className="h-7 px-2.5 text-xs"
            loading={isSubmitting || isSubmitSuccessful}
            disabled={!isDirty}
          />
        </div>
      </div>
    </div>
  );
}
