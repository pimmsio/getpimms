import { useTargetingModal } from "@/ui/modals/link-builder/targeting-modal";
import { useABTestingModal } from "@/ui/modals/link-builder/ab-testing-modal";
import { usePasswordModal } from "@/ui/modals/link-builder/password-modal";
import { useExpirationModal } from "@/ui/modals/link-builder/expiration-modal";
import useWorkspace from "@/lib/swr/use-workspace";
import { LinkFormData } from "@/ui/links/link-builder/link-builder-provider";
import { Flask } from "@dub/ui";
import { cn } from "@dub/utils";
import { ChevronDown, ChevronRight, Clock, Lock, Settings2, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";

export function MoreOptionsSection() {
  const { flags } = useWorkspace();
  const { setShowTargetingModal, TargetingModal } = useTargetingModal();
  const { setShowABTestingModal, ABTestingModal } = useABTestingModal();
  const { setShowPasswordModal, PasswordModal } = usePasswordModal();
  const { setShowExpirationModal, ExpirationModal } = useExpirationModal();
  const { watch } = useFormContext<LinkFormData>();
  
  const [ios, android, geo] = watch(["ios", "android", "geo"]);
  const [testVariants, testCompletedAt] = watch([
    "testVariants",
    "testCompletedAt",
  ]);
  const password = watch("password");
  const expiresAt = watch("expiresAt");

  const targetingEnabled = Boolean(
    ios || android || Object.keys(geo || {}).length > 0,
  );
  const abTestingEnabled = Boolean(testVariants && testCompletedAt);
  const passwordEnabled = Boolean(password);
  const expirationEnabled = Boolean(expiresAt);

  // Always default to collapsed when modal opens
  const [isExpanded, setIsExpanded] = useState(false);

  // Ref for the collapsible content
  const contentRef = useRef<HTMLDivElement>(null);

  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Scroll to show the expanded content when opened
  useEffect(() => {
    if (isExpanded && contentRef.current) {
      // Use a timeout to ensure the content has been rendered
      setTimeout(() => {
        contentRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    }
  }, [isExpanded]);

  return (
    <>
      <TargetingModal />
      {flags?.abTesting && <ABTestingModal />}
      <PasswordModal />
      <ExpirationModal />

      <div className="space-y-3">
        {/* Toggle header */}
        <button
          type="button"
          onClick={toggleExpanded}
          className={cn(
            "group w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 transition-all hover:border-neutral-300",
            isExpanded && "border-neutral-300",
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-md bg-neutral-100 transition-colors group-hover:bg-neutral-200">
                <Settings2 className="size-4 text-neutral-600" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-neutral-900">
                  Advanced Options
                </div>
                <div className="text-xs text-neutral-500">
                  Targeting, testing, security & expiration
                </div>
              </div>
            </div>
            <ChevronDown
              className={cn(
                "size-4 text-neutral-400 transition-transform duration-200",
                isExpanded && "rotate-180",
              )}
            />
          </div>
        </button>

        {/* Collapsible content */}
        {isExpanded && (
          <div ref={contentRef} className="space-y-2">
            {/* App Stores Targeting */}
            <button
              type="button"
              onClick={() => setShowTargetingModal(true)}
              className="group w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left transition-all hover:border-neutral-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
                      targetingEnabled
                        ? "bg-blue-100"
                        : "bg-neutral-100 group-hover:bg-neutral-200",
                    )}
                  >
                    <Smartphone
                      className={cn(
                        "size-4",
                        targetingEnabled ? "text-blue-600" : "text-neutral-600",
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-neutral-900">
                        App Stores
                      </div>
                      {targetingEnabled && (
                        <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-500">
                      {targetingEnabled
                        ? "Redirect iOS/Android users to app stores"
                        : "Set custom links for mobile app stores"}
                    </div>
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>

            {/* A/B Testing */}
            {flags?.abTesting && (
              <button
                type="button"
                onClick={() => setShowABTestingModal(true)}
                className="group w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left transition-all hover:border-neutral-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
                        abTestingEnabled
                          ? "bg-purple-100"
                          : "bg-neutral-100 group-hover:bg-neutral-200",
                      )}
                    >
                      <Flask
                        className={cn(
                          "size-4",
                          abTestingEnabled
                            ? "text-purple-600"
                            : "text-neutral-600",
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-neutral-900">
                          A/B Testing
                        </div>
                        {abTestingEnabled && (
                          <span className="inline-flex items-center rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-500">
                        {abTestingEnabled
                          ? "Split test multiple destination URLs"
                          : "Test different URLs to optimize conversions"}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            )}

            {/* Password Protection */}
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="group w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left transition-all hover:border-neutral-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
                      passwordEnabled
                        ? "bg-amber-100"
                        : "bg-neutral-100 group-hover:bg-neutral-200",
                    )}
                  >
                    <Lock
                      className={cn(
                        "size-4",
                        passwordEnabled ? "text-amber-600" : "text-neutral-600",
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-neutral-900">
                        Password Protection
                      </div>
                      {passwordEnabled && (
                        <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-500">
                      {passwordEnabled
                        ? "Link is protected with a password"
                        : "Restrict access with password protection"}
                    </div>
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>

            {/* Link Expiration */}
            <button
              type="button"
              onClick={() => setShowExpirationModal(true)}
              className="group w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left transition-all hover:border-neutral-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
                      expirationEnabled
                        ? "bg-green-100"
                        : "bg-neutral-100 group-hover:bg-neutral-200",
                    )}
                  >
                    <Clock
                      className={cn(
                        "size-4",
                        expirationEnabled
                          ? "text-green-600"
                          : "text-neutral-600",
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-neutral-900">
                        Link Expiration
                      </div>
                      {expirationEnabled && (
                        <span className="inline-flex items-center rounded-md border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-500">
                      {expirationEnabled
                        ? "Link will expire automatically"
                        : "Set an expiration date for this link"}
                    </div>
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

