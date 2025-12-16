import useFolder from "@/lib/swr/use-folder";
import useWorkspace from "@/lib/swr/use-workspace";
import {
  CardList,
  ExpandingArrow,
  useIntersectionObserver,
  useMediaQuery,
} from "@dub/ui";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  Dispatch,
  memo,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { LinkAnalyticsBadge } from "./link-analytics-badge";
import { LinkDetailsColumn } from "./link-details-column";
import { LinkTests } from "./link-tests";
import { LinkUtmColumns } from "./link-utm-columns";
import { LinkCell } from "../shared/link-cell";
import { ResponseLink } from "./links-container";
import Link from "next/link";
import { FolderIcon } from "../folders/folder-icon";

type UtmKey = "utm_source" | "utm_medium" | "utm_campaign" | "utm_term" | "utm_content";
type UtmVisibility = {
  visibleUtmKeys: UtmKey[];
  showTagsColumn: boolean;
};

export const LinkCardContext = createContext<{
  showTests: boolean;
  setShowTests: Dispatch<SetStateAction<boolean>>;
} | null>(null);

export function useLinkCardContext() {
  const context = useContext(LinkCardContext);
  if (!context)
    throw new Error("useLinkCardContext must be used within a LinkCard");
  return context;
}

export const LinkCard = memo(
  ({
    link,
    utmVisibility,
  }: {
    link: ResponseLink;
    utmVisibility?: UtmVisibility;
  }) => {
  const [showTests, setShowTests] = useState(false);
  return (
    <LinkCardContext.Provider value={{ showTests, setShowTests }}>
      <LinkCardInner link={link} utmVisibility={utmVisibility} />
    </LinkCardContext.Provider>
  );
});

const LinkCardInner = memo(
  ({
    link,
    utmVisibility,
  }: {
    link: ResponseLink;
    utmVisibility?: UtmVisibility;
  }) => {
  const { isMobile } = useMediaQuery();
  const ref = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { slug, defaultFolderId } = useWorkspace();

  const entry = useIntersectionObserver(ref);
  const isInView = entry?.isIntersecting;

  const { folder } = useFolder({
    folderId: link.folderId,
    enabled: isInView,
  });

  const editUrl = useMemo(
    () => `/${slug}/links/${link.domain}/${link.key}`,
    [slug, link.domain, link.key],
  );

  useEffect(() => {
    if (isInView) router.prefetch(editUrl);
  }, [isInView, editUrl]);

  return (
    <>
      <CardList.Card
        key={link.id}
        onClick={!isMobile ? () => router.push(editUrl) : undefined}
        outerClassName="overflow-hidden transition-all duration-200"
        innerClassName="p-0"
        {...(link.folderId &&
          ![defaultFolderId, searchParams.get("folderId")].includes(
            link.folderId,
          ) && {
            banner: (
              <Link
                href={`/${slug}/links?folderId=${folder?.id}`}
                className="group flex items-center justify-between gap-2 rounded-t-xl border-b border-neutral-100 bg-neutral-50 px-5 py-2 text-xs transition-colors hover:bg-neutral-100"
              >
                <div className="flex items-center gap-1.5">
                  {folder ? (
                    <FolderIcon
                      folder={folder}
                      shape="square"
                      className="rounded"
                      innerClassName="p-0.5"
                      iconClassName="size-3"
                    />
                  ) : (
                    <div className="size-4 rounded bg-neutral-200" />
                  )}
                  {folder ? (
                    <span className="font-medium text-neutral-900">
                      {folder.name}
                    </span>
                  ) : (
                    <div className="h-4 w-20 rounded bg-neutral-200" />
                  )}
                  <ExpandingArrow className="invisible -ml-1.5 size-3.5 text-neutral-500 group-hover:visible" />
                </div>
                <p className="text-neutral-500 underline transition-colors group-hover:text-neutral-800">
                  Open folder
                </p>
              </Link>
            ),
          })}
      >
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 overflow-hidden px-2 py-1.5 text-sm sm:px-5 sm:py-3">
          <div ref={ref} className="min-w-0 overflow-hidden">
            <LinkCell
              link={link}
              variant="links-page"
              showCopyButton={false}
              showBadges={true}
              className="min-w-0 max-w-full"
            />

            {/* Responsive priority: Part 1 first, then UTMs row, then Analytics row (until xl) */}
            <div className="mt-2 hidden min-w-0 flex-col gap-2 xl:hidden">
              {(utmVisibility?.visibleUtmKeys?.length || utmVisibility?.showTagsColumn) ? (
                <div className="w-full overflow-x-auto">
                  <LinkUtmColumns
                    link={link}
                    tags={link.tags}
                    visibleUtmKeys={utmVisibility?.visibleUtmKeys}
                    showTagsColumn={utmVisibility?.showTagsColumn}
                  />
                </div>
              ) : null}
              <div className="flex min-w-0 justify-end">
                <LinkAnalyticsBadge link={link} />
              </div>
            </div>
          </div>
          <div className="shrink-0">
            <LinkDetailsColumn link={link} utmVisibility={utmVisibility} />
          </div>
        </div>
        <LinkTests link={link} />
      </CardList.Card>
    </>
  );
});
