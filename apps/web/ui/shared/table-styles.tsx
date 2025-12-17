export const TABLE_HEADER_CLASS = "bg-neutral-50 px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-500";
export const TABLE_LINK_HEADER_CLASS = "bg-neutral-50 px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-500 md:sticky md:left-0 md:z-10 min-w-[450px] w-[450px]";
export const TABLE_LINK_CELL_CLASS = "bg-white px-2 py-1.5 text-sm sm:px-5 sm:py-3 md:sticky md:left-0 md:z-10 min-w-[450px] w-[450px]";
export const TABLE_UTM_CELL_CLASS = "px-3 py-1.5 sm:py-3";
export const TABLE_CONTAINER_CLASS = "overflow-x-auto rounded-xl border border-neutral-200 bg-white";
export const TABLE_CLASS = "min-w-full divide-y divide-neutral-200";

export function StickyColumnStyles({ tableClass }: { tableClass: string }) {
  return (
    <style jsx global>{`
      @media (min-width: 768px) {
        .${tableClass} td:first-child,
        .${tableClass} th:first-child {
          position: sticky !important;
          left: 0 !important;
          z-index: 20 !important;
        }
        .${tableClass} td:first-child {
          background: white !important;
          border-right: 1px solid #e5e7eb !important;
        }
        .${tableClass} th:first-child {
          background: #f9fafb !important;
          z-index: 21 !important;
        }
      }
      .${tableClass} tbody {
        background: white;
      }
      .${tableClass} tbody tr {
        border-bottom: 1px solid #e5e7eb;
      }
      .${tableClass} tbody tr:hover {
        background-color: rgba(0, 0, 0, 0.02);
      }
    `}</style>
  );
}
