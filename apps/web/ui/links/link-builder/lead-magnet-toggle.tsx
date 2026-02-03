import { LinkFormData } from "@/ui/links/link-builder/link-builder-provider";
import { HelpTooltip, Switch } from "@dub/ui";
import { memo } from "react";
import { useFormContext, useWatch } from "react-hook-form";

export const LeadMagnetToggle = memo(() => {
  const { control, setValue } = useFormContext<LinkFormData>();

  const [leadMagnetEnabled, trackConversion] = useWatch({
    control,
    name: ["leadMagnetEnabled", "trackConversion"] as any,
  }) as [boolean | undefined, boolean | undefined];

  const enabled = Boolean(leadMagnetEnabled);

  return (
    <label className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-neutral-900">
            Email capture
          </div>
          {enabled && (
            <span className="inline-flex items-center rounded-md bg-neutral-200/70 px-2 py-0.5 text-xs font-medium text-neutral-700">
              Active
            </span>
          )}
          <HelpTooltip content="Adds an email opt-in form between your link and the destination URL." />
        </div>
        <div className="mt-0.5 text-xs text-neutral-500">
          Capture email addresses before redirecting.
        </div>
      </div>
      <Switch
        checked={enabled}
        fn={(checked) => {
          setValue("leadMagnetEnabled" as any, checked, { shouldDirty: true });
          if (checked) {
            setValue("trackConversion", true, { shouldDirty: true });
          }
        }}
      />
    </label>
  );
});
