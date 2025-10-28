import { linksGroupByOptions } from "@/lib/links/links-display";
import { Popover, useRouterStuff } from "@dub/ui";
import { cn } from "@dub/utils";
import { Check, ChevronDown } from "lucide-react";
import { useContext, useState } from "react";
import { LinksDisplayContext } from "./links-display-provider";

export default function LinkGroupBy() {
  const { groupBy, setGroupBy } = useContext(LinksDisplayContext);
  const { queryParams } = useRouterStuff();
  const [openPopover, setOpenPopover] = useState(false);

  const currentGroupBy = linksGroupByOptions.find(
    ({ slug }) => slug === groupBy,
  );

  return (
    <Popover
      content={
        <div className="w-full p-2 md:w-48">
          {linksGroupByOptions.map(({ display, slug }) => (
            <button
              key={display}
              onClick={() => {
                setGroupBy(slug);
                queryParams({
                  set: {
                    ...(slug ? { groupBy: slug } : {}),
                  },
                  del: slug ? [] : ["groupBy"],
                });
                setOpenPopover(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                slug === groupBy
                  ? "bg-neutral-100 text-neutral-950"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950",
              )}
            >
              <span>{display}</span>
              {slug === groupBy && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      }
      align="end"
      openPopover={openPopover}
      setOpenPopover={setOpenPopover}
    >
      <button
        onClick={() => setOpenPopover(!openPopover)}
        className="flex items-center gap-2 rounded border border-transparent bg-transparent px-1 py-1 text-sm text-neutral-600 transition-colors hover:text-neutral-950"
      >
        <span>{currentGroupBy?.display}</span>
        <ChevronDown className="h-4 w-4" />
      </button>
    </Popover>
  );
}

