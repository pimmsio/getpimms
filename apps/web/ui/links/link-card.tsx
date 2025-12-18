import useWorkspace from "@/lib/swr/use-workspace";
import { useIntersectionObserver, useMediaQuery } from "@dub/ui";
import { useRouter } from "next/navigation";
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

export const LinkRow = memo(
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

  const router = useRouter();
  const { slug } = useWorkspace();

  const entry = useIntersectionObserver(ref);
  const isInView = entry?.isIntersecting;

  const editUrl = useMemo(
    () => `/${slug}/links/${link.domain}/${link.key}`,
    [slug, link.domain, link.key],
  );

  useEffect(() => {
    if (isInView) router.prefetch(editUrl);
  }, [isInView, editUrl]);

  const handleRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    if (e.defaultPrevented) return;

    const target = e.target as HTMLElement | null;
    // If the click originated from an interactive element, let that element handle it.
    if (
      target?.closest(
        [
          "a",
          "button",
          "input",
          "textarea",
          "select",
          "option",
          '[role="button"]',
          '[role="link"]',
          '[role="menuitem"]',
          '[role="checkbox"]',
          '[data-row-click="ignore"]',
        ].join(","),
      )
    ) {
      return;
    }

    router.push(editUrl);
  };

  return (
    <>
      <div
        key={link.id}
        role="row"
        className="group"
        onClick={handleRowClick}
      >
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-md px-2 py-2 text-sm transition-[box-shadow] group-hover:ring-1 group-hover:ring-neutral-200/60 sm:px-5 sm:py-3">
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
      </div>
    </>
  );
});
