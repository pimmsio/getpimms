import { EventType } from "@/lib/analytics/types";
import {
  Button,
  Modal,
  Popover,
  TabSelect,
  ToggleGroup,
  useMediaQuery,
} from "@dub/ui";
import { cn } from "@dub/utils";
import { ChevronsUpDown } from "lucide-react";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from "react";
import { AnalyticsContext } from "./analytics-provider";

const EVENT_LABELS = {
  sales: "Sales",
  leads: "Leads",
  clicks: "Clicks",
};

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
}) {
  const { selectedTab: event } = useContext(AnalyticsContext);

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
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 bg-gradient-to-r from-neutral-50 to-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-50 shadow-sm">
              <SelectedTabIcon className="h-5 w-5 text-neutral-700" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-neutral-900">{selectedTab?.label}</h1>
              <p className="text-xs text-neutral-500">All results</p>
            </div>
          </div>
          <div className="rounded-full bg-neutral-900 px-3 py-1.5">
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
          "group relative z-0 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md flex flex-col",
          className || "h-[440px]",
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-50">
              <SelectedTabIcon className="h-4 w-4 text-neutral-700" />
            </div>
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
      className="flex w-full flex-wrap rounded-none border-x-0 border-t-0 border-neutral-100 bg-neutral-50 px-6 py-2.5 sm:flex-nowrap"
      optionClassName="text-xs px-2 font-normal hover:text-neutral-700"
      indicatorClassName="border-0 bg-neutral-200 rounded"
    />
  );
}
