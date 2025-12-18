import useWorkspace from "@/lib/swr/use-workspace";
import { AppButton } from "@/ui/components/controls/app-button";
import { Download, TooltipContent } from "@dub/ui";
import { useContext } from "react";
import { toast } from "sonner";
import { EventsContext } from "./events-provider";

export default function ExportButton({ onClick }: { onClick?: () => void }) {
  const { exportQueryString } = useContext(EventsContext);
  const { slug, plan } = useWorkspace();

  const needsHigherPlan =
    plan === "free" || plan === "starter" || plan === "pro";

  async function exportData() {
    const response = await fetch(`/api/events/export?${exportQueryString}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PIMMS Events Export - ${new Date().toISOString()}.csv`;
    a.click();
  }

  return (
    <div>
      <AppButton
        type="button"
        variant="secondary"
        size="sm"
        className="w-full justify-start"
        onClick={() => {
          toast.promise(exportData(), {
            loading: "Exporting file...",
            success: "Exported successfully",
            error: (error) => error,
          });
          onClick?.();
        }}
      >
        <Download className="mr-2 h-4 w-4 shrink-0 text-neutral-500" />
        Download as CSV
      </AppButton>
      {needsHigherPlan ? (
        <div className="mt-2">
          <TooltipContent
            title="Upgrade to our Business Plan to enable CSV downloads for events in your workspace."
            cta="Upgrade to Business"
            href={`/${slug}/upgrade`}
          />
        </div>
      ) : null}
    </div>
  );
}
