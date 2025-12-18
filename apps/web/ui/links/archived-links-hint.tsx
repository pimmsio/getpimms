import useLinksCount from "@/lib/swr/use-links-count";
import { Tooltip } from "@dub/ui";
import { BoxArchive } from "@dub/ui/icons";
import { pluralize } from "@dub/utils";
import { useSearchParams } from "next/navigation";
import { useContext } from "react";
import { LinksDisplayContext } from "./links-display-provider";
import { AppButton } from "@/ui/components/controls/app-button";

export default function ArchivedLinksHint() {
  const searchParams = useSearchParams();
  const { showArchived } = useContext(LinksDisplayContext);
  // only show the hint if there filters but showArchived is false
  // @ts-ignore – until https://github.com/microsoft/TypeScript/issues/54466 is fixed
  return searchParams.size > 0 && !showArchived && <ArchivedLinksHintHelper />;
}

function ArchivedLinksHintHelper() {
  const { data: count } = useLinksCount<number>();
  const { data: totalCount } = useLinksCount<number>({
    query: { showArchived: true },
  });
  const archivedCount = totalCount - count;

  const { setShowArchived } = useContext(LinksDisplayContext);

  return (
    archivedCount > 0 && (
      <Tooltip
        side="top"
        content={
          <div className="px-3 py-2 text-sm text-neutral-500">
            <div className="flex items-center gap-4">
              <span>
                You have{" "}
                <span className="font-medium text-neutral-950">
                  {archivedCount}
                </span>{" "}
                archived {pluralize("link", archivedCount)} that match
                {archivedCount === 1 && "es"} the applied filters
              </span>
              <div>
                <AppButton
                  size="sm"
                  variant="secondary"
                  className="h-6 px-2 text-xs"
                  onClick={() => setShowArchived(true)}
                >
                  Show archived links
                </AppButton>
              </div>
            </div>
          </div>
        }
      >
        <div className="flex cursor-default items-center gap-1.5 rounded border border-neutral-200 bg-white px-2 py-0.5 text-sm font-medium text-neutral-950 transition-[box-shadow,border-color] hover:border-neutral-300">
          <BoxArchive className="h-3 w-3" />
          {archivedCount}
        </div>
      </Tooltip>
    )
  );
}
