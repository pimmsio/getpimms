import { useCheckFolderPermission } from "@/lib/swr/use-folder-permissions";
import useWorkspace from "@/lib/swr/use-workspace";
import {
  CardList,
  CopyButton,
  CursorRays,
  ReferredVia,
  Tooltip,
  useMediaQuery,
} from "@dub/ui";
import {
  APP_DOMAIN,
  cn,
  currencyFormatter,
  INFINITY_NUMBER,
  nFormatter,
  pluralize,
  timeAgo,
} from "@dub/utils";
import { CoinsIcon, MousePointerClick, TargetIcon } from "lucide-react";
import Link from "next/link";
import { useContext, useMemo, useState } from "react";
import { useShareDashboardModal } from "../modals/share-dashboard-modal";
import { ResponseLink } from "./links-container";
import { AppButton } from "@/ui/components/controls/app-button";

export function LinkAnalyticsBadge({
  link,
  url,
  sharingEnabled = true,
}: {
  link: Omit<ResponseLink, "user">;
  url?: string;
  sharingEnabled?: boolean;
}) {
  const { slug, plan, currency } = useWorkspace();
  const { domain, key, trackConversion, clicks, leads, saleAmount } = link;

  const { isMobile } = useMediaQuery();

  const stats = useMemo(
    () => [
      {
        id: "clicks",
        icon: MousePointerClick,
        value: clicks,
        iconClassName: "data-[active=true]:text-[#08272E]",
      },

      {
        id: "leads",
        icon: TargetIcon,
        value: leads,
        className: `${trackConversion ? "" : "text-neutral-300"}`,
        iconClassName: `${trackConversion ? "data-[active=true]:text-[#08272E]" : "text-neutral-300"}`,
      },
      {
        id: "sales",
        icon: CoinsIcon,
        value: saleAmount,
        className: `${trackConversion ? "" : "text-neutral-300"}`,
        iconClassName: `${trackConversion ? "data-[active=true]:text-[#08272E]" : "text-neutral-300"}`,
      },
    ],
    [link],
  );

  const { ShareDashboardModal, setShowShareDashboardModal } =
    useShareDashboardModal({ domain, _key: key });

  // Hacky fix for making sure the tooltip closes (by rerendering) when the modal opens
  const [modalShowCount, setModalShowCount] = useState(0);

  const canManageLink = useCheckFolderPermission(
    link.folderId,
    "folders.links.write",
  );

  return isMobile ? (
    <Link
      href={`/${slug}/analytics?domain=${domain}&key=${key}`}
      className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-0.5 text-sm text-neutral-800"
    >
      <CursorRays className="h-4 w-4 text-neutral-600" />
      {nFormatter(link.clicks)}
    </Link>
  ) : (
    <>
      {sharingEnabled && <ShareDashboardModal />}
      <Tooltip
        key={modalShowCount}
        side="top"
        content={
          <div className="flex flex-col gap-2.5 whitespace-nowrap p-3 text-neutral-600">
            {stats.map(({ id: tab, value }) => (
              <div
                key={tab}
                className={cn(
                  "text-sm leading-none",
                  trackConversion || tab === "clicks" ? "" : "hidden",
                )}
              >
                <span className="font-medium text-neutral-950">
                  {tab === "sales"
                    ? currencyFormatter(value / 100, { currency: currency ?? "EUR" })
                    : nFormatter(value, { full: value < INFINITY_NUMBER })}
                </span>{" "}
                {tab === "sales" ? "total " : ""}
                {pluralize(tab.slice(0, -1), value)}
              </div>
            ))}
            <p className="text-xs leading-none text-neutral-400">
              {link.lastClicked
                ? `Last clicked ${timeAgo(link.lastClicked, {
                    withAgo: true,
                  })}`
                : "No clicks yet"}
            </p>

            {sharingEnabled && (
              <div className="inline-flex items-start justify-start gap-2">
                <AppButton
                  size="sm"
                  variant="secondary"
                  className="h-7 w-full px-2 text-xs"
                  onClick={() => {
                    setShowShareDashboardModal(true);
                    setModalShowCount((c) => c + 1);
                  }}
                  disabled={!canManageLink}
                >
                  {link.dashboardId ? "Edit sharing" : "Share dashboard"}
                </AppButton>

                {link.dashboardId && (
                  <CopyButton
                    value={`${APP_DOMAIN}/share/${link.dashboardId}`}
                    variant="neutral"
                    className="h-7 items-center justify-center rounded border border-neutral-200 bg-white p-1.5 hover:border-neutral-300"
                  />
                )}
              </div>
            )}
          </div>
        }
      >
        <Link
          href={`/${slug}/analytics?domain=${domain}&key=${key}${url ? `&url=${url}` : ""}&interval=${plan === "free" ? "30d" : plan === "pro" ? "1y" : "all"}`}
          className="block w-fit overflow-hidden rounded-lg border border-neutral-200 bg-white py-0.5 text-sm text-neutral-600 transition-colors hover:border-neutral-300"
        >
          <div className="flex w-fit flex-col items-center px-1 sm:flex-row">
            <div className="flex w-fit flex-row items-center justify-center gap-1">
              {stats
                .filter(({ id }) => id === "clicks")
                .map(
                  ({
                    id: tab,
                    icon: Icon,
                    value,
                    className,
                    iconClassName,
                  }) => (
                    <div
                      key={tab}
                      className={cn(
                        "flex items-center gap-1 whitespace-nowrap rounded px-1 py-px transition-colors",
                        className,
                      )}
                    >
                      <Icon
                        data-active={value > 0}
                        className={cn("h-3 w-3 shrink-0", iconClassName)}
                      />
                      <span className="text-xs sm:text-sm">
                        {nFormatter(value)}
                      </span>
                    </div>
                  ),
                )}
            </div>
            <div className="flex w-full flex-row items-center gap-0.5">
              {stats
                .filter(({ id }) => id !== "clicks")
                .map(
                  ({
                    id: tab,
                    icon: Icon,
                    value,
                    className,
                    iconClassName,
                  }) => (
                    <div
                      key={tab}
                      className={cn(
                        "flex items-center gap-1 whitespace-nowrap rounded px-1 py-px transition-colors",
                        className,
                      )}
                    >
                      {tab !== "sales" && (
                        <Icon
                          data-active={value > 0}
                          className={cn("h-3 w-3 shrink-0", iconClassName)}
                        />
                      )}
                      <div className="flow-col flex gap-1">
                        <span className="text-xs sm:text-sm">
                          {tab === "sales"
                            ? currencyFormatter(value / 100, { currency: currency ?? "EUR" })
                            : nFormatter(value)}
                        </span>
                      </div>
                    </div>
                  ),
                )}
            </div>
            {link.dashboardId && (
              <div className="border-l border-neutral-200 px-1.5">
                <ReferredVia className="h-4 w-4 shrink-0 text-neutral-600" />
              </div>
            )}
          </div>
        </Link>
      </Tooltip>
    </>
  );
}
