import { useRouterStuff } from "@dub/ui";
import { FilterBars } from "@dub/ui/icons";
import Link from "next/link";

export default function FilterButton({ set }: { set: Record<string, any> }) {
  const { queryParams } = useRouterStuff();

  return (
    <div className="absolute right-1 top-0 flex h-full shrink-0 translate-x-3 items-center justify-center bg-white/90 p-2 opacity-0 backdrop-blur transition-all group-hover:translate-x-0 group-hover:opacity-100">
      <Link
        href={
          queryParams({
            set,
            del: "page",
            getNewPath: true,
          }) as string
        }
        className="app-icon-btn block bg-white p-0.5"
      >
        <span className="sr-only">Filter</span>
        <FilterBars className="size-3.5" />
      </Link>
    </div>
  );
}
