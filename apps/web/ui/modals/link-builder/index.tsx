"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { ExpandedLinkProps } from "@/lib/types";
import { AppButton } from "@/ui/components/controls/app-button";
import { AppIconButton } from "@/ui/components/controls/app-icon-button";
import { BulkDestinationUrlInput } from "@/ui/links/link-builder/bulk-destination-url-input";
import { BulkDomainSelector } from "@/ui/links/link-builder/bulk-domain-selector";
import { BulkUTMParametersSection } from "@/ui/links/link-builder/bulk-utm-parameters-section";
import { LinkBuilderDestinationUrlInput } from "@/ui/links/link-builder/controls/link-builder-destination-url-input";
import { LinkBuilderFolderSelector } from "@/ui/links/link-builder/controls/link-builder-folder-selector";
import { LinkBuilderShortLinkInput } from "@/ui/links/link-builder/controls/link-builder-short-link-input";
import { LinkCommentsInput } from "@/ui/links/link-builder/controls/link-comments-input";
import { ConversionTrackingToggle } from "@/ui/links/link-builder/conversion-tracking-toggle";
import {
  DraftControls,
  DraftControlsHandle,
} from "@/ui/links/link-builder/draft-controls";
import { LeadMagnetToggle } from "@/ui/links/link-builder/lead-magnet-toggle";
import { LinkBuilderHeader } from "@/ui/links/link-builder/link-builder-header";
import {
  LinkBuilderProps,
  LinkBuilderProvider,
  LinkFormData,
  useLinkBuilderContext,
} from "@/ui/links/link-builder/link-builder-provider";
import { LinkFeatureButtons } from "@/ui/links/link-builder/link-feature-buttons";
import { LinkPreview } from "@/ui/links/link-builder/link-preview";
import { MoreOptionsSection } from "@/ui/links/link-builder/more-options-section";
import { QRCodePreview } from "@/ui/links/link-builder/qr-code-preview";
import { TagSelect } from "@/ui/links/link-builder/tag-select";
import { bulkCreateLinks } from "@/ui/links/link-builder/use-bulk-create-links";
import { useLinkBuilderSubmit } from "@/ui/links/link-builder/use-link-builder-submit";
import { useMetatags } from "@/ui/links/link-builder/use-metatags";
import { UTMParametersSection } from "@/ui/links/link-builder/utm-parameters-section";
import { useAvailableDomains } from "@/ui/links/use-available-domains";
import { useUpgradeModal } from "@/ui/shared/use-upgrade-modal";
import {
  ArrowTurnLeft,
  Modal,
  Tooltip,
  TooltipContent,
  useKeyboardShortcut,
  useRouterStuff,
} from "@dub/ui";
import { cn, isValidUrl } from "@dub/utils";
import { Plus } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFormContext, useWatch } from "react-hook-form";

type LinkBuilderModalProps = {
  showLinkBuilder: boolean;
  setShowLinkBuilder: Dispatch<SetStateAction<boolean>>;
  homepageDemo?: boolean;
};

export function LinkBuilder(props: LinkBuilderProps & LinkBuilderModalProps) {
  return props.showLinkBuilder ? <LinkBuilderOuter {...props} /> : null;
}

function LinkBuilderOuter({
  showLinkBuilder,
  setShowLinkBuilder,
  homepageDemo,
  ...rest
}: LinkBuilderProps & LinkBuilderModalProps) {
  return (
    <LinkBuilderProvider {...rest}>
      <LinkBuilderInner
        showLinkBuilder={showLinkBuilder}
        setShowLinkBuilder={setShowLinkBuilder}
        homepageDemo={homepageDemo}
      />
    </LinkBuilderProvider>
  );
}

function LinkBuilderInner({
  showLinkBuilder,
  setShowLinkBuilder,
  homepageDemo,
}: LinkBuilderModalProps) {
  const searchParams = useSearchParams();
  const { queryParams } = useRouterStuff();
  const { id: workspaceId, slug, flags } = useWorkspace();

  const { props, duplicateProps } = useLinkBuilderContext();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isDirty, isSubmitting, isSubmitSuccessful, dirtyFields },
  } = useFormContext<LinkFormData>();

  // Bulk mode state
  const [urlMode, setUrlMode] = useState<"single" | "bulk">("single");
  const [bulkUrls, setBulkUrls] = useState<string[]>([]);
  const autoExpandUtm = showLinkBuilder && searchParams.has("utmFocus");
  const isTyPreset = searchParams.get("ty") === "1";
  const tyKey = searchParams.get("tyKey");
  const isLeadMagnetPreset = searchParams.get("leadMagnet") === "1";

  const [domain, key, leadMagnetEnabled, trackConversion] = useWatch({
    control,
    name: ["domain", "key", "leadMagnetEnabled", "trackConversion"],
  });

  useMetatags({
    enabled: showLinkBuilder,
  });

  const saveDisabled = useMemo(() => {
    /* 
      Disable save if:
      - modal is not open
      - saving is in progress
      - for an existing link, there's no changes
    */
    return Boolean(
      !showLinkBuilder ||
      isSubmitting ||
      isSubmitSuccessful ||
      (props && !isDirty),
    );
  }, [showLinkBuilder, isSubmitting, isSubmitSuccessful, props, isDirty]);

  const { loading, primaryDomain, domains } = useAvailableDomains({
    currentDomain: domain,
  });

  useEffect(() => {
    // for a new link (no props or duplicateProps), set the domain to the primary domain
    if (!loading && primaryDomain && !props && !duplicateProps) {
      setValue("domain", primaryDomain, {
        shouldValidate: true,
        shouldDirty: false,
      });
    }
  }, [loading, primaryDomain, props, duplicateProps, setValue, domain, key]);

  useEffect(() => {
    // TY preset: only prefill the key (leave the rest untouched).
    if (!showLinkBuilder) return;
    if (!isTyPreset || !tyKey) return;
    // Keep it simple + deterministic:
    // - Set the TY key immediately (without validation) so random key generation never starts.
    // - Don't override if the user already edited the key.
    if (dirtyFields?.key) return;
    if (String(key) === String(tyKey)) return;
    setValue("key", tyKey, { shouldValidate: false, shouldDirty: true });
  }, [
    showLinkBuilder,
    isTyPreset,
    tyKey,
    key,
    setValue,
    props,
    duplicateProps,
    dirtyFields,
  ]);

  useEffect(() => {
    // Lead magnet preset: turn on lead magnet for blank "new link" flows.
    // (We intentionally do not force it for existing links / duplicates.)
    if (!showLinkBuilder) return;
    if (!isLeadMagnetPreset) return;
    if (props || duplicateProps) return;
    if (leadMagnetEnabled) return;

    setValue("leadMagnetEnabled" as any, true, {
      shouldValidate: true,
      shouldDirty: false,
    });
    // Keep conversion tracking on (it should already be pinned, but be explicit).
    setValue("trackConversion", true, {
      shouldValidate: true,
      shouldDirty: false,
    });
  }, [
    showLinkBuilder,
    isLeadMagnetPreset,
    props,
    duplicateProps,
    leadMagnetEnabled,
    trackConversion,
    setValue,
  ]);

  const draftControlsRef = useRef<DraftControlsHandle>(null);

  const { link } = useParams() as { link: string | string[] };
  const router = useRouter();

  const onSubmitSuccess = useCallback((data: LinkFormData) => {
    draftControlsRef.current?.onSubmitSuccessful();

    if (link) {
      // Navigate to the new link
      router.push(`/${slug}/links/${data.domain}/${data.key}`);
    } else {
      // Navigate to the link's folder
      if (data.folderId) queryParams({ set: { folderId: data.folderId } });
      else queryParams({ del: ["folderId"] });
    }

    setShowLinkBuilder(false);
  }, []);

  const onSubmit = useLinkBuilderSubmit({
    onSuccess: onSubmitSuccess,
  });

  const handleFormSubmit = async (data: LinkFormData) => {
    if (urlMode === "bulk") {
      // Handle bulk creation
      await bulkCreateLinks({
        urls: bulkUrls,
        formData: data,
        workspaceId: workspaceId!,
        onSuccess: () => {
          setShowLinkBuilder(false);
          // Reset bulk state
          setBulkUrls([]);
        },
      });
    } else {
      // Handle single link creation
      await onSubmit(data);
    }
  };

  return (
    <>
      <Modal
        showModal={showLinkBuilder}
        setShowModal={setShowLinkBuilder}
        className="max-w-screen-lg"
        onClose={() => {
          if (searchParams.has("newLink"))
            queryParams({
              del: ["newLink", "newLinkDomain", "leadMagnet", "ty", "tyKey"],
            });
          draftControlsRef.current?.onClose();
        }}
      >
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="flex flex-col overflow-auto"
        >
          <LinkBuilderHeader
            onClose={() => {
              setShowLinkBuilder(false);
              if (searchParams.has("newLink")) {
                queryParams({
                  del: ["newLink", "leadMagnet", "ty", "tyKey"],
                });
              }
              draftControlsRef.current?.onClose();
            }}
            foldersEnabled={false}
            urlMode={urlMode}
            onUrlModeChange={setUrlMode}
            showUrlModeToggle={!props}
          >
            {urlMode === "single" && (
              <DraftControls
                ref={draftControlsRef}
                props={props}
                workspaceId={workspaceId!}
              />
            )}
          </LinkBuilderHeader>

          <div
            className={cn(
              "grid w-full max-md:overflow-auto sm:gap-y-6 md:grid-cols-[3fr_2fr]",
              "max-md:max-h-[calc(100dvh-200px)] max-md:min-h-[min(566px,calc(100dvh-200px))]",
              "md:[&>div]:max-h-[calc(100dvh-200px)] md:[&>div]:min-h-[min(566px,calc(100dvh-200px))]",
            )}
          >
            <div className="scrollbar-hide px-6 md:overflow-auto">
              <div className="flex flex-col gap-3 py-4 sm:gap-6">
                {urlMode === "single" ? (
                  <>
                    <LinkBuilderDestinationUrlInput />

                    <LinkBuilderShortLinkInput />

                    <UTMParametersSection autoExpand={autoExpandUtm} />

                    <TagSelect />

                    <LinkCommentsInput />

                    <LeadMagnetToggle />

                    <ConversionTrackingToggle />

                    <MoreOptionsSection />
                  </>
                ) : (
                  <>
                    <BulkDestinationUrlInput
                      urls={bulkUrls}
                      onChange={setBulkUrls}
                    />

                    <BulkUTMParametersSection />

                    <BulkDomainSelector
                      domains={domains}
                      selectedDomain={domain}
                      onChange={(newDomain) => setValue("domain", newDomain)}
                    />

                    <TagSelect />

                    <LinkCommentsInput />

                    <ConversionTrackingToggle />
                  </>
                )}
              </div>
            </div>
            <div className="scrollbar-hide px-2 md:overflow-auto md:px-6 md:pr-4 md:pl-0">
              <div className="rounded-3xl bg-neutral-50 px-4 py-3 ring-1 ring-neutral-200/60">
                <div className="flex flex-col gap-6">
                  <LinkBuilderFolderSelector />
                  <LinkPreview />
                  <QRCodePreview />
                </div>
              </div>
            </div>
          </div>
          <div className="sticky bottom-0 z-10 flex items-center gap-6 bg-white p-4 ring-1 ring-neutral-200/60">
            <LinkFeatureButtons />
            {homepageDemo ? (
              <AppButton
                type="button"
                variant="primary"
                size="sm"
                className="h-8 w-fit"
                disabled
                title="This is a demo link. You can't edit it."
              >
                Save changes
              </AppButton>
            ) : (
              <AppButton
                type="submit"
                variant="primary"
                disabled={
                  saveDisabled || (urlMode === "bulk" && bulkUrls.length === 0)
                }
                loading={isSubmitting || isSubmitSuccessful}
                className="h-8 w-full pr-1.5 pl-2.5"
              >
                {
                  <span className="flex items-center gap-2">
                    {props
                      ? "Save changes"
                      : urlMode === "bulk"
                        ? `Bulk create (${bulkUrls.length})`
                        : "Create link"}
                    <div className="rounded border border-white/20 p-1">
                      <ArrowTurnLeft className="size-3.5" />
                    </div>
                  </span>
                }
              </AppButton>
            )}
          </div>
        </form>
      </Modal>
    </>
  );
}

type CreateLinkButtonProps = {
  className?: string;
};

export function CreateLinkButton({
  setShowLinkBuilder,
  floating,
  ...buttonProps
}: {
  setShowLinkBuilder: Dispatch<SetStateAction<boolean>>;
  floating?: boolean;
} & CreateLinkButtonProps) {
  const { slug, nextPlan, exceededLinks } = useWorkspace();
  const { openUpgradeModal } = useUpgradeModal();

  useKeyboardShortcut("c", () => setShowLinkBuilder(true));

  // listen to paste event, and if it's a URL, open the modal and input the URL
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const pastedContent = e.clipboardData?.getData("text");
      const target = e.target as HTMLElement;
      const existingModalBackdrop = document.getElementById("modal-backdrop");

      // make sure:
      // - pasted content is a valid URL
      // - user is not typing in an input or textarea
      // - there is no existing modal backdrop (i.e. no other modal is open)
      // - workspace has not exceeded links limit
      if (
        pastedContent &&
        isValidUrl(pastedContent) &&
        target.tagName !== "INPUT" &&
        target.tagName !== "TEXTAREA" &&
        !existingModalBackdrop &&
        !exceededLinks
      ) {
        setShowLinkBuilder(true);
      }
    },
    [exceededLinks, setShowLinkBuilder],
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  if (floating) {
    const disabledTooltip = exceededLinks ? (
      <TooltipContent
        title="Your workspace has exceeded its monthly links limit. We're still collecting data on your existing links, but you need to upgrade to add more links."
        cta={`Upgrade to ${nextPlan.name}`}
        onClick={openUpgradeModal}
      />
    ) : undefined;

    if (disabledTooltip) {
      return (
        <Tooltip content={disabledTooltip}>
          <div className="fixed right-4 bottom-6 flex h-12 w-12 cursor-not-allowed items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-400">
            <Plus className="size-5" />
          </div>
        </Tooltip>
      );
    }

    return (
      <AppIconButton
        type="button"
        onClick={() => setShowLinkBuilder(true)}
        className={cn(
          "bg-brand-primary hover:bg-brand-primary-hover fixed right-4 bottom-6 h-12 w-12 p-0 text-white hover:text-white",
          buttonProps.className,
        )}
        aria-label="Create link"
      >
        <Plus className="size-5" />
      </AppIconButton>
    );
  }

  const disabledTooltip = exceededLinks ? (
    <TooltipContent
      title="Your workspace has exceeded its monthly links limit. We're still collecting data on your existing links, but you need to upgrade to add more links."
      cta={nextPlan ? `Upgrade to ${nextPlan.name}` : "Contact support"}
      onClick={openUpgradeModal}
    />
  ) : undefined;

  return (
    <AppButton
      type="button"
      variant="primary"
      size="md"
      disabled={exceededLinks}
      disabledTooltip={disabledTooltip}
      onClick={() => setShowLinkBuilder(true)}
      className={cn(buttonProps.className)}
    >
      Create link
    </AppButton>
  );
}

export function useLinkBuilder({
  props,
  duplicateProps,
  homepageDemo,
  floating,
}: {
  props?: ExpandedLinkProps;
  duplicateProps?: ExpandedLinkProps;
  homepageDemo?: boolean;
  floating?: boolean;
} = {}) {
  const workspace = useWorkspace();
  const [showLinkBuilder, setShowLinkBuilder] = useState(false);

  const LinkBuilderCallback = useCallback(() => {
    return (
      <LinkBuilder
        showLinkBuilder={showLinkBuilder}
        setShowLinkBuilder={setShowLinkBuilder}
        props={props}
        duplicateProps={duplicateProps}
        homepageDemo={homepageDemo}
        workspace={workspace}
        modal={true}
      />
    );
  }, [showLinkBuilder]);

  const CreateLinkButtonCallback = useCallback(
    (props?: CreateLinkButtonProps) => {
      return (
        <CreateLinkButton
          setShowLinkBuilder={setShowLinkBuilder}
          floating={floating}
          {...props}
        />
      );
    },
    [],
  );

  return useMemo(
    () => ({
      showLinkBuilder,
      setShowLinkBuilder,
      LinkBuilder: LinkBuilderCallback,
      CreateLinkButton: CreateLinkButtonCallback,
    }),
    [showLinkBuilder, LinkBuilderCallback, CreateLinkButtonCallback],
  );
}
