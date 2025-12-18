"use client";

import { getIntegrationInstallUrl } from "@/lib/actions/get-integration-install-url";
import { SegmentSettings } from "@/lib/integrations/segment/ui/settings";
import { SlackSettings } from "@/lib/integrations/slack/ui/settings";
import { ZapierSettings } from "@/lib/integrations/zapier/ui/settings";
import useWorkspace from "@/lib/swr/use-workspace";
import { InstalledIntegrationInfoProps } from "@/lib/types";
import { AppButton, AppButtonLink } from "@/ui/components/controls/app-button";
import { AppIconButton } from "@/ui/components/controls/app-icon-button";
import { text } from "@/ui/design/tokens";
import { IntegrationLogo } from "@/ui/integrations/integration-logo";
import { useUninstallIntegrationModal } from "@/ui/modals/uninstall-integration-modal";
import { BackLink } from "@/ui/shared/back-link";
import { ThreeDots } from "@/ui/shared/icons";
import { Markdown } from "@/ui/shared/markdown";
import {
  Avatar,
  BlurImage,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNavBar,
  CarouselThumbnail,
  CarouselThumbnails,
  Popover,
  Tooltip,
  TooltipContent,
  useMediaQuery,
} from "@dub/ui";
import {
  CircleWarning,
  ConnectedDots,
  DubCraftedShield,
  Trash,
} from "@dub/ui/icons";
import {
  cn,
  DUB_WORKSPACE_ID,
  formatDate,
  SEGMENT_INTEGRATION_ID,
  SLACK_INTEGRATION_ID,
  STRIPE_INTEGRATION_ID,
  ZAPIER_INTEGRATION_ID,
} from "@dub/utils";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { memo, useState } from "react";
import { toast } from "sonner";

const integrationSettings = {
  [ZAPIER_INTEGRATION_ID]: ZapierSettings,
  [SLACK_INTEGRATION_ID]: SlackSettings,
  [SEGMENT_INTEGRATION_ID]: SegmentSettings,
};

export default function IntegrationPageClient({
  integration,
}: {
  integration: InstalledIntegrationInfoProps;
}) {
  const { slug, id: workspaceId } = useWorkspace();
  const { isMobile } = useMediaQuery();

  const [openPopover, setOpenPopover] = useState(false);
  const { execute, isPending } = useAction(getIntegrationInstallUrl, {
    onSuccess: ({ data }) => {
      if (!data?.url) {
        throw new Error("Error getting installation URL");
      }

      window.location.href = data.url;
    },
    onError: ({ error }) => {
      toast.error(error.serverError);
    },
  });

  const { UninstallIntegrationModal, setShowUninstallIntegrationModal } =
    useUninstallIntegrationModal({
      integration,
    });

  const SettingsComponent = integrationSettings[integration.id] || null;

  return (
    <div className="mx-auto grid w-full max-w-screen-lg grid-cols-1 gap-6">
      {integration.installed && <UninstallIntegrationModal />}
      <BackLink href={`/${slug}/settings/integrations`}>Integrations</BackLink>
      <div className="flex justify-between gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <IntegrationLogo
            src={integration.logo ?? null}
            alt={`Logo for ${integration.name}`}
            className="size-10 sm:size-14 sm:rounded"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <div className="text-base font-semibold leading-none text-neutral-800">
                {integration.name}
              </div>
              {integration.projectId === DUB_WORKSPACE_ID ? (
                <Tooltip content="This is an official integration built and maintained by PIMMS">
                  <div>
                    <DubCraftedShield className="size-4 -translate-y-px" />
                  </div>
                </Tooltip>
              ) : !integration.verified ? (
                <Tooltip content="PIMMS hasn't verified this integration. Install it at your own risk.">
                  <div>
                    <CircleWarning className="size-5 text-neutral-500" invert />
                  </div>
                </Tooltip>
              ) : null}
            </div>
            <p className="mt-1 text-[0.8125rem] leading-snug text-neutral-600">
              {integration.description}
            </p>
          </div>
        </div>

        {integration.installed && (
          <Popover
            align="end"
            content={
              <div className="grid w-screen gap-px p-2 sm:w-48">
                {integration.slug === "stripe" ? (
                  <Tooltip
                    content={
                      <TooltipContent
                        title="You cannot uninstall the Stripe integration from here. Please visit the Stripe dashboard to uninstall the app."
                        cta="Go to Stripe"
                        href="https://dashboard.stripe.com/settings/apps/pimms.io"
                        target="_blank"
                      />
                    }
                  >
                    <div className="w-full">
                      <AppButton
                        type="button"
                        variant="ghost"
                        className="w-full justify-start text-neutral-400"
                        disabled
                      >
                        <span className="flex items-center gap-2">
                          <Trash className="size-4" />
                          Remove Integration
                        </span>
                      </AppButton>
                    </div>
                  </Tooltip>
                ) : (
                  <AppButton
                    type="button"
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setShowUninstallIntegrationModal(true);
                      setOpenPopover(false);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Trash className="size-4" />
                      Remove Integration
                    </span>
                  </AppButton>
                )}
              </div>
            }
            openPopover={openPopover}
            setOpenPopover={setOpenPopover}
          >
            <AppIconButton
              type="button"
              onClick={() => setOpenPopover(!openPopover)}
              className="h-10 w-10 rounded-lg bg-white hover:bg-neutral-50"
            >
              <ThreeDots className="h-5 w-5 text-neutral-500" />
            </AppIconButton>
          </Popover>
        )}
      </div>

      <div className="border-t border-neutral-100 pt-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
          {[
            ...(integration.installed
              ? [
                  {
                    label: "Enabled by",
                    content: (
                      <span className="text-neutral-700">
                        <Avatar
                          user={integration.installed.by}
                          className="inline-block size-3 -translate-y-0.5 border-0"
                        />{" "}
                        {integration.installed.by.name}
                        <span className="ml-1 font-normal text-neutral-600">
                          {formatDate(integration.installed.createdAt, {
                            month: "short",
                            year:
                              integration.installed.createdAt.getFullYear() ===
                              new Date().getFullYear()
                                ? undefined
                                : "numeric",
                          })}
                        </span>
                      </span>
                    ),
                  },
                ]
              : []),
            {
              label: "Built by",
              content: (
                <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                  {/* {integration.projectId === DUB_WORKSPACE_ID ? (
                    <Logo className="size-3.5" />
                  ) : (
                    <OfficeBuilding className="size-3.5" />
                  )} */}
                  {integration.developer}
                </div>
              ),
            },
            // {
            //   label: "Website",
            //   content: (
            //     <a
            //       href={integration.website}
            //       className="flex items-center gap-1.5 text-sm text-neutral-700 transition-colors duration-100 hover:text-neutral-900"
            //       target="_blank"
            //       rel="noopener noreferrer"
            //     >
            //       <Globe className="size-3.5" />
            //       {getDomainWithoutWWW(integration.website)}
            //     </a>
            //   ),
            // },
          ].map(({ label, content }) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-xs uppercase text-neutral-500">
                {label}
              </span>
              <div className="text-[0.8125rem] font-medium text-neutral-600">
                {content}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-x-4">
          {(slug === "pimms" || slug === "pimms-staging") && (
            <AppButtonLink
              href={`/${slug}/settings/integrations/${integration.slug}/manage`}
              variant="secondary"
              size="sm"
              className="h-9 px-4"
            >
              Manage
            </AppButtonLink>
          )}
          {!integration.installed &&
            integration.id !== SEGMENT_INTEGRATION_ID && (
              <AppButton
                type="button"
                onClick={() => {
                  const { installUrl } = integration;

                  if (installUrl) {
                    // open in a new tab
                    window.open(installUrl, "_blank");
                    return;
                  }

                  execute({
                    workspaceId: workspaceId!,
                    integrationSlug: integration.slug,
                  });
                }}
                loading={isPending}
                variant="primary"
                className="flex items-center gap-2"
              >
                <ConnectedDots className="size-4" />
                Enable
              </AppButton>
            )}
          {!integration.installed &&
            integration.id === STRIPE_INTEGRATION_ID && (
              <AppButton
                type="button"
                onClick={() => {
                  execute({
                    workspaceId: workspaceId!,
                    integrationSlug: integration.slug,
                    test: true,
                  });
                }}
                loading={isPending}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <ConnectedDots className="size-4" />
                Enable (Test)
              </AppButton>
            )}
        </div>
      </div>

      <div className="border-t border-neutral-100 pt-4">
        {integration.screenshots && integration.screenshots.length > 0 ? (
          <Carousel autoplay={{ delay: 5000 }}>
            <div className="relative rounded-lg border border-neutral-100 bg-white p-4">
              <CarouselContent>
                {integration.screenshots.map((src, idx) => (
                  <CarouselItem key={idx}>
                    <BlurImageMemo
                      src={src}
                      alt={`Screenshot ${idx + 1} of ${integration.name}`}
                      width={900}
                      height={580}
                      className="aspect-[900/580] w-[5/6] overflow-hidden rounded-lg object-cover object-top"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselNavBar
                variant="simple"
                className="absolute bottom-6 left-1/2 -translate-x-1/2"
              />
            </div>
            {!isMobile && (
              <div className="relative">
                <CarouselThumbnails className="py-0.5">
                  {integration.screenshots.map((src, idx) => (
                    <CarouselThumbnail
                      key={idx}
                      index={idx}
                      className={({ active }) =>
                        cn(
                          "aspect-[900/580] h-[100px] shrink-0 select-none overflow-hidden rounded-[6px] border",
                          "border-neutral-200 ring-2 ring-transparent transition-all duration-100",
                          active
                            ? "border-neutral-300 ring-black/10"
                            : "hover:ring-black/5",
                        )
                      }
                    >
                      <BlurImageMemo
                        src={src}
                        alt={`Screenshot ${idx + 1} thumbnail`}
                        width={900}
                        height={580}
                        className="overflow-hidden rounded-[5px] object-cover object-top"
                      />
                    </CarouselThumbnail>
                  ))}
                </CarouselThumbnails>

                <div className="absolute inset-y-0 left-0 w-4 bg-white" />
                <div className="absolute inset-y-0 right-0 w-4 bg-white" />
              </div>
            )}
          </Carousel>
        ) : null}

        {integration.readme && <Markdown>{integration.readme}</Markdown>}
      </div>

      {SettingsComponent && <SettingsComponent {...integration} />}
    </div>
  );
}

const BlurImageMemo = memo(BlurImage);
