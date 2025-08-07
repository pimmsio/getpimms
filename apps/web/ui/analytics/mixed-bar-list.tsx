"use client";

import { LinkProps } from "@/lib/types";
import { Tooltip, useMediaQuery } from "@dub/ui";
import { cn, getPrettyUrl } from "@dub/utils";
import NumberFlow from "@number-flow/react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import Link from "next/link";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useMemo,
  useState,
} from "react";

export default function MixedBarList({
  tab,
  data,
  setShowModal,
  limit,
}: {
  tab: string;
  data: {
    icon: ReactNode;
    title: string;
    href?: string;
    clicks: number;
    leads: number;
    sales: number;
    saleAmount: number;
    linkId?: string;
  }[];
  setShowModal: Dispatch<SetStateAction<boolean>>;
  limit?: number;
}) {
  const [search, setSearch] = useState("");
  
  const { isMobile } = useMediaQuery();

  const filteredData = useMemo(() => {
    if (!search) return data;
    return data.filter((item) =>
      item.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const maxClicks = Math.max(...filteredData.map((d) => d.clicks));
  const maxLeads = Math.max(...filteredData.map((d) => d.leads));
  const maxSales = Math.max(...filteredData.map((d) => d.saleAmount));

  const bars = useMemo(() => {
    const shouldShowSearchBar = data.length > 10;

    const itemData = {
      data: filteredData,
      maxClicks,
      maxLeads, 
      maxSales,
      tab,
      setShowModal,
      limit,
    };

    return (
      <div className={limit ? "h-full" : "flex flex-col h-full"}>
        {shouldShowSearchBar && !limit && (
          <div className="relative px-5 py-4 border-b border-gray-200/60 bg-gradient-to-r from-gray-50/60 via-white to-gray-50/30">
            <div className="pointer-events-none absolute inset-y-0 left-8 flex items-center">
              <Search className="h-4 w-4 text-neutral-400 transition-colors duration-200" />
            </div>
            <input
              type="text"
              placeholder={`Search ${tab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200/60 bg-white/80 backdrop-blur-sm py-3 pl-10 pr-4 text-sm font-medium transition-all duration-300 ease-out placeholder:text-neutral-400 placeholder:font-normal focus:border-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:shadow-lg focus:bg-white hover:border-gray-300/70 hover:shadow-md hover:bg-white/90"
              style={{
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.7)'
              }}
            />
          </div>
        )}
        <div className={limit ? "h-full" : "flex-1 min-h-0"}>
          {filteredData.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-neutral-500">
              No results found
            </div>
          ) : limit ? (
            // Card view - show limited items without scrolling
            filteredData
              .slice(0, limit)
              .map((item, index) => (
                <MixedLineItem key={item.title} {...item} {...itemData} />
              ))
          ) : (
            // Modal view - simple scrollable list (no virtualization to avoid glitches)
            <div 
              className="overflow-auto"
              style={{ 
                height: '400px',
                maxHeight: '60vh'
              }}
            >
              {filteredData.map((item, index) => (
                <MixedLineItem key={item.title} {...item} {...itemData} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }, [data, filteredData, search, maxClicks, maxLeads, maxSales, tab, setShowModal, limit, isMobile]);

  if (filteredData.length === 0 && !search) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-neutral-500">
        No data available
      </div>
    );
  }

  return (
    <>
      <div className={limit ? "overflow-hidden" : "h-[50vh] overflow-auto pb-4 md:h-[40vh]"}>{bars}</div>
    </>
  );
}



export function MixedLineItem({
  icon,
  title,
  href,
  clicks,
  leads,
  sales,
  saleAmount,
  maxClicks,
  maxLeads,
  maxSales,
  tab,
  setShowModal,
  linkData,
  limit,
}: {
  icon: ReactNode;
  title: string;
  href?: string;
  clicks: number;
  leads: number;
  sales: number;
  saleAmount: number;
  maxClicks: number;
  maxLeads: number;
  maxSales: number;
  tab: string;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  linkData?: LinkProps;
  limit?: number;
}) {
  const lineItem = useMemo(() => {
    return (
      <div className="z-10 flex items-center space-x-3 overflow-hidden pl-2.5">
        <div className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
          {icon}
        </div>
        <div className="truncate text-sm font-medium text-neutral-800 group-hover:text-neutral-900 transition-colors duration-200">
          {getPrettyUrl(title)}
        </div>
      </div>
    );
  }, [icon, title]);

  const As = href ? Link : "div";

  // Bar calculations with proper scaling (same logic as main chart)
  const clicksWidth = maxClicks > 0 ? Math.min((clicks / maxClicks) * 40, 40) : 0;
  
  // Use saleAmount (revenue) for scaling, not sales count - same as main chart
  const leadsWidth = maxLeads > 0 ? Math.max((leads / maxLeads) * 30, 5) : 0;
  const salesWidth = saleAmount > 0 && maxSales > 0 ? Math.max((saleAmount / maxSales) * 25, 4) : 0;
  
  // Calculate conversion rates for tooltip
  const clickToLeadRate = clicks > 0 ? (leads / clicks) * 100 : 0;
  const leadToSaleRate = leads > 0 ? (sales / leads) * 100 : 0;

  // Check if we're in modal view
  const isModalView = !limit;

  return (
    // @ts-ignore - we know if it's a Link it'll get its href
    <As
      {...(href && {
        href,
        scroll: false,
        onClick: () => setShowModal(false),
      })}
      className={cn(
        `block min-w-0 border-l-3 border-transparent px-4 py-2.5 transition-all duration-300 ease-out`,
        `hover:border-blue-400/60 hover:bg-gradient-to-r hover:from-blue-50/40 hover:to-blue-50/10`,
        `hover:shadow-[0_2px_8px_rgba(59,130,246,0.08)] hover:translate-x-0.5`,
        `active:translate-x-0 active:transition-none`,
        isModalView ? "group" : "",
        "rounded-r-xl"
      )}
    >
      <Tooltip
        key={`tooltip-${title}`}
        content={
          <div className="w-72 p-4 bg-white/95 backdrop-blur-lg border border-gray-200/50 rounded-xl shadow-lg">
            <div className="mb-3 font-semibold text-gray-900 text-sm truncate">{getPrettyUrl(title)}</div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#3870FF] shadow-sm"></div>
                  <span className="text-sm font-medium text-gray-700">Clicks</span>
                </div>
                <span className="font-semibold text-gray-900 tabular-nums">{clicks.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#FFD399] shadow-sm"></div>
                  <span className="text-sm font-medium text-gray-700">Leads</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 tabular-nums">{leads.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 font-medium">{clickToLeadRate.toFixed(1)}% of clicks</div>
                </div>
              </div>
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#00F5B8] shadow-sm"></div>
                  <span className="text-sm font-medium text-gray-700">Revenue</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 tabular-nums">${Math.round(saleAmount / 100).toLocaleString()}</div>
                  <div className="text-xs text-gray-500 font-medium">{sales} sales • {leadToSaleRate.toFixed(1)}% of leads</div>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <div className="relative flex items-center justify-between py-2">
          {/* Side-by-side bars: BLUE → ORANGE → GREEN */}
          <div className="absolute inset-0 h-full flex items-center">
            {/* Clicks bar (blue - left side) */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${clicksWidth}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className={`h-3/4 ${leads === 0 && saleAmount === 0 ? 'rounded-md' : 'rounded-l-md'} bg-[#D6E2FF] relative overflow-hidden`}
              style={{
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/20" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
            </motion.div>
            {/* Leads bar (orange - middle) */}
            {leads > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${leadsWidth}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className={`h-3/4 ${saleAmount === 0 ? 'rounded-r-md' : ''} bg-[#FFD399] relative overflow-hidden`}
                style={{
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/20" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
              </motion.div>
            )}
            {/* Sales bar (green - right side) */}
            {saleAmount > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${salesWidth}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="h-3/4 rounded-r-md bg-[#00F5B8] relative overflow-hidden"
                style={{
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/20" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
              </motion.div>
            )}
          </div>

          <div className="relative z-10 flex h-8 w-full min-w-0 max-w-[calc(100%-2rem)] items-center transition-[max-width] duration-300 ease-in-out group-hover:max-w-[calc(100%-5rem)]">
            {lineItem}
          </div>

          <div className="z-10 flex items-center">
            <NumberFlow
              value={clicks}
              className="z-10 px-3 text-sm font-semibold text-neutral-700 tabular-nums tracking-tight"
              format={{
                notation: clicks > 999999 ? "compact" : "standard",
              }}
            />
          </div>
        </div>
      </Tooltip>
    </As>
  );
}