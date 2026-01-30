"use client";

import useLinks from "@/lib/swr/use-links";
import useWorkspace from "@/lib/swr/use-workspace";
import { ModalContext } from "@/ui/modals/modal-provider";
import { Modal } from "@dub/ui";
import { LoadingSpinner } from "@dub/ui/icons";
import { cn } from "@dub/utils";
import Link from "next/link";
import { useContext, useEffect, useMemo, useRef, useState } from "react";

type ClickFeedResponse = {
  hasRealData: boolean;
  items: Array<{
    timestamp: string;
    clickId: string;
    linkId: string;
  }>;
};

type Phase = "pick_link" | "waiting_for_click" | "success";

const CLICK_TIMEOUT_MS = 45_000;
const CLICK_POLL_INTERVAL_MS = 2_000;

export function GetAClickModal({
  showModal,
  setShowModal,
}: {
  showModal: boolean;
  setShowModal: (open: boolean) => void;
}) {
  const { setShowLinkBuilder } = useContext(ModalContext);
  const { slug, id: workspaceId } = useWorkspace();

  const { links, isValidating: linksLoading } = useLinks({
    pageSize: 3,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const recentLinks = useMemo(() => (links ?? []).slice(0, 3), [links]);

  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const selected = useMemo(
    () => recentLinks.find((l) => l.id === selectedLinkId) ?? null,
    [recentLinks, selectedLinkId],
  );

  const [phase, setPhase] = useState<Phase>("pick_link");
  const [message, setMessage] = useState<string | null>(null);

  const openedAtRef = useRef<number | null>(null);
  const startedWaitingAtRef = useRef<number | null>(null);

  // Reset modal state on open/close.
  useEffect(() => {
    if (!showModal) {
      setPhase("pick_link");
      setMessage(null);
      setSelectedLinkId(null);
      openedAtRef.current = null;
      startedWaitingAtRef.current = null;
      return;
    }
    // on open: clear transient UI
    setPhase("pick_link");
    setMessage(null);
    openedAtRef.current = null;
    startedWaitingAtRef.current = null;
  }, [showModal]);

  // Default selection once links are available.
  useEffect(() => {
    if (!showModal) return;
    if (selectedLinkId) return;
    if (recentLinks.length === 0) return;
    setSelectedLinkId(recentLinks[0]?.id ?? null);
  }, [showModal, selectedLinkId, recentLinks]);

  const startClickTest = () => {
    if (!selected?.shortLink) return;
    setMessage(null);
    setPhase("waiting_for_click");
    const openedAt = Date.now();
    openedAtRef.current = openedAt;
    startedWaitingAtRef.current = openedAt;
    window.open(selected.shortLink, "_blank", "noopener,noreferrer");
  };

  // Poll click-feed while waiting.
  useEffect(() => {
    if (!showModal) return;
    if (phase !== "waiting_for_click") return;
    if (!workspaceId) return;
    if (!selected?.id) return;

    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      if (cancelled) return;

      const startedAt = startedWaitingAtRef.current ?? Date.now();
      if (Date.now() - startedAt > CLICK_TIMEOUT_MS) {
        setPhase("pick_link");
        setMessage("No click detected yet. Try opening the link again.");
        return;
      }

      try {
        const res = await fetch(
          `/api/click-feed?workspaceId=${encodeURIComponent(workspaceId)}&limit=10`,
          { method: "GET" },
        );
        if (!res.ok) throw new Error("Failed to fetch click activity");
        const data = (await res.json()) as ClickFeedResponse;
        const openedAt = openedAtRef.current ?? startedAt;

        const hasMatch = (data.items ?? []).some((it) => {
          if (it.linkId !== selected.id) return false;
          const ts = new Date(it.timestamp).getTime();
          return Number.isFinite(ts) && ts >= openedAt;
        });

        if (hasMatch) {
          setPhase("success");
          setMessage(null);
          return;
        }
      } catch {
        // Don't fail the flow on transient errors; keep polling.
      }

      timer = window.setTimeout(poll, CLICK_POLL_INTERVAL_MS);
    };

    poll();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [showModal, phase, workspaceId, selected?.id]);

  const analyticsHref = slug ? `/${slug}/analytics` : "#";

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="w-full max-w-[100vw] sm:max-w-xl"
    >
      <div className="w-full max-w-full overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5">
        <div className="text-sm font-semibold text-neutral-900">Get a click</div>
        <div className="mt-1 text-sm text-neutral-600">
          Pick a recent link, open it, then come back — we’ll confirm the click
          was recorded.
        </div>

        <div className="mt-5">
          {linksLoading ? (
            <div className="flex items-center justify-center rounded-lg bg-neutral-50 py-10">
              <LoadingSpinner />
            </div>
          ) : recentLinks.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="text-sm font-medium text-neutral-900">
                Create a link first
              </div>
              <div className="mt-1 text-sm text-neutral-600">
                Once you have a link, you’ll be able to open it and record your
                first click.
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                  onClick={() => {
                    setShowModal(false);
                    setShowLinkBuilder(true);
                  }}
                >
                  Create a link
                </button>
                {slug ? (
                  <Link
                    href={`/${slug}/links`}
                    className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    View links
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {recentLinks.map((l) => {
                  const selectedNow = l.id === selectedLinkId;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        setSelectedLinkId(l.id);
                        setMessage(null);
                        setPhase("pick_link");
                      }}
                      className={cn(
                        "w-full rounded-lg border p-3 text-left transition-colors",
                        selectedNow
                          ? "border-neutral-900 bg-neutral-900/5"
                          : "border-neutral-200 bg-white hover:bg-neutral-50",
                      )}
                    >
                      <div className="text-sm font-medium text-neutral-900">
                        {l.domain}/{l.key}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-neutral-500">
                        {l.url}
                      </div>
                    </button>
                  );
                })}
              </div>

              {message ? (
                <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {message}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {phase === "success" ? (
                  <>
                    <div className="text-sm font-medium text-emerald-700">
                      Click recorded.
                    </div>
                    <Link
                      href={analyticsHref}
                      className={cn(
                        "ml-auto rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800",
                        analyticsHref === "#" && "pointer-events-none opacity-60",
                      )}
                      onClick={() => setShowModal(false)}
                    >
                      Check analytics
                    </Link>
                  </>
                ) : phase === "waiting_for_click" ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <LoadingSpinner className="size-4" />
                      Waiting for your click…
                    </div>
                    <button
                      type="button"
                      className="ml-auto rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                      onClick={startClickTest}
                      disabled={!selected?.shortLink}
                    >
                      Open link again
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={startClickTest}
                      disabled={!selected?.shortLink}
                    >
                      Open selected link
                    </button>
                    <Link
                      href={analyticsHref}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100",
                        analyticsHref === "#" && "pointer-events-none opacity-60",
                      )}
                      onClick={() => setShowModal(false)}
                    >
                      Go to analytics
                    </Link>
                  </>
                )}

                <button
                  type="button"
                  className="ml-auto rounded-md px-3 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-100"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

