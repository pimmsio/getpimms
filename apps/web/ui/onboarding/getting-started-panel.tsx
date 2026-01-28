"use client";

import useCustomersCount from "@/lib/swr/use-customers-count";
import useDomainsCount from "@/lib/swr/use-domains-count";
import useUsers from "@/lib/swr/use-users";
import useWorkspace from "@/lib/swr/use-workspace";
import { UtmTemplateWithUserProps } from "@/lib/types";
import { CheckCircleFill } from "@/ui/shared/icons";
import { ModalContext } from "@/ui/modals/modal-provider";
import { CircleDotted } from "@dub/ui/icons";
import { Modal } from "@dub/ui";
import { fetcher } from "@dub/utils";
import Image from "next/image";
import Link from "next/link";
import { useContext, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

type Task = {
  display: string;
  description: string;
  cta: string;
  checked: boolean;
  onClick?: () => void;
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

export function GettingStartedPanel() {
  const { setShowConversionOnboardingModal, setShowLinkBuilder } = useContext(ModalContext);
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

  const tasks = useMemo<Task[]>(() => {
    if (!slug) return [];
    return [
      {
        display: "Create a new link",
        description: "Shorten a URL to start tracking clicks right away.",
        cta: `/${slug}`,
        checked: Boolean(totalLinks && totalLinks > 0),
        onClick: () => setShowLinkBuilder(true),
      },
      {
        display: "Get a Click",
        description: "Share a link and confirm traffic is coming in.",
        cta: `/${slug}/analytics`,
        checked: Boolean(totalClicks && totalClicks > 0),
      },
      {
        display: "Reveal a lead",
        description: "Create a link magnet or follow a setup guide.",
        cta: `/${slug}/conversions`,
        checked: Boolean(customersCount && customersCount > 0),
        onClick: () => setShowConversionOnboardingModal(true),
      },
      {
        display: "Create one UTM template",
        description: "Save UTMs once and reuse them for campaigns.",
        cta: `/${slug}/settings/utm/templates`,
        checked: Boolean(utmTemplates && utmTemplates.length > 0),
      },
      {
        display: "Setup a custom domain",
        description: "Use your brand domain for trusted links.",
        cta: `/${slug}/settings/domains`,
        checked: Boolean(domainsCount && domainsCount > 0),
      },
      {
        display: "Invite a teammate",
        description: "Add collaborators so everyone can access the workspace.",
        cta: `/${slug}/settings/people`,
        checked: Boolean(
          (users && users.length > 1) || (invites && invites.length > 0),
        ),
      },
    ];
  }, [
    slug,
    domainsCount,
    totalLinks,
    totalClicks,
    customersCount,
    users,
    invites,
    utmTemplates,
    setShowConversionOnboardingModal,
    setShowLinkBuilder,
  ]);

  const completedTasks = tasks.filter((task) => task.checked).length;

  if (!slug || loading || tasks.length === 0) {
    return null;
  }

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
        <div className="grid gap-4 md:grid-cols-2 w-full max-w-full">
          <div className="grid divide-y divide-neutral-100 overflow-hidden rounded-lg border border-neutral-200 bg-white w-full max-w-full">
            {tasks.map(({ display, description, cta, checked, onClick }) => {
              const content = (
                <div className="flex min-h-[74px] items-center justify-between gap-4 pl-4 pr-8 py-3 transition-colors group-hover:bg-neutral-50">
                  <div className="flex min-w-0 items-start gap-3">
                    {checked ? (
                      <CheckCircleFill className="mt-0.5 size-5 shrink-0 text-green-600 transition-colors" />
                    ) : (
                      <CircleDotted className="mt-0.5 size-5 shrink-0 text-neutral-400 transition-colors group-hover:text-neutral-500" />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-neutral-900 transition-colors group-hover:text-neutral-700">
                        {display}
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-500">
                        {description}
                      </div>
                    </div>
                  </div>
                </div>
              );

              if (onClick) {
                return (
                  <button
                    key={display}
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
                  key={display}
                  href={cta}
                  className="group transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  {content}
                </Link>
              );
            })}
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
    </div>
  );
}
