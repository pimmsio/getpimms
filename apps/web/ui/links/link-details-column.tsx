import { mutatePrefix } from "@/lib/swr/mutate";
import { useCheckFolderPermission } from "@/lib/swr/use-folder-permissions";
import useWorkspace from "@/lib/swr/use-workspace";
import { AppIconButton } from "@/ui/components/controls/app-icon-button";
import { CardList, Switch, Tooltip, useCopyToClipboard } from "@dub/ui";
import { Copy } from "@dub/ui/icons";
import {
  cn,
  currencyFormatter,
  INFINITY_NUMBER,
  linkConstructor,
  nFormatter,
} from "@dub/utils";
import { memo, useCallback, useContext, useRef, useState } from "react";
import { toast } from "sonner";
import { LinkControls } from "./link-controls";
import { useLinkSelection } from "./link-selection-provider";
import { LinkUtmColumns } from "./link-utm-columns";
import { LinksListContext, ResponseLink } from "./links-container";
import { LinksDisplayContext } from "./links-display-provider";

type UtmKey =
  | "utm_source"
  | "utm_medium"
  | "utm_campaign"
  | "utm_term"
  | "utm_content";
type UtmVisibility = {
  visibleUtmKeys: UtmKey[];
  showTagsColumn: boolean;
};

export function LinkDetailsColumn({
  link,
  utmVisibility,
}: {
  link: ResponseLink;
  utmVisibility?: UtmVisibility;
}) {
  const { domain, key } = link;
  const isConversionCallback = !!link.isConversionCallback;

  const { displayProperties } = useContext(LinksDisplayContext);

  const ref = useRef<HTMLDivElement>(null);

  const fullShortLink = linkConstructor({ domain, key, pretty: false });
  const [_copied, copyToClipboard] = useCopyToClipboard();

  return (
    <div ref={ref} className="flex items-center justify-end gap-2 sm:gap-3">
      {/* Desktop: UTMs then Analytics (no space taken on small screens) */}
      <div className="hidden items-center gap-3 xl:flex">
        <LinkUtmColumns
          link={link}
          tags={link.tags}
          visibleUtmKeys={utmVisibility?.visibleUtmKeys}
          showTagsColumn={utmVisibility?.showTagsColumn}
          disableUtms={isConversionCallback}
        />
      </div>
      <div className="hidden xl:flex xl:justify-end">
        <LinkMetricsStrip link={link} />
      </div>

      {/* Mobile / tablet: compact analytics badges always visible */}
      <div className="flex xl:hidden">
        <LinkMobileMetricsBadges link={link} />
      </div>

      {/* Actions: Copy must be next to overflow */}
      <div className="flex shrink-0 items-center gap-1">
        <Tooltip content="Copy short link" delayDuration={150}>
          <AppIconButton
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toast.promise(copyToClipboard(fullShortLink), {
                success: "Copied!",
              });
            }}
            className="h-8 w-8"
            aria-label="Copy short link"
          >
            <Copy className="h-4 w-4" />
          </AppIconButton>
        </Tooltip>
        <Controls link={link} />
      </div>
    </div>
  );
}

function LinkMetricsStrip({ link }: { link: ResponseLink }) {
  const { slug, currency } = useWorkspace();
  const canManageLink = useCheckFolderPermission(
    link.folderId,
    "folders.links.write",
  );
  const [enabling, setEnabling] = useState(false);
  const isConversionCallback = !!(link as any).isConversionCallback;
  const {
    clicks,
    leads,
    saleAmount,
    trackConversion,
    clicksActive,
    leadsActive,
    revenueActive,
  } = getLinkMetricState(link);

  const enableConversionTracking = async () => {
    if (trackConversion || enabling) return;
    setEnabling(true);
    try {
      const res = await fetch(`/api/links/${link.id}?workspaceId=${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackConversion: true }),
      });
      if (!res.ok) throw new Error(await res.text());
      await mutatePrefix("/api/links");
    } finally {
      setEnabling(false);
    }
  };

  const conversionTooltip = (
    <div className="w-72 p-3 text-sm">
      <div className="font-medium text-neutral-950">Conversion tracking</div>
      <div className="mt-1 text-xs text-neutral-600">
        Enable tracking to see leads and revenue for this link.
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-sm text-neutral-800">Enable</span>
        <Switch
          checked={false}
          loading={enabling}
          fn={(checked) => {
            // Toggle on only (no off from here)
            if (checked) {
              enableConversionTracking().catch((err) =>
                toast.error("Failed to enable conversion tracking."),
              );
            }
          }}
          disabledTooltip={
            canManageLink
              ? undefined
              : "You don't have permission to update this link."
          }
        />
      </div>
    </div>
  );

  const clicksValue = isConversionCallback
    ? "—"
    : nFormatter(clicks, { full: clicks < INFINITY_NUMBER });
  const leadsValue = isConversionCallback
    ? "—"
    : trackConversion
      ? nFormatter(leads, { full: leads < INFINITY_NUMBER })
      : "—";
  const revenueValue = isConversionCallback
    ? "—"
    : trackConversion
      ? currencyFormatter(saleAmount / 100, { currency: currency ?? "EUR" })
      : "—";

  const metricsStripInner = (
    <>
      <Metric
        label="CLK"
        value={clicksValue}
        muted={isConversionCallback || !clicksActive}
        tone="clicks"
        active={!isConversionCallback && clicksActive}
      />
      <div className="h-6 w-px bg-neutral-200/70" />
      <Metric
        label="LEAD"
        value={leadsValue}
        muted={isConversionCallback || !leadsActive}
        tone="leads"
        active={!isConversionCallback && leadsActive}
      />
      <div className="h-6 w-px bg-neutral-200/70" />
      <Metric
        label="REV"
        value={revenueValue}
        muted={isConversionCallback || !revenueActive}
        tone="revenue"
        active={!isConversionCallback && revenueActive}
      />
    </>
  );

  const metricsStrip = isConversionCallback ? (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1 text-[12px] text-neutral-700",
        "border-l border-neutral-200/70",
      )}
    >
      {metricsStripInner}
    </div>
  ) : (
    <a
      href={`/${slug}/analytics?domain=${link.domain}&key=${link.key}`}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "group flex items-center gap-2 px-2 py-1 text-[12px] text-neutral-700",
        "border-l border-neutral-200/70",
        "transition-[box-shadow] hover:ring-1 hover:ring-neutral-200/60",
      )}
    >
      {metricsStripInner}
    </a>
  );

  // If conversion tracking is enabled: no tooltip.
  // If disabled: show tooltip with a toggle to enable conversion tracking.
  return trackConversion ? (
    metricsStrip
  ) : (
    <Tooltip side="top" content={conversionTooltip}>
      {metricsStrip}
    </Tooltip>
  );
}

function LinkMobileMetricsBadges({ link }: { link: ResponseLink }) {
  const { slug, currency } = useWorkspace();
  const isConversionCallback = !!(link as any).isConversionCallback;
  const {
    clicks,
    leads,
    saleAmount,
    trackConversion,
    clicksActive,
    leadsActive,
    revenueActive,
  } = getLinkMetricState(link);

  const clicksValue = isConversionCallback
    ? "—"
    : nFormatter(clicks, { full: clicks < INFINITY_NUMBER });
  const leadsValue = isConversionCallback
    ? "—"
    : trackConversion
      ? nFormatter(leads, { full: leads < INFINITY_NUMBER })
      : "—";
  const revenueValue = isConversionCallback
    ? "—"
    : trackConversion
      ? currencyFormatter(saleAmount / 100, { currency: currency ?? "EUR" })
      : "—";

  const content = (
    <>
      <span
        className={cn(
          "tabular-nums",
          isConversionCallback
            ? "text-neutral-300"
            : clicksActive
              ? "text-neutral-800"
              : "text-neutral-400",
        )}
      >
        {clicksValue}
      </span>
      <span className="text-neutral-300">•</span>
      <span
        className={cn(
          "tabular-nums",
          leadsActive ? "text-neutral-800" : "text-neutral-400",
        )}
      >
        {leadsValue}
      </span>
      <span className="text-neutral-300">•</span>
      <span
        className={cn(
          "tabular-nums",
          revenueActive ? "text-neutral-800" : "text-neutral-400",
        )}
      >
        {revenueValue}
      </span>
    </>
  );

  return isConversionCallback ? (
    <div className="flex items-center gap-1.5 text-[11px] whitespace-nowrap text-neutral-600">
      {content}
    </div>
  ) : (
    <a
      href={`/${slug}/analytics?domain=${link.domain}&key=${link.key}`}
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-1.5 text-[11px] whitespace-nowrap text-neutral-600"
    >
      {content}
    </a>
  );
}

function getLinkMetricState(link: ResponseLink) {
  const clicks = link.clicks || 0;
  const leads = link.leads || 0;
  const saleAmount = link.saleAmount || 0;
  const trackConversion = !!link.trackConversion;

  const clicksActive = clicks > 0;
  const leadsActive = trackConversion && leads > 0;
  const revenueActive = trackConversion && saleAmount > 0;

  return {
    clicks,
    leads,
    saleAmount,
    trackConversion,
    clicksActive,
    leadsActive,
    revenueActive,
  };
}

function Metric({
  label,
  value,
  muted,
  tone,
  active,
}: {
  label: string;
  value: string;
  muted?: boolean;
  tone: "clicks" | "leads" | "revenue";
  active?: boolean;
}) {
  const toneClassName =
    tone === "clicks"
      ? "bg-blue-50 text-blue-800"
      : tone === "revenue"
        ? "bg-emerald-50 text-emerald-800"
        : "bg-amber-50 text-amber-900";

  return (
    <div
      className={cn(
        "flex w-[46px] flex-col rounded px-1.5 py-1",
        active ? toneClassName : "bg-transparent",
      )}
    >
      <span className="text-[7px] font-medium tracking-wide text-neutral-400 uppercase">
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-[12px] leading-4 tabular-nums",
          muted ? "text-neutral-300" : "text-neutral-800",
        )}
      >
        {value}
      </span>
    </div>
  );
}

const Controls = memo(({ link }: { link: ResponseLink }) => {
  const { isSelectMode } = useLinkSelection();
  const { hovered } = useContext(CardList.Card.Context);

  const { openMenuLinkId, setOpenMenuLinkId } = useContext(LinksListContext);
  const openPopover = openMenuLinkId === link.id;
  const setOpenPopover = useCallback(
    (open: boolean) => {
      setOpenMenuLinkId(open ? link.id : null);
    },
    [link.id, setOpenMenuLinkId],
  );

  return (
    <div className={cn(isSelectMode && "hidden sm:block")}>
      <LinkControls
        link={link}
        openPopover={openPopover}
        setOpenPopover={setOpenPopover}
        shortcutsEnabled={openPopover || (hovered && openMenuLinkId === null)}
        className="h-8 w-8 rounded-md border border-neutral-200 bg-white px-0 hover:border-neutral-300"
        iconClassName="size-4 text-neutral-700"
      />
    </div>
  );
});
