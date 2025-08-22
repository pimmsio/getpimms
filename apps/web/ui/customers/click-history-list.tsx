import { LinkLogo } from "@dub/ui";
import { CursorRays } from "@dub/ui/icons";
import { formatDateTimeSmart, getApexDomain, getPrettyUrl } from "@dub/utils";
import Link from "next/link";
import { useParams } from "next/navigation";

interface ClickHistoryEvent {
  event: "click";
  timestamp: string;
  click: {
    id: string;
    ip: string;
    url: string;
    referer: string;
    refererUrl: string;
    country: string;
    city: string;
    device: string;
    browser: string;
    os: string;
  };
  link: {
    id: string;
    domain: string;
    key: string;
    shortLink: string;
    url: string;
  };
}

interface ClickHistoryData {
  customer: { id: string; name: string };
  anonymousId: string | null;
  totalClicks: number;
  clickHistory: ClickHistoryEvent[];
}

export function ClickHistoryList({
  clickHistory,
  isLoading,
}: {
  clickHistory?: ClickHistoryData;
  isLoading: boolean;
}) {
  const { slug } = useParams();

  return isLoading ? (
    <div className="flex h-32 w-full animate-pulse rounded border border-transparent bg-neutral-100" />
  ) : !clickHistory?.clickHistory?.length ? (
    <div className="text-sm text-neutral-500">
      {clickHistory?.anonymousId 
        ? `No click history found for anonymous ID: ${clickHistory.anonymousId}` 
        : "No anonymous ID found - unable to retrieve click history"}
    </div>
  ) : (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-600">
          Total clicks: <strong>{clickHistory.totalClicks}</strong>
        </span>
      </div>
      
      <ul className="flex flex-col gap-5 text-sm">
        {clickHistory.clickHistory.map((event, index, events) => {
          const isLast = index === events.length - 1;
          const referer = !event.click?.referer || event.click.referer === "(direct)"
            ? "direct"
            : event.click.referer;

          return (
            <li key={index} className="flex items-start gap-2">
              <div className="relative mr-3 flex-shrink-0">
                <CursorRays className="mt-0.5 size-4 text-blue-500" />
                {!isLast && (
                  <div className="absolute left-1/2 mt-2 h-8 border-l border-neutral-300 lg:h-3" />
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-x-4 gap-y-1 whitespace-nowrap text-sm text-neutral-800 lg:grow lg:flex-row lg:justify-between">
                <div className="truncate">
                  <span className="flex items-center gap-1.5 [&>*]:min-w-0 [&>*]:truncate">
                    Visited{" "}
                    <Link
                      href={`/${slug}/links/${getPrettyUrl(event.link.shortLink)}`}
                      target="_blank"
                      className="flex items-center gap-2 rounded bg-neutral-100 px-1.5 py-1 font-mono text-xs leading-none transition-colors hover:bg-neutral-200/80"
                    >
                      <LinkLogo
                        className="size-3 shrink-0 sm:size-3"
                        apexDomain={getApexDomain(event.click.url)}
                      />
                      <span className="min-w-0 truncate">
                        {getPrettyUrl(event.link.shortLink)}
                      </span>
                    </Link>
                    via
                    <span className="flex items-center gap-2 rounded bg-blue-50 px-1.5 py-1 font-mono text-xs leading-none">
                      <LinkLogo
                        className="size-3 shrink-0 sm:size-3"
                        apexDomain={referer === "direct" ? undefined : referer}
                      />
                      <span className="min-w-0 truncate">{referer}</span>
                    </span>
                    <span className="text-xs text-neutral-400">
                      ({event.click.ip || "unknown"})
                    </span>
                    <span className="text-xs text-neutral-400">
                      {event.click.device} • {event.click.browser}
                    </span>
                  </span>
                </div>
                <span className="shrink-0 truncate text-sm text-neutral-500">
                  {formatDateTimeSmart(event.timestamp)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
