import useWorkspace from "@/lib/swr/use-workspace";
import { LinkFormData } from "@/ui/links/link-builder/link-builder-provider";
import {
  CrownSmall,
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

export const SearchEngineIndexingToggle = memo(() => {
  const { slug, plan } = useWorkspace();
  const { control, setValue } = useFormContext<LinkFormData>();

  const [doIndex] = useWatch({
    control,
    name: ["doIndex"],
  });

  const requiresUpgrade = plan === "free";

  useLinkBuilderKeyboardShortcut(
    "s",
    () => {
      setValue("doIndex", !doIndex, { shouldDirty: true });
      setValue("proxy", doIndex, { shouldDirty: true });
    },
    { enabled: true },
  );

  return (
    <label className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {isNew && (
          <div className="rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-[0.625rem] uppercase leading-none text-green-900">
            New
          </div>
        )}
        <span className="flex select-none items-center gap-1 text-sm font-medium text-neutral-700">
          Search engine indexing is{" "}
          {!doIndex ? (
            <span>disabled</span>
          ) : (
            <span className="text-green-500">enabled</span>
          )}
          <InfoTooltip content="Transfers PageRank to the destination URL. Only use this feature on your website or blog links to boost your SEO. When active, custom preview and deep linking are disabled." />
        </span>
      </div>
      <Switch
        checked={doIndex}
        fn={(checked) => {
          setValue("doIndex", checked, {
            shouldDirty: true,
          });
          setValue("proxy", !checked, { shouldDirty: true });
        }}
        disabledTooltip={requiresUpgrade ? <TooltipContent
          title="Search engine indexing is only available on Pro plans and above."
          cta="Upgrade to Pro"
          href={`/${slug}/upgrade`}
        /> : undefined}
        thumbIcon={
          requiresUpgrade ? <CrownSmall className="size-full text-neutral-500" /> : undefined
        }
      />
    </label>
  );
});
