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
        className={cn(
          "group flex h-10 cursor-pointer appearance-none items-center gap-x-2 truncate rounded-full border px-3 text-sm outline-none transition-all",
          "border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400",
          "focus-visible:border-neutral-500 data-[state=open]:border-neutral-500 data-[state=open]:ring-4 data-[state=open]:ring-transparent",
        )}
      >
        <span>{currentGroupBy?.display}</span>
        <ChevronDown className="h-4 w-4" />
      </button>
    </Popover>
  );
}
