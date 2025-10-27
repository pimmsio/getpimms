import { LinkFormData } from "@/ui/links/link-builder/link-builder-provider";
import {
  InfoTooltip,
  Switch,
} from "@dub/ui";
import { memo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useLinkBuilderKeyboardShortcut } from "./use-link-builder-keyboard-shortcut";

export const DisableDeeplinkToggle = memo(() => {
  const { control, setValue } = useFormContext<LinkFormData>();

  const [proxy] = useWatch({
    control,
    name: ["proxy"],
  });

  useLinkBuilderKeyboardShortcut(
    "d",
    () => {
      setValue("proxy", !proxy, { shouldDirty: true });
      setValue("doIndex", proxy, { shouldDirty: true });
    },
    { enabled: true },
  );

  return (
    <label className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="flex select-none items-center gap-1 text-sm font-medium text-neutral-700">
          Deep linking is{" "}
          {!proxy ? (
            <span>disabled</span>
          ) : (
            <span className="text-green-500">enabled</span>
          )}
          <InfoTooltip content="Deep linking opens links in official apps (YouTube, Twitter, etc.) instead of in browser. When enabled, search engine indexing is disabled." />
        </span>
      </div>
      <Switch
        checked={proxy}
        fn={(checked) => {
          setValue("proxy", checked, {
            shouldDirty: true,
          });
          setValue("doIndex", !checked, { shouldDirty: true });
        }}
      />
    </label>
  );
});

