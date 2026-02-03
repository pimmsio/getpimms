"use client";

import { useOnboardingPreferences } from "@/lib/swr/use-onboarding-preferences";
import { getConversionProviderDisplayName } from "@/ui/layout/sidebar/conversions/conversions-onboarding-modal";
import { AppButton } from "@/ui/components/controls/app-button";
import { cn } from "@dub/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function SetupGuides({
  embedded = false,
  className,
}: {
  embedded?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { providerIds } = useOnboardingPreferences();

  const selectedStacksLabel = useMemo(() => {
    const ids = (providerIds || []).filter((id) => !String(id).startsWith("other"));
    if (ids.length === 0) return "Select your stack to see the right setup steps.";
    const labels = ids
      .map((id) => getConversionProviderDisplayName(id) ?? id)
      .slice(0, 3);
    const more = Math.max(0, ids.length - labels.length);
    return more > 0 ? `Selected: ${labels.join(", ")} +${more}` : `Selected: ${labels.join(", ")}`;
  }, [providerIds]);

  return (
    <div
      className={cn(
        embedded
          ? "rounded-lg border border-neutral-100 bg-neutral-50/40 p-4"
          : "mb-6 rounded-lg border border-neutral-200 bg-white p-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-neutral-900">Configuration guides</div>
          <div className="mt-1 text-sm text-neutral-600">{selectedStacksLabel}</div>
        </div>

        <AppButton
          variant="secondary"
          size="sm"
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("ctSetup", "1");
            const next = params.toString();
            router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
          }}
        >
          Setup tracking
        </AppButton>
      </div>
    </div>
  );
}


