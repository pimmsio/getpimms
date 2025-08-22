import { CursorRays, MoneyBill2, UserCheck } from "@dub/ui/icons";
import { formatDateTimeSmart, getPrettyUrl } from "@dub/utils";
import Link from "next/link";
import { useParams } from "next/navigation";

interface UnifiedEvent {
  type: "conversion" | "click";
  timestamp: string;
  eventName?: string;
  event?: string; // lead/sale for conversions
  link?: {
    shortLink: string;
    domain: string;
    key: string;
    url: string;
  };
  click?: {
    referer: string;
    ip: string;
    device: string;
    browser: string;
    url: string;
  };
}

interface UnifiedActivityListProps {
  customerActivity?: any;
  clickHistory?: any;
  isLoading: boolean;
}

export function UnifiedActivityList({
  customerActivity,
  clickHistory,
  isLoading,
}: UnifiedActivityListProps) {
  const { slug } = useParams();

  if (isLoading) {
    return (
      <div className="flex h-32 w-full animate-pulse rounded border border-transparent bg-neutral-100" />
    );
  }

  // Merge and sort all events chronologically
  const allEvents: UnifiedEvent[] = [];

  // Add conversion events (leads/sales ONLY - exclude clicks)
  if (customerActivity?.events) {
    customerActivity.events.forEach((event: any) => {
      // Only add actual conversions (leads and sales), not clicks
      if (event.event === "lead" || event.event === "sale") {
        allEvents.push({
          type: "conversion",
          timestamp: event.timestamp,
          eventName: event.eventName,
          event: event.event,
          link: event.link,
        });
      }
    });
  }

  // Add click events
  if (clickHistory?.clickHistory) {
    clickHistory.clickHistory.forEach((event: any) => {
      allEvents.push({
        type: "click",
        timestamp: event.timestamp,
        link: event.link,
        click: event.click,
      });
    });
  }

  // Sort by timestamp (most recent first)
  allEvents.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  if (allEvents.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-neutral-500">
        No activity found
      </div>
    );
  }

  const conversions = allEvents.filter((e) => e.type === "conversion");
  const clicks = allEvents.filter((e) => e.type === "click");

  return (
    <div className="space-y-6">
      {conversions.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            Conversions
          </h3>
          <div className="space-y-2">
            {conversions.map((event, index) => (
              <div
                key={`conversion-${index}`}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 ring-1 ring-inset ring-green-100"
              >
                <div className="flex-shrink-0">
                  {event.event === "sale" ? (
                    <MoneyBill2 className="size-4 text-green-600" />
                  ) : (
                    <UserCheck className="size-4 text-blue-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-bold text-neutral-900">
                        {event.eventName || event.event}
                      </span>
                      {event.event === "sale" && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                          Sale
                        </span>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-xs text-neutral-500">
                      {formatDateTimeSmart(event.timestamp)}
                    </span>
                  </div>
                  {event.link && (
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-xs text-neutral-500">via</span>
                      <Link
                        href={`/${slug}/links/${getPrettyUrl(event.link.shortLink)}`}
                        target="_blank"
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {getPrettyUrl(event.link.shortLink)}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clicks section (simplified) */}
      {clicks.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            Recent Clicks ({Math.min(5, clicks.length)}
            {clicks.length > 5 ? `/${clicks.length}` : ""})
          </h3>
          <div className="space-y-1">
            {clicks.slice(0, 5).map((event, index) => {
              const referer =
                !event.click?.referer || event.click.referer === "(direct)"
                  ? "direct"
                  : event.click.referer;

              return (
                <div
                  key={`click-${index}`}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 transition-colors hover:bg-neutral-50"
                >
                  <CursorRays className="size-3 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex min-w-0 items-center gap-2">
                        <Link
                          href={`/${slug}/links/${getPrettyUrl(event.link!.shortLink)}`}
                          target="_blank"
                          className="truncate text-sm font-medium text-neutral-900 hover:text-blue-600 hover:underline"
                        >
                          {getPrettyUrl(event.link!.shortLink)}
                        </Link>
                        <span className="text-xs text-neutral-400">via {referer}</span>
                      </div>
                      <span className="flex-shrink-0 text-xs text-neutral-500">
                        {formatDateTimeSmart(event.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {clicks.length > 5 && (
            <div className="pt-2 text-center">
              <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
                Show {clicks.length - 5} more clicks →
              </button>
            </div>
          )}
        </div>
      )}

      {allEvents.length === 0 && (
        <div className="py-8 text-center text-neutral-500">
          No activity found
        </div>
      )}
    </div>
  );
}
