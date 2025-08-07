import { LinkProps } from "@/lib/types";
import { CopyButton, LinkLogo } from "@dub/ui";
import { ArrowTurnRight2 } from "@dub/ui/icons";
import { getApexDomain, getPrettyUrl, linkConstructor } from "@dub/utils";
import { CommentsBadge } from "../links/comments-badge";

export default function LinkPreviewTooltip({ data }: { data: LinkProps }) {
  const { domain, key, url, comments } = data;

  return (
    <div 
      className="relative flex w-80 items-center gap-x-2 px-3 py-2.5 bg-white rounded shadow-xl border-0"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative flex-none rounded-full border border-neutral-100 bg-gradient-to-t from-neutral-100 pr-0.5 sm:p-2">
        <LinkLogo
          apexDomain={getApexDomain(url)}
          className="h-4 w-4 shrink-0 transition-[width,height] sm:h-6 sm:w-6 group-data-[variant=loose]/card-list:sm:h-5 group-data-[variant=loose]/card-list:sm:w-5"
        />
      </div>
      <div>
        <div className="min-w-0 shrink grow-0 text-neutral-950">
          <div className="flex items-center gap-2">
            <a
              href={linkConstructor({ domain, key })}
              target="_blank"
              rel="noopener noreferrer"
              title={linkConstructor({ domain, key, pretty: true })}
              className="truncate text-sm font-semibold leading-6 text-neutral-800 transition-colors hover:text-black"
              onClick={(e) => e.stopPropagation()}
            >
              {linkConstructor({ domain, key, pretty: true })}
            </a>
            <CopyButton
              value={linkConstructor({
                domain,
                key,
                pretty: false,
              })}
              variant="neutral"
              className="p-1.5"
            />
            {comments && <CommentsBadge comments={comments} />}
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-1 text-sm">
          <ArrowTurnRight2 className="h-3 w-3 shrink-0 text-neutral-400" />
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title={url}
              className="max-w-[20rem] truncate text-neutral-500 transition-colors hover:text-neutral-700 hover:underline hover:underline-offset-2"
              onClick={(e) => e.stopPropagation()}
            >
              {getPrettyUrl(url)}
            </a>
          ) : (
            <span className="truncate text-neutral-400">No URL configured</span>
          )}
        </div>
        
        {/* Links section */}
        {(data.ios || data.android) && (
          <div className="mt-2 pt-2 border-t border-gray-100/80">
            <div className="space-y-1.5">
              {/* iOS deeplink */}
              {data.ios && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">iOS</span>
                  <a
                    href={data.ios}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 underline max-w-32 truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {data.ios.length > 25 ? `${data.ios.substring(0, 25)}...` : data.ios}
                  </a>
                </div>
              )}
              
              {/* Android deeplink */}
              {data.android && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Android</span>
                  <a
                    href={data.android}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 underline max-w-32 truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {data.android.length > 25 ? `${data.android.substring(0, 25)}...` : data.android}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
