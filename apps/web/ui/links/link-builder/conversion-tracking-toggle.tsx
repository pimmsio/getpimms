import useWorkspace from "@/lib/swr/use-workspace";
import { LinkFormData } from "@/ui/links/link-builder/link-builder-provider";
import {
  FlaskSmall,
  InfoTooltip,
  Switch,
  TooltipContent,
} from "@dub/ui";
import { memo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useLinkBuilderKeyboardShortcut } from "./use-link-builder-keyboard-shortcut";

// Show new badge for 30 days
const isNew =
  new Date().getTime() - new Date("2025-01-13").getTime() < 30 * 86_400_000;

export const ConversionTrackingToggle = memo(() => {
  useWorkspace(); // keep workspace hydrated for the surrounding link builder UI
  const { control, setValue } = useFormContext<LinkFormData>();

  const conversionsEnabled = true;

  const [trackConversion, testVariants] = useWatch({
    control,
    name: ["trackConversion", "testVariants"],
  });

  useLinkBuilderKeyboardShortcut(
    "c",
    () => setValue("trackConversion", !trackConversion, { shouldDirty: true }),
    { enabled: conversionsEnabled },
  );

  return (
    <label className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {isNew && (
          <div className="rounded-md border border-green-200 bg-green-50 px-2 py-0.5 text-[0.625rem] uppercase leading-none text-green-900">
            New
          </div>
        )}
        <span className="flex select-none items-center gap-1 text-sm font-medium text-neutral-700">
          Conversion tracking is{" "}
          {!trackConversion ? (
            <span>disabled</span>
          ) : (
            <span className="text-green-500">enabled</span>
          )}
          <InfoTooltip content="Track leads and sales for this link." />
        </span>
      </div>
      <Switch
        checked={trackConversion}
        fn={(checked) =>
          setValue("trackConversion", checked, {
            shouldDirty: true,
          })
        }
        disabledTooltip={
          trackConversion && testVariants ? (
            <TooltipContent title="Conversion tracking must be enabled to use A/B testing." />
          ) : undefined
        }
        thumbIcon={
          trackConversion && testVariants ? (
            <span className="flex size-full items-center justify-center">
              <FlaskSmall className="size-2 text-blue-500" />
            </span>
          ) : undefined
        }
      />
    </label>
  );
});
