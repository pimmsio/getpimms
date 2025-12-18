import { Popover } from "@dub/ui";
import { cn } from "@dub/utils";
import { useState } from "react";
import { ThreeDots } from "../shared/icons";
import ExportButton from "./export-button";
import { AppIconButton } from "@/ui/components/controls/app-icon-button";

export default function AnalyticsOptions() {
  const [openPopover, setOpenPopover] = useState(false);

  return (
    <Popover
      align="end"
      content={
        <div className="grid w-screen gap-px p-2 sm:w-48">
          <ExportButton setOpenPopover={setOpenPopover} />
        </div>
      }
      openPopover={openPopover}
      setOpenPopover={setOpenPopover}
    >
      <AppIconButton type="button" onClick={() => setOpenPopover(!openPopover)} className="h-10 w-10">
        <ThreeDots className="h-5 w-5 text-neutral-500" />
      </AppIconButton>
    </Popover>
  );
}
