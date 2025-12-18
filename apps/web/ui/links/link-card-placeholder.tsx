export default function LinkCardPlaceholder() {
  return (
    <>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-sm">
        {/* Left: mimic LinkCell (logo button + 2-line layout) */}
        <div className="min-w-0 overflow-hidden">
          <div className="flex items-center gap-3 py-1">
            <div className="group relative flex h-9 w-9 shrink-0 items-center justify-center outline-none sm:h-10 sm:w-10">
              <div className="absolute inset-1 shrink-0 rounded-full border border-transparent bg-transparent" />
              <div className="relative">
                <div className="size-6 shrink-0 rounded-full bg-neutral-200 sm:size-7" />
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-tight">
              {/* Line 1 */}
              <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                <div className="h-4 w-40 max-w-[70%] shrink-0 rounded bg-neutral-200" />
                <div className="hidden shrink-0 rounded bg-neutral-200/80 sm:block h-3 w-3" />
                <div className="hidden min-w-0 max-w-[40%] shrink rounded bg-neutral-200 sm:block h-4 w-24" />
              </div>

              {/* Line 2 */}
              <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                <div className="h-3 w-3 shrink-0 rounded bg-neutral-200" />
                <div className="h-3.5 w-56 max-w-[80%] shrink-0 rounded bg-neutral-200" />
                <div className="hidden shrink-0 rounded bg-neutral-200/80 sm:block h-3 w-3" />
                <div className="hidden min-w-0 max-w-[40%] shrink rounded bg-neutral-200 sm:block h-3.5 w-20" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: mimic LinkDetailsColumn (metrics + actions) */}
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          {/* Desktop: UTMs */}
          <div className="hidden items-center gap-3 xl:flex">
            <div className="flex min-w-max">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={idx}
                  className={[
                    "min-w-0 shrink-0 pr-2",
                    "w-[70px] lg:w-[76px] xl:w-[82px] 2xl:w-[96px]",
                    idx !== 0 ? "border-l border-neutral-200/70 pl-2" : "",
                  ].join(" ")}
                >
                  <div className="h-2.5 w-10 rounded bg-neutral-200" />
                  <div className="mt-1 h-3 w-14 rounded bg-neutral-200" />
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: metrics strip */}
          <div className="hidden xl:flex xl:justify-end">
            <div className="flex items-center gap-2 border-l border-neutral-200/70 px-2 py-1">
              <div className="h-8 w-[46px] rounded bg-neutral-200" />
              <div className="h-6 w-px bg-neutral-200/70" />
              <div className="h-8 w-[46px] rounded bg-neutral-200" />
              <div className="h-6 w-px bg-neutral-200/70" />
              <div className="h-8 w-[46px] rounded bg-neutral-200" />
            </div>
          </div>

          {/* Mobile/tablet: compact metrics */}
          <div className="flex xl:hidden">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <div className="h-3.5 w-10 rounded bg-neutral-200" />
              <div className="h-2 w-2 rounded bg-neutral-200/80" />
              <div className="h-3.5 w-10 rounded bg-neutral-200" />
              <div className="h-2 w-2 rounded bg-neutral-200/80" />
              <div className="h-3.5 w-12 rounded bg-neutral-200" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1">
            <div className="h-8 w-8 rounded-md border border-neutral-200 bg-neutral-100/60" />
            <div className="h-8 w-8 rounded-md border border-neutral-200 bg-neutral-100/60" />
          </div>
        </div>
      </div>
    </>
  );
}
