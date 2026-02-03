import { EventType } from "@/lib/analytics/types";
import {
  Modal,
  Popover,
  TabSelect,
  ToggleGroup,
  useMediaQuery,
} from "@dub/ui";
import { cn } from "@dub/utils";
import { ChevronsUpDown, GripVertical } from "lucide-react";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from "react";
import { AnalyticsContext } from "./analytics-provider";
import { card } from "../design/tokens";

const EVENT_LABELS = {
  sales: "Revenue",
  leads: "Contacts",
  clicks: "Clicks",
};

// When Analytics is rendered inside the main app shell, PageContent already owns the surface.
// In that case, avoid wrapping each widget in its own card (no nested surfaces).
const AnalyticsCanvasContext = createContext(false);
export function AnalyticsCanvasProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return (
    <AnalyticsCanvasContext.Provider value={enabled}>
      {children}
    </AnalyticsCanvasContext.Provider>
  );
}

export function AnalyticsCard<T extends string>({
  tabs,
  selectedTabId,
  onSelectTab,
  subTabs,
  selectedSubTabId,
  onSelectSubTab,
  expandLimit,
  hasMore,
  children,
  className,
  headerActions,
  dragHandleProps,
}: {
  tabs: { id: T; label: string; icon: React.ElementType }[];
  selectedTabId: T;
  onSelectTab?: Dispatch<SetStateAction<T>> | ((tabId: T) => void);
  subTabs?: { id: string; label: string }[];
  selectedSubTabId?: string;
  onSelectSubTab?:
    | Dispatch<SetStateAction<string>>
    | ((subTabId: string) => void);
  expandLimit: number;
  hasMore?: boolean;
  children: (props: {
    limit?: number;
    event?: EventType;
    setShowModal: (show: boolean, section?: string) => void;
    isModal?: boolean;
    modalSection?: string;
  }) => ReactNode;
  className?: string;
  headerActions?: ReactNode;
  dragHandleProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  const { selectedTab: event } = useContext(AnalyticsContext);
  const embedded = useContext(AnalyticsCanvasContext);

  const [showModal, setShowModal] = useState(false);
  const [modalSection, setModalSection] = useState<string | undefined>();
  const [isOpen, setIsOpen] = useState(false);

  const selectedTab = tabs.find(({ id }) => id === selectedTabId) || tabs[0];
  const SelectedTabIcon = selectedTab.icon;
  const { isMobile } = useMediaQuery();

  const handleSetShowModal = (show: boolean, section?: string) => {
    setShowModal(show);
    setModalSection(section);
  };

  return (
    <>
      <Modal
        showModal={showModal}
        setShowModal={setShowModal}
        className="max-w-2xl px-0"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-base font-semibold text-neutral-900">
                {selectedTab?.label}
              </div>
              <p className="text-xs text-neutral-500">All results</p>
            </div>
          </div>
          <div className="rounded-md bg-neutral-900 px-3 py-1.5">
            <p className="text-xs font-semibold text-white">{EVENT_LABELS[event]}</p>
          </div>
        </div>
        {subTabs && selectedSubTabId && onSelectSubTab && (
          <SubTabs
            subTabs={subTabs}
            selectedTab={selectedSubTabId}
            onSelectTab={onSelectSubTab}
          />
        )}
        <div className="flex max-h-[70vh] flex-col overflow-auto">
          {children({ setShowModal: handleSetShowModal, event, isModal: true, modalSection })}
        </div>
      </Modal>
      <div
        className={cn(
          "group relative z-0 flex flex-col overflow-hidden",
          !embedded && card.base,
          embedded && "bg-transparent",
          className || "h-[440px]",
        )}
      >
        <div
          className={cn(
            "flex flex-shrink-0 items-center justify-between",
            !embedded && card.header,
            embedded && "px-4 py-3",
            embedded && "border-b border-neutral-100",
          )}
        >
          <div className="flex items-center gap-2">
            {dragHandleProps && (
              <button
                type="button"
                aria-label="Reorder card"
                className="cursor-grab opacity-0 text-neutral-400 transition-colors hover:text-neutral-700 active:cursor-grabbing group-hover:opacity-100"
                {...dragHandleProps}
              >
                <GripVertical className="h-4 w-4" />
              </button>
            )}
            <h3 className="text-sm font-semibold text-neutral-900">
              {selectedTab.label}
            </h3>
          </div>

          {headerActions && (
            <div className="flex items-center gap-2">
              {headerActions}
            </div>
          )}
        </div>
        {subTabs && selectedSubTabId && onSelectSubTab && (
          <SubTabs
            subTabs={subTabs}
            selectedTab={selectedSubTabId}
            onSelectTab={onSelectSubTab}
          />
        )}
        <div className="flex-1 overflow-auto">
          {children({
            limit: expandLimit,
            event,
            setShowModal: handleSetShowModal,
            isModal: false,
          })}
        </div>
      </div>
    </>
  );
}

function SubTabs({
  subTabs,
  selectedTab,
  onSelectTab,
}: {
  subTabs: { id: string; label: string }[];
  selectedTab: string;
  onSelectTab: (key: string) => void;
}) {
  return (
    <ToggleGroup
      key={JSON.stringify(subTabs)}
      options={subTabs.map(({ id, label }) => ({
        value: id,
        label: label,
      }))}
      selected={selectedTab}
      selectAction={(period) => onSelectTab(period)}
      className="flex w-full flex-wrap rounded-none border-x-0 border-t-0 border-neutral-100 bg-white px-6 py-2.5 sm:flex-nowrap"
      optionClassName="text-xs px-2 font-normal hover:text-neutral-700"
      indicatorClassName="border-0 bg-neutral-200 rounded"
    />
  );
}
