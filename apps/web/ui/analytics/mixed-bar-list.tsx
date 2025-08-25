"use client";

import { Tooltip, useMediaQuery } from "@dub/ui";
import { cn, getPrettyUrl, linkConstructor } from "@dub/utils";
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
    linkData?: any;
  }[];
  setShowModal: Dispatch<SetStateAction<boolean>>;
  limit?: number;
}) {
  const [search, setSearch] = useState("");
  
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

    return (
      <>
        {shouldShowSearchBar && !limit && (
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${tab}...`}
                className="w-full rounded border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-0 focus:ring-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        )}
        <div className="space-y-1">
          {filteredData.slice(0, limit || filteredData.length).map((item, index) => (
            <MixedLineItem
              key={index}
              icon={item.icon}
              title={item.title}
              href={item.href}
              clicks={item.clicks}
              leads={item.leads}
              sales={item.sales}
              saleAmount={item.saleAmount}
              maxClicks={maxClicks}
              maxLeads={maxLeads}
              maxSales={maxSales}
              tab={tab}
              setShowModal={setShowModal}
              linkData={item.linkData}
              limit={limit}
            />
          ))}
        </div>
      </>
    );
  }, [filteredData, limit, maxClicks, maxLeads, maxSales, tab, setShowModal, search]);

  return (
    <div className="w-full">
      {bars}
    </div>
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
  linkData?: any;
  limit?: number;
}) {
  const { isMobile } = useMediaQuery();

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

  const commonClassName = cn(
    `block min-w-0 border-l-3 border-transparent px-4 py-2.5 transition-all duration-300 ease-out`,
    `hover:border-blue-400/60 hover:bg-gradient-to-r hover:from-blue-50/40 hover:to-blue-50/10`,
    `hover:shadow-[0_2px_8px_rgba(59,130,246,0.08)] hover:translate-x-0.5`,
    `active:translate-x-0 active:transition-none`,
    isModalView ? "group" : "",
    "rounded-r-xl"
  );

  const handleMobileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // On mobile, click just shows tooltip - no navigation
  };

  const tooltipContent = (
    <div 
      className="w-64 p-3 bg-white rounded shadow-xl border-0"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2 font-semibold text-gray-900 text-sm">
        {linkData ? (
          <a 
            href={linkConstructor({ domain: linkData.domain, key: linkData.key })}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline truncate block"
            onClick={(e) => e.stopPropagation()}
          >
            {linkConstructor({ domain: linkData.domain, key: linkData.key, pretty: true })}
          </a>
        ) : (
          <span className="truncate block">{getPrettyUrl(title) || 'No link available'}</span>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between py-0.5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#3870FF]"></div>
            <span className="text-xs font-medium text-gray-700">Clicks</span>
          </div>
          <span className="font-semibold text-gray-900 tabular-nums">{clicks.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between py-0.5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#FFD399]"></div>
            <span className="text-xs font-medium text-gray-700">Leads</span>
          </div>
          <div className="text-right">
            <div className="font-semibold text-gray-900 tabular-nums">{leads.toLocaleString()}</div>
            <div className="text-xs text-gray-500 font-medium">{clickToLeadRate.toFixed(1)}% of clicks</div>
          </div>
        </div>
        <div className="flex items-center justify-between py-0.5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#00F5B8]"></div>
            <span className="text-xs font-medium text-gray-700">Revenue</span>
          </div>
          <div className="text-right">
            <div className="font-semibold text-gray-900 tabular-nums">${Math.round(saleAmount / 100).toLocaleString()}</div>
            <div className="text-xs text-gray-500 font-medium">{sales} sales • {leadToSaleRate.toFixed(1)}% of leads</div>
          </div>
        </div>
        
        {/* Links section */}
        {linkData && (
          <div className="pt-2 border-t border-gray-100/80">
            <div className="space-y-1.5">
              {/* Destination URL */}
              {linkData.url && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Destination</span>
                  <a
                    href={linkData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 underline max-w-32 truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {linkData.url.length > 25 ? `${linkData.url.substring(0, 25)}...` : linkData.url}
                  </a>
                </div>
              )}
              
              {/* iOS deeplink */}
              {linkData.ios && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">iOS</span>
                  <a
                    href={linkData.ios}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 underline max-w-32 truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {linkData.ios && linkData.ios.length > 25 ? `${linkData.ios.substring(0, 25)}...` : (linkData.ios || '')}
                  </a>
                </div>
              )}
              
              {/* Android deeplink */}
              {linkData.android && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Android</span>
                  <a
                    href={linkData.android}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 underline max-w-32 truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {linkData.android && linkData.android.length > 25 ? `${linkData.android.substring(0, 25)}...` : (linkData.android || '')}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Mobile filter link */}
        {isMobile && href && (
          <div className="pt-3 border-t border-gray-100/80">
            <a
              href={href}
              className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(false);
                // Navigation will happen through href
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter
            </a>
          </div>
        )}
      </div>
    </div>
  );



  const chartContent = (
    <div className="relative flex items-center justify-between py-2">
      {/* Side-by-side bars: BLUE → ORANGE → GREEN */}
      <div className="absolute inset-0 h-full flex items-center">
        {/* Clicks bar (blue - left side) */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clicksWidth}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`h-3/4 ${leads === 0 && saleAmount === 0 ? 'rounded' : 'rounded-l-md'} bg-[#D6E2FF] relative overflow-hidden`}
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
  );

  if (href) {
    return (
      <Link
        href={href}
        scroll={false}
        onClick={(e) => {
          if (isMobile) {
            e.preventDefault();
            e.stopPropagation();
            // On mobile, prevent navigation and just show tooltip
          } else {
            setShowModal(false);
            // On desktop, allow navigation for filtering
          }
        }}
        className={commonClassName}
      >
        <Tooltip key={`tooltip-${title}`} content={tooltipContent}>
          {chartContent}
        </Tooltip>
      </Link>
    );
  }

  return (
    <div className={commonClassName}>
      <Tooltip key={`tooltip-${title}`} content={tooltipContent}>
        {chartContent}
      </Tooltip>
    </div>
  );
}
