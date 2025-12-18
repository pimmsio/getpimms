import { AppButton } from "@/ui/components/controls/app-button";
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
        "fixed inset-x-0 bottom-0 z-50 w-full overflow-hidden lg:bottom-4",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-3xl items-center justify-between gap-4 overflow-hidden px-4 py-3",
          "border-t border-neutral-100 bg-white lg:rounded-xl",
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
          <AppButton
            type="button"
            variant="secondary"
            size="sm"
            className="hidden h-7 px-2.5 text-xs lg:flex"
            onClick={handleDiscard}
            disabled={!isDirty}
          >
            Discard
          </AppButton>
          <AppButton
            type="submit"
            variant="primary"
            size="sm"
            className="h-7 px-2.5 text-xs"
            loading={isSubmitting || isSubmitSuccessful}
            disabled={!isDirty}
          >
            Save changes
          </AppButton>
        </div>
      </div>
    </div>
  );
}
