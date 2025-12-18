import { Popover } from "@dub/ui";
import { useContext, useState } from "react";
import { ThreeDots } from "../../shared/icons";
import { EventsContext } from "./events-provider";
import ExportButton from "./export-button";
import { AppIconButton } from "@/ui/components/controls/app-icon-button";

export default function EventsOptions() {
  const [openPopover, setOpenPopover] = useState(false);
  const { exportQueryString } = useContext(EventsContext);

  return (
    <Popover
      align="end"
      content={
        <div className="grid w-screen gap-px p-2 sm:w-48">
          <ExportButton onClick={() => setOpenPopover(false)} />
        </div>
      }
      openPopover={openPopover}
      setOpenPopover={setOpenPopover}
    >
      <AppIconButton
        onClick={() => setOpenPopover(!openPopover)}
        className="h-9 w-9"
        disabled={!exportQueryString}
      >
        <ThreeDots className="h-5 w-5 text-neutral-500" />
      </AppIconButton>
    </Popover>
  );
}
