import { CardList, CopyButton, Tooltip } from "@dub/ui";
import { cn, linkConstructor } from "@dub/utils";
import {
  memo,
  useCallback,
  useContext,
  useRef,
} from "react";
import { LinkAnalyticsBadge } from "./link-analytics-badge";
import { LinkControls } from "./link-controls";
import { useLinkSelection } from "./link-selection-provider";
import { LinkUtmColumns } from "./link-utm-columns";
import { LinksListContext, ResponseLink } from "./links-container";
import { LinksDisplayContext } from "./links-display-provider";

export function LinkDetailsColumn({ link }: { link: ResponseLink }) {
  const { tags, domain, key } = link;

  const { displayProperties } = useContext(LinksDisplayContext);

  const ref = useRef<HTMLDivElement>(null);

  const shortLink = linkConstructor({ domain, key, pretty: true });
  const fullShortLink = linkConstructor({ domain, key, pretty: false });

  return (
    <div ref={ref} className="flex items-center justify-end gap-2 sm:gap-3">
      {/* Always show UTM columns when present - not controlled by displayProperties */}
      {/* Tags are now included in the UTM column in a second row */}
      <LinkUtmColumns link={link} tags={tags} />
      {/* Copy button - always after UTM columns */}
      <div className="flex shrink-0 items-center">
        <CopyButton
          value={fullShortLink}
          variant="neutral"
          className="p-1"
          withText
        />
      </div>
      <div className="flex lg:min-w-36 lg:justify-end">
        <LinkAnalyticsBadge link={link} />
      </div>
      <Controls link={link} />
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
      />
    </div>
  );
});
