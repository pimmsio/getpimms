"use client";

import { useOnboardingPreferences } from "@/lib/swr/use-onboarding-preferences";
import {
  CATEGORY_CARDS,
  PROVIDERS,
  getConversionProviderDisplayName,
} from "@/ui/layout/sidebar/conversions/conversions-onboarding-modal";
import { canonicalizeProviderId } from "@/ui/onboarding/canonical-provider-id";
import { Modal } from "@dub/ui";
import { LoadingSpinner } from "@dub/ui/icons";
import { cn } from "@dub/utils";
import { Check, ChevronLeft } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Step = "chooseCategory" | "chooseProviders";

const EXCLUDED_PROVIDER_IDS = new Set([
  // Temporarily disabled
  "hubspotMeetings",
  "lemcal",
  "lovable",
  "shopify",
  "shopifyPayments",
  "typeform",
]);

function isSelectableProviderId(id: string) {
  // Exclude internal “setup paths” from the stack selector.
  // Also exclude canonical-only ids that exist only for dedupe/rendering.
  return id !== "leadMagnet" && id !== "thankyou" && id !== "brevo";
}

function isOtherProviderId(id: string) {
  return id === "other" || id.startsWith("other");
}

function displayNameForProviderId(id: string) {
  return getConversionProviderDisplayName(id) ?? id;
}

function canonicalizeForSelector(id: string) {
  return isOtherProviderId(id) ? "other" : canonicalizeProviderId(id);
}

export function TechStackSelectorModal({
  showModal,
  setShowModal,
}: {
  showModal: boolean;
  setShowModal: (open: boolean) => void;
}) {
  const [saving, setSaving] = useState(false);

  return (
    <Modal
      showModal={showModal}
      setShowModal={(next) => {
        const open = typeof next === "function" ? next(showModal) : next;
        // Keep the previous behavior: while saving, modal can't be dismissed
        // (prevents overlay/esc dismissal in addition to the "Close" button guard).
        if (!open && saving) return;
        setShowModal(open);
      }}
      className="max-h-[calc(100dvh-100px)] max-w-2xl"
      overlayClassName="onboarding-glass-overlay"
    >
      <TechStackSelector
        active={showModal}
        onClose={() => setShowModal(false)}
        onSavingChange={setSaving}
      />
    </Modal>
  );
}

export function TechStackSelector({
  active,
  onClose,
  showCloseButton = true,
  closeLabel = "Close",
  showHeading = true,
  chrome = "default",
  onSavingChange,
}: {
  active: boolean;
  onClose?: () => void;
  showCloseButton?: boolean;
  closeLabel?: string;
  showHeading?: boolean;
  chrome?: "default" | "none";
  onSavingChange?: (saving: boolean) => void;
}) {
  const { providerIds, setProviderIds } = useOnboardingPreferences();

  const [step, setStep] = useState<Step>("chooseCategory");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [draftSelected, setDraftSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const lastSavedKeyRef = useRef<string>("");
  const latestDraftKeyRef = useRef<string>("");
  const saveTimerRef = useRef<number | null>(null);
  const didInitForOpenRef = useRef(false);

  useEffect(() => {
    if (!active) {
      // Allow a fresh init next time it's opened.
      didInitForOpenRef.current = false;
      return;
    }
    // IMPORTANT: do not reset steps when providerIds changes (autosave),
    // otherwise we bounce the user back to categories after each save.
    if (didInitForOpenRef.current) return;
    didInitForOpenRef.current = true;
    setStep("chooseCategory");
    setCategoryId(null);
    setDraftSelected(
      Array.from(
        new Set(
          (providerIds || [])
            .filter((id) => !EXCLUDED_PROVIDER_IDS.has(id))
            .map((id) => canonicalizeForSelector(id)),
        ),
      ),
    );
    lastSavedKeyRef.current = Array.from(
      new Set(
        (providerIds || [])
          .filter((id) => !EXCLUDED_PROVIDER_IDS.has(id))
          .map((id) => canonicalizeForSelector(id)),
      ),
    )
      .sort()
      .join(",");
    latestDraftKeyRef.current = lastSavedKeyRef.current;
    setSaving(false);
  }, [active]);

  const selectedSet = useMemo(() => new Set(draftSelected), [draftSelected]);

  // Autosave on change (debounced).
  useEffect(() => {
    if (!active) return;
    const next = Array.from(
      new Set(
        draftSelected
          .filter((id) => !EXCLUDED_PROVIDER_IDS.has(id))
          .map((id) => canonicalizeForSelector(id)),
      ),
    ).sort();
    const key = next.join(",");
    latestDraftKeyRef.current = key;
    if (key === lastSavedKeyRef.current) {
      // If user toggled back to the last saved state (or we're still hydrating draftSelected),
      // cancel any pending save and make sure we don't stay stuck in "Saving…".
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (saving) {
        setSaving(false);
      }
      return;
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    setSaving(true);
    saveTimerRef.current = window.setTimeout(async () => {
      const saveKey = key;
      try {
        await setProviderIds(next);
        lastSavedKeyRef.current = saveKey;
      } finally {
        // If nothing else changed while saving, we can re-enable dismiss.
        const canStopSaving = latestDraftKeyRef.current === lastSavedKeyRef.current;
        if (canStopSaving) {
          setSaving(false);
        }
      }
    }, 400);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [active, draftSelected, saving, setProviderIds]);

  useEffect(() => {
    onSavingChange?.(saving);
  }, [onSavingChange, saving]);

  useEffect(() => {
    if (!active) {
      // If the selector is hidden by the parent, ensure parent doesn't stay locked.
      onSavingChange?.(false);
    }
  }, [active, onSavingChange]);

  const selectedCountByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const id of draftSelected) {
      const p = PROVIDERS.find((x) => x.id === id);
      if (!p) continue;
      map.set(p.category, (map.get(p.category) ?? 0) + 1);
    }
    return map;
  }, [draftSelected]);

  const categories = useMemo(
    () =>
      CATEGORY_CARDS.filter((c) => c.id !== "leadMagnet" && c.id !== "thankyou"),
    [],
  );

  const providersForCategory = useMemo(() => {
    if (!categoryId) return [];

    const base = PROVIDERS.filter(
      (p) => p.category === categoryId && isSelectableProviderId(p.id),
    )
      .filter((p) => !EXCLUDED_PROVIDER_IDS.has(p.id))
      .filter((p) => !isOtherProviderId(p.id));

    // Keep a single canonical "Other" across all categories.
    const withOther = [
      ...base,
      { id: "other", name: "Other (not in the list)", shortName: undefined, icon: undefined },
    ];

    return withOther;
  }, [categoryId]);

  const toggleProvider = (id: string) => {
    setDraftSelected((prev) => {
      const next = new Set(prev);

      // Canonicalize "Other" so it can only be selected once.
      const canonicalId = canonicalizeForSelector(id);
      const hadOtherSelected = Array.from(next).some((x) => isOtherProviderId(x));

      // Remove any existing "other*" before applying the toggle.
      for (const existing of Array.from(next)) {
        if (isOtherProviderId(existing)) next.delete(existing);
      }

      // If user clicked an "Other" option and it was already selected, this is a deselect.
      if (canonicalId === "other") {
        if (!hadOtherSelected) next.add("other");
        return Array.from(next);
      }

      if (next.has(canonicalId)) next.delete(canonicalId);
      else next.add(canonicalId);

      return Array.from(next);
    });
  };

  const closeSafe = () => {
    if (saving) return;
    onClose?.();
  };

  if (!active) return null;

  return (
    <div className="flex max-h-full flex-col">
      {chrome === "default" ? (
        <div className="border-b border-neutral-200 bg-white px-4 py-4 sm:px-8">
          <div className="flex items-center gap-2">
            {step === "chooseProviders" ? (
              <button
                type="button"
                onClick={() => {
                  setStep("chooseCategory");
                  setCategoryId(null);
                }}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
              >
                <ChevronLeft className="size-4" />
                Back
              </button>
            ) : null}
            {saving ? (
              <div className="ml-auto flex items-center gap-2 text-sm text-neutral-500">
                <LoadingSpinner className="size-4" />
                Saving…
              </div>
            ) : (
              <div className="ml-auto" />
            )}
            {showCloseButton && onClose ? (
              <button
                type="button"
                onClick={closeSafe}
                disabled={saving}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100",
                  saving && "cursor-not-allowed opacity-60 hover:bg-transparent",
                )}
              >
                {closeLabel}
              </button>
            ) : null}
          </div>

          {showHeading ? (
            step === "chooseCategory" ? (
              <>
                <h3 className="mt-3 text-lg font-semibold text-neutral-900">
                  Select your tech stack
                </h3>
                <p className="mt-1 text-sm text-neutral-600">
                  You can start tracking opt-in forms, calendar bookings, payments.
                </p>
              </>
            ) : (
              <>
                <h3 className="mt-3 text-lg font-semibold text-neutral-900">
                  {CATEGORY_CARDS.find((c) => c.id === categoryId)?.title ??
                    "Select tools"}
                </h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Select the tools you use.
                </p>
              </>
            )
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "flex-1 overflow-y-auto",
          chrome === "default" ? "px-4 py-4 sm:px-8 sm:py-6" : "py-2",
        )}
      >
        {chrome === "none" && step === "chooseProviders" ? (
          <button
            type="button"
            onClick={() => {
              setStep("chooseCategory");
              setCategoryId(null);
            }}
            className="mb-3 inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            <ChevronLeft className="size-4" />
            Back
          </button>
        ) : null}
        {step === "chooseCategory" ? (
          <div className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-100">
            {categories.map(({ id, title, subtitle, icon: Icon }) => {
              const count = selectedCountByCategory.get(id) ?? 0;
              return (
                <button
                  key={id}
                  type="button"
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-neutral-50"
                  onClick={() => {
                    setCategoryId(id);
                    setStep("chooseProviders");
                  }}
                >
                  <span className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-800">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-neutral-900">
                        {title}
                      </span>
                      <span className="mt-0.5 block line-clamp-2 text-xs text-neutral-600">
                        {subtitle}
                      </span>
                    </span>
                  </span>
                  {count > 0 ? (
                    <span className="shrink-0 rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-neutral-700">
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-100">
              {providersForCategory.map(({ id, name, shortName, icon: Icon }) => {
                const checked = selectedSet.has(canonicalizeForSelector(id));
                return (
                  <button
                    key={id}
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-neutral-50",
                      checked && "bg-neutral-900/5",
                    )}
                    onClick={() => toggleProvider(id)}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-neutral-50 text-neutral-800">
                        {Icon ? (
                          typeof Icon === "string" ? (
                            <img
                              alt=""
                              src={Icon}
                              className="h-5 w-5 object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <Icon className="h-5" />
                          )
                        ) : (
                          <span className="h-5 w-5 rounded bg-neutral-200" />
                        )}
                      </span>
                      <span className="truncate text-sm font-medium text-neutral-900">
                        {shortName || name}
                      </span>
                    </span>
                    {checked ? (
                      <span className="inline-flex items-center justify-center rounded-full bg-neutral-900 text-white">
                        <Check className="size-4 p-0.5" />
                      </span>
                    ) : (
                      <span className="inline-flex size-4 items-center justify-center rounded-full border border-neutral-300 bg-white" />
                    )}
                  </button>
                );
              })}
            </div>

            {providersForCategory.length === 0 ? (
              <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
                No matches. Try a different search.
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

