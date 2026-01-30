"use client";

import useCustomersCount from "@/lib/swr/use-customers-count";
import useDomainsCount from "@/lib/swr/use-domains-count";
import { useOnboardingPreferences } from "@/lib/swr/use-onboarding-preferences";
import useUsers from "@/lib/swr/use-users";
import useWorkspace from "@/lib/swr/use-workspace";
import { UtmTemplateWithUserProps } from "@/lib/types";
import { PROVIDERS, getConversionProviderDisplayName } from "@/ui/layout/sidebar/conversions/conversions-onboarding-modal";
import { CustomSetupSupportModal } from "@/ui/onboarding/custom-setup-support-modal";
import { GetAClickModal } from "@/ui/onboarding/get-a-click-modal";
import { CheckCircleFill } from "@/ui/shared/icons";
import { ModalContext } from "@/ui/modals/modal-provider";
import { CircleDotted } from "@dub/ui/icons";
import { Modal } from "@dub/ui";
import { fetcher } from "@dub/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

type Task = {
  id: string;
  display: string;
  description: string;
  cta: string;
  checked: boolean;
  onClick?: () => void;
  badge?: string;
  badgeVariant?: "success" | "brand";
  icon?: any;
  tag?: string;
  showStatus?: boolean;
};

type OnboardingVideo = {
  id?: string;
  title: string;
  thumbnail?: string;
};

const ONBOARDING_VIDEOS: OnboardingVideo[] = [
  {
    id: "__TEbK4zonc",
    title: "Getting started with Pimms (1 min)",
    thumbnail: "https://img.youtube.com/vi/__TEbK4zonc/hqdefault.jpg",
  },
  {
    id: "9DRh7aYNqUk",
    title: "Short links are the foundation of Pimms (4 min)",
    thumbnail: "https://img.youtube.com/vi/9DRh7aYNqUk/hqdefault.jpg",
  },
  {
    id: "kV-8EN778Dw",
    title: "The ultimate power of UTMs (6 min)",
    thumbnail: "https://img.youtube.com/vi/kV-8EN778Dw/hqdefault.jpg?v=2",
  },
  {
    id: undefined,
    title: "Get started with lead tracking",
    thumbnail: undefined,
  },
  {
    id: undefined,
    title: "Analyze your campaigns with Pimms Analytics",
    thumbnail: undefined,
  },
];

const EXCLUDED_PROVIDER_IDS = new Set([
  // Temporarily disabled
  "hubspotMeetings",
  "lemcal",
  "lovable",
  "shopify",
  "shopifyPayments",
  "typeform",
]);

function providerCategoryLabel(category: string | undefined) {
  switch (category) {
    case "forms":
      return "Forms";
    case "calendars":
      return "Meetings";
    case "payments":
      return "Payments";
    case "website":
      return "Website";
    case "automations":
      return "Automations";
    case "apis":
      return "API";
    default:
      return null;
  }
}

export function GettingStartedPanel() {
  const { setShowLinkBuilder } = useContext(ModalContext);
  const { slug, totalLinks, totalClicks } = useWorkspace({
    swrOpts: {
      dedupingInterval: 5 * 60 * 1000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  });

  const { data: domainsCount, loading: domainsLoading } = useDomainsCount({
    ignoreParams: true,
  });

  const { data: customersCount } = useCustomersCount();
  const {
    providerIds: selectedProviderIds,
    completedProviderIds,
  } = useOnboardingPreferences();

  const { users, loading: usersLoading } = useUsers();
  const { users: invites, loading: invitesLoading } = useUsers({
    invites: true,
  });

  const { data: utmTemplates } = useSWR<UtmTemplateWithUserProps[]>(
    slug ? `/api/utm?workspaceId=${slug}` : null,
    fetcher,
    {
      dedupingInterval: 5 * 60 * 1000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  );

  const loading = domainsLoading || usersLoading || invitesLoading;

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [activeVideo, setActiveVideo] = useState<OnboardingVideo | null>(null);
  const [watchedVideoIds, setWatchedVideoIds] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showGetAClickModal, setShowGetAClickModal] = useState(false);
  const [showCustomSetupSupportModal, setShowCustomSetupSupportModal] =
    useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const openLeadMagnetLinkBuilder = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("newLink", "true");
    params.set("leadMagnet", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const openConversionSetup = useCallback(
    (providerId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("ctSetup", "1");
      params.set("ctProvider", providerId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const openConversionSetupList = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("ctSetup", "1");
    params.delete("ctProvider");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const selectedStacksLabel = useMemo(() => {
    const names = (selectedProviderIds || [])
      .filter((id) => !EXCLUDED_PROVIDER_IDS.has(id))
      .map((id) => {
        if (id.startsWith("other")) return "Other";
        const p = PROVIDERS.find((x) => x.id === id);
        const label = providerCategoryLabel(p?.category);
        const name = getConversionProviderDisplayName(id) || id;
        return label ? `${name} (${label})` : name;
      })
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    if (names.length === 0) return null;
    const head = names.slice(0, 2).join(", ");
    const remaining = names.length - 2;
    return remaining > 0 ? `${head} +${remaining}` : head;
  }, [selectedProviderIds]);

  const hasCustomSetupSelection = useMemo(() => {
    return (selectedProviderIds || []).some((id) => id.startsWith("other"));
  }, [selectedProviderIds]);

  const { data: videoProgress } = useSWR<{ watched: string[] }>(
    "/api/onboarding-videos",
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  const watchedFromServer = videoProgress?.watched ?? [];

  const markVideoWatched = (videoId: string) => {
    setWatchedVideoIds((prev) =>
      prev.includes(videoId) ? prev : [...prev, videoId],
    );

    fetch("/api/onboarding-videos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ videoId }),
    }).catch((error) => {
      console.error("Failed to persist onboarding video progress", error);
    });
  };

  const { data: gettingStartedVisibility } = useSWR<{ hidden: boolean }>(
    "/api/getting-started-visibility",
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  useEffect(() => {
    if (gettingStartedVisibility) {
      setIsCollapsed(gettingStartedVisibility.hidden);
    }
  }, [gettingStartedVisibility]);

  const toggleCollapsed = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);

    fetch("/api/getting-started-visibility", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ hidden: next }),
    }).catch((error) => {
      console.error("Failed to persist Getting Started visibility", error);
    });
  };

  const { primaryTasks, trackingTasks, moreActionsTasks } = useMemo<{
    primaryTasks: Task[];
    trackingTasks: Task[];
    moreActionsTasks: Task[];
  }>(() => {
    if (!slug) {
      return { primaryTasks: [], trackingTasks: [], moreActionsTasks: [] };
    }
    const primaryTasks: Task[] = [
      {
        id: "create-link",
        display: "Create a new link",
        description: "Shorten a URL to start tracking clicks right away.",
        cta: `/${slug}`,
        checked: Boolean(totalLinks && totalLinks > 0),
        onClick: () => setShowLinkBuilder(true),
      },
      {
        id: "get-a-click",
        display: "Get a Click",
        description: "Share a link and confirm traffic is coming in.",
        cta: `/${slug}/analytics`,
        checked: Boolean(totalClicks && totalClicks > 0),
        onClick: () => setShowGetAClickModal(true),
      },
      {
        id: "capture-new-leads",
        display: "Capture new leads in one step",
        badge: "New",
        badgeVariant: "success",
        description: "Works on any link — add an email form before redirecting.",
        cta: `/${slug}/today`,
        // We don't show a completion state for this item (status ticks are confusing here).
        checked: false,
        showStatus: false,
        onClick: openLeadMagnetLinkBuilder,
      },
    ];

    const trackingTasks: Task[] = [
      {
        id: "setup-tracking-beyond-clicks",
        display: "Setup tracking beyond clicks",
        badge: "Popular",
        badgeVariant: "brand",
        description: selectedStacksLabel
          ? `Selected: ${selectedStacksLabel} (click to edit)`
          : "Choose the tools you use (Stripe, Calendly, Framer, etc.)",
        cta: `/${slug}/today`,
        checked: Boolean(selectedProviderIds.length > 0),
        onClick: openConversionSetupList,
      },
      ...(selectedProviderIds || [])
        .filter((providerId) => !EXCLUDED_PROVIDER_IDS.has(providerId))
        .filter((providerId) => !providerId.startsWith("other"))
        .map((providerId) => {
          const name = getConversionProviderDisplayName(providerId) || providerId;
          const p = PROVIDERS.find((x) => x.id === providerId);
          const category = providerCategoryLabel(p?.category);
          return {
            id: `setup:${providerId}`,
            display: `Setup tracking for ${name}`,
            description: "",
            cta: `/${slug}/today`,
            checked: completedProviderIds.includes(providerId),
            onClick: () => openConversionSetup(providerId),
            icon: p?.icon,
            tag: category ?? undefined,
            showStatus: p?.category !== "automations" && p?.category !== "apis",
          } satisfies Task;
        }),
      ...(hasCustomSetupSelection
        ? ([
            {
              id: "contact-support-custom-setup",
              display: "Contact support for custom setup",
              description: "Tell us what you use and what you want to track.",
              cta: `/${slug}/today`,
              checked: false,
              onClick: () => setShowCustomSetupSupportModal(true),
              showStatus: false,
            } satisfies Task,
          ] as Task[])
        : []),
    ];

    const moreActionsTasks: Task[] = [
      {
        id: "create-utm-template",
        display: "Create one UTM template",
        description: "Save UTMs once and reuse them for campaigns.",
        cta: `/${slug}/settings/utm/templates`,
        checked: Boolean(utmTemplates && utmTemplates.length > 0),
        showStatus: false,
      },
      {
        id: "setup-custom-domain",
        display: "Setup a custom domain",
        description: "Use your brand domain for trusted links.",
        cta: `/${slug}/settings/domains`,
        checked: Boolean(domainsCount && domainsCount > 0),
        showStatus: false,
      },
      {
        id: "invite-teammate",
        display: "Invite a teammate",
        description: "Add collaborators so everyone can access the workspace.",
        cta: `/${slug}/settings/people`,
        checked: Boolean(
          (users && users.length > 1) || (invites && invites.length > 0),
        ),
        showStatus: false,
      },
    ];

    return { primaryTasks, trackingTasks, moreActionsTasks };
  }, [
    slug,
    domainsCount,
    totalLinks,
    totalClicks,
    customersCount,
    selectedProviderIds,
    completedProviderIds,
    selectedStacksLabel,
    hasCustomSetupSelection,
    users,
    invites,
    utmTemplates,
    setShowGetAClickModal,
    setShowCustomSetupSupportModal,
    setShowLinkBuilder,
    openLeadMagnetLinkBuilder,
    openConversionSetup,
    openConversionSetupList,
  ]);

  const allTasks = useMemo(
    () => [...primaryTasks, ...trackingTasks, ...moreActionsTasks],
    [primaryTasks, trackingTasks, moreActionsTasks],
  );

  if (!slug || loading || allTasks.length === 0) {
    return null;
  }

  const badgeClassName = (variant: Task["badgeVariant"]) => {
    switch (variant) {
      case "brand":
        return "bg-brand-primary/10 text-brand-primary ring-1 ring-inset ring-brand-primary/20";
      case "success":
      default:
        return "bg-emerald-100 text-emerald-800";
    }
  };

  return (
    <div className="space-y-3 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-neutral-900">
          Getting Started
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="rounded-md px-2 py-1 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
        >
          {isCollapsed ? "Show" : "Hide"}
        </button>
      </div>

      {!isCollapsed && (
        <div className="space-y-4 w-full max-w-full">
          <div className="grid gap-4 md:grid-cols-2 w-full max-w-full">
            <div className="space-y-3 w-full max-w-full">
              <div className="grid divide-y divide-neutral-100 overflow-hidden rounded-lg border border-neutral-200 bg-white w-full max-w-full">
                {primaryTasks.map(
                  ({
                    id,
                    display,
                    description,
                    cta,
                    checked,
                    onClick,
                    badge,
                    badgeVariant,
                    showStatus,
                    icon,
                  }) => {
                  const content = (
                    <div className="flex min-h-[74px] items-center justify-between gap-4 pl-4 pr-8 py-3 transition-colors group-hover:bg-neutral-50">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-neutral-900 transition-colors group-hover:text-neutral-700">
                            {icon ? (
                              <span className="inline-flex size-5 items-center justify-center rounded bg-neutral-50">
                                {typeof icon === "string" ? (
                                  <img
                                    alt=""
                                    src={icon}
                                    className="h-4 w-4 object-contain"
                                    loading="lazy"
                                  />
                                ) : (
                                  (() => {
                                    const Icon = icon as any;
                                    return <Icon className="h-4 w-4" />;
                                  })()
                                )}
                              </span>
                            ) : null}
                            <span>{display}</span>
                            {badge ? (
                              <span
                                className={[
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                  badgeClassName(badgeVariant),
                                ].join(" ")}
                              >
                                {badge}
                              </span>
                            ) : null}
                          </div>
                          {description ? (
                            <div className="mt-0.5 text-xs text-neutral-500">
                              {description}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      {showStatus === false ? null : (
                        <div className="ml-3 shrink-0">
                          {checked ? (
                            <CheckCircleFill className="size-5 text-green-600 transition-colors" />
                          ) : (
                            <CircleDotted className="size-5 text-neutral-400 transition-colors group-hover:text-neutral-500" />
                          )}
                        </div>
                      )}
                    </div>
                  );

                  if (onClick) {
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={onClick}
                        className="group w-full text-left transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        {content}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={id}
                      href={cta}
                      className="group transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      {content}
                    </Link>
                  );
                  },
                )}
              </div>

              {trackingTasks.length > 0 ? (
                <div className="grid divide-y divide-neutral-100 overflow-hidden rounded-lg border border-neutral-200 bg-white w-full max-w-full">
                  {trackingTasks.map(
                    ({
                      id,
                      display,
                      description,
                      cta,
                      checked,
                      onClick,
                      badge,
                      badgeVariant,
                      icon,
                      tag,
                      showStatus,
                    }) => {
                      const content = (
                        <div className="flex min-h-[74px] items-center justify-between gap-4 pl-4 pr-8 py-3 transition-colors group-hover:bg-neutral-50">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-neutral-900 transition-colors group-hover:text-neutral-700">
                                {icon ? (
                                  <span className="inline-flex size-5 items-center justify-center rounded bg-neutral-50">
                                    {typeof icon === "string" ? (
                                      <img
                                        alt=""
                                        src={icon}
                                        className="h-4 w-4 object-contain"
                                        loading="lazy"
                                      />
                                    ) : (
                                      (() => {
                                        const Icon = icon as any;
                                        return <Icon className="h-4 w-4" />;
                                      })()
                                    )}
                                  </span>
                                ) : null}
                                {tag ? (
                                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-700">
                                    {tag}
                                  </span>
                                ) : null}
                                <span>{display}</span>
                                {badge ? (
                                  <span
                                    className={[
                                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                      badgeClassName(badgeVariant),
                                    ].join(" ")}
                                  >
                                    {badge}
                                  </span>
                                ) : null}
                              </div>
                              {description ? (
                                <div className="mt-0.5 text-xs text-neutral-500">
                                  {description}
                                </div>
                              ) : null}
                            </div>
                          </div>
                          {showStatus === false ? null : (
                            <div className="ml-3 shrink-0">
                              {checked ? (
                                <CheckCircleFill className="size-5 text-green-600 transition-colors" />
                              ) : (
                                <CircleDotted className="size-5 text-neutral-400 transition-colors group-hover:text-neutral-500" />
                              )}
                            </div>
                          )}
                        </div>
                      );

                      if (onClick) {
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={onClick}
                            className="group w-full text-left transition-colors first:rounded-t-lg last:rounded-b-lg"
                          >
                            {content}
                          </button>
                        );
                      }

                      return (
                        <Link
                          key={id}
                          href={cta}
                          className="group transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          {content}
                        </Link>
                      );
                    },
                  )}
                </div>
              ) : null}

            </div>

            <div className="space-y-3 w-full max-w-full">
              <div className="grid divide-y divide-neutral-100 overflow-hidden rounded-lg border border-neutral-200 bg-white w-full max-w-full">
                {ONBOARDING_VIDEOS.map((video) => {
                  const isComingSoon = !video.id;
                  const watched =
                    !!video.id &&
                    (watchedVideoIds.includes(video.id) ||
                      watchedFromServer.includes(video.id));

                  if (isComingSoon) {
                    return (
                      <div
                        key={video.title}
                        className="flex w-full min-h-[74px] items-center gap-4 pl-4 pr-6 py-3 text-left opacity-60 first:rounded-t-lg last:rounded-b-lg"
                      >
                        <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md bg-neutral-100" />
                        <div className="flex min-w-0 flex-1">
                          <div className="line-clamp-2 wrap-break-word text-sm font-medium text-neutral-900">
                            {video.title}
                          </div>
                        </div>
                        <div className="ml-3 shrink-0 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                          Soon
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={video.title}
                      type="button"
                      onClick={() => {
                        if (!video.id) return;
                        setActiveVideo(video);
                        setShowVideoModal(true);
                        markVideoWatched(video.id);
                      }}
                      className="group flex w-full min-h-[74px] items-center gap-4 pl-4 pr-6 py-3 text-left transition-colors hover:bg-neutral-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                        {video.thumbnail && (
                          <Image
                            src={video.thumbnail}
                            alt={video.title}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1">
                        <div className="line-clamp-2 wrap-break-word text-sm font-medium text-neutral-900 transition-colors group-hover:text-neutral-700">
                          {video.title}
                        </div>
                      </div>
                      <div className="ml-3 shrink-0">
                        {watched ? (
                          <CheckCircleFill className="size-5 text-green-600 transition-colors" />
                        ) : (
                          <CircleDotted className="size-5 text-neutral-400 transition-colors group-hover:text-neutral-500" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {moreActionsTasks.length > 0 && (
            <div className="space-y-2 w-full max-w-full">
              <div className="text-sm font-semibold text-neutral-900">
                More actions you can do
              </div>
              <div className="grid grid-cols-1 divide-y divide-neutral-100 overflow-hidden rounded-lg border border-neutral-200 bg-white sm:grid-cols-3 sm:divide-y-0 sm:divide-x w-full max-w-full">
                {moreActionsTasks.map(
                  ({ id, display, description, cta, checked, onClick, showStatus }) => {
                    const content = (
                      <div className="flex min-h-[74px] items-center justify-between gap-4 px-4 py-3 transition-colors group-hover:bg-neutral-50">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-neutral-900 transition-colors group-hover:text-neutral-700">
                            {display}
                          </div>
                          {description ? (
                            <div className="mt-0.5 line-clamp-2 text-xs text-neutral-500">
                              {description}
                            </div>
                          ) : null}
                        </div>
                        {showStatus === false ? null : (
                          <div className="ml-3 shrink-0">
                            {checked ? (
                              <CheckCircleFill className="size-5 text-green-600 transition-colors" />
                            ) : (
                              <CircleDotted className="size-5 text-neutral-400 transition-colors group-hover:text-neutral-500" />
                            )}
                          </div>
                        )}
                      </div>
                    );

                    if (onClick) {
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={onClick}
                          className="group w-full text-left transition-colors"
                        >
                          {content}
                        </button>
                      );
                    }

                    return (
                      <Link
                        key={id}
                        href={cta}
                        className="group transition-colors"
                      >
                        {content}
                      </Link>
                    );
                  },
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        showModal={showVideoModal}
        setShowModal={setShowVideoModal}
        className="w-full max-w-[100vw] sm:max-w-3xl"
      >
        {activeVideo && (
          <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5 w-full max-w-full overflow-x-hidden">
            <div className="text-sm font-semibold text-neutral-900">
              {activeVideo.title}
            </div>
            <div className="relative w-full max-w-full overflow-hidden rounded-lg bg-black aspect-video">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </Modal>

      <GetAClickModal
        showModal={showGetAClickModal}
        setShowModal={setShowGetAClickModal}
      />

      <CustomSetupSupportModal
        showModal={showCustomSetupSupportModal}
        setShowModal={setShowCustomSetupSupportModal}
      />
    </div>
  );
}
