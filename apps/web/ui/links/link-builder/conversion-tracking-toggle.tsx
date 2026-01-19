import useWorkspace from "@/lib/swr/use-workspace";
import { LinkFormData } from "@/ui/links/link-builder/link-builder-provider";
import { memo, useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useLinkBuilderKeyboardShortcut } from "./use-link-builder-keyboard-shortcut";

export const ConversionTrackingToggle = memo(() => {
  useWorkspace(); // keep workspace hydrated for the surrounding link builder UI
  const { control, setValue } = useFormContext<LinkFormData>();

  const [trackConversion] = useWatch({
    control,
    name: ["trackConversion"],
  });

  // Conversion tracking is always on (no toggle).
  // Keep the form field pinned to true so downstream logic (e.g. test variants) behaves consistently.
  useEffect(() => {
    if (!trackConversion) {
      setValue("trackConversion", true, { shouldDirty: true });
    }
  }, [trackConversion, setValue]);

  // Keep keyboard shortcut wired for internal dev muscle memory, but don't allow disabling.
  useLinkBuilderKeyboardShortcut("c", () => {
    setValue("trackConversion", true, { shouldDirty: true });
  });

  // Minimalism: don't render a toggle row at all.
  // (A/B testing UI already assumes tracking is enabled; we keep the value pinned above.)
  return null;
});
