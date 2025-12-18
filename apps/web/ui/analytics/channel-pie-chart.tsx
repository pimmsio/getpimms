"use client";

import {
  CHANNEL_CONFIGS,
  formatSegmentDisplay,
  getReferrerDomainForIcon,
  getReferrerProviderIconUrl,
  getTopReferrerGroupsForChannel,
  shouldShowSegmentLabel,
  type ChannelType,
} from "@/lib/analytics/utils";
import { useRouterStuff } from "@dub/ui";
import { Group } from "@visx/group";
import { Pie } from "@visx/shape";
import { Text } from "@visx/text";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  UnifiedAnalyticsTooltip,
  createBaseMetrics,
  createKeyMetrics,
  createTopSources,
  type TooltipSection,
} from "./unified-analytics-tooltip";

type ChannelData = {
  channel: string;
  channelType: ChannelType;
  clicks: number;
  leads: number;
  sales: number;
  saleAmount: number;
  count: number;
};

type ChannelPieChartProps = {
  data: ChannelData[];
  groupedReferrerData?: any[]; // Grouped referrer data to get top provider groups per channel
  destinationUrlsData?: any[]; // Destination URLs data to get top sites for direct traffic
  selectedTab: "clicks" | "leads" | "sales";
  saleUnit: "sales" | "saleAmount";
};

export default function ChannelPieChart({
  data,
  groupedReferrerData = [],
  destinationUrlsData = [],
  selectedTab,
  saleUnit,
}: ChannelPieChartProps) {
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { queryParams, searchParams } = useRouterStuff();

  // ResizeObserver pour mesurer précisément les dimensions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(container);

    // Mesure initiale
    const rect = container.getBoundingClientRect();
    setDimensions({ width: rect.width, height: rect.height });

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const chartData = useMemo(() => {
    const dataKey = selectedTab === "sales" ? saleUnit : selectedTab;

    return data
      .map((d) => {
        const topReferrerGroups = getTopReferrerGroupsForChannel(
          d.channelType,
          groupedReferrerData,
          destinationUrlsData,
        );
        return {
          channel: d.channel,
          channelType: d.channelType,
          value: d[dataKey] || 0,
          clicks: d.clicks || 0,
          leads: d.leads || 0,
          sales: d.sales || 0,
          saleAmount: d.saleAmount || 0,
          color: CHANNEL_CONFIGS[d.channelType]?.color
            ? `${CHANNEL_CONFIGS[d.channelType].color}80`
            : "#9ca3af80", // Add 50% opacity for lighter colors
          topReferrerGroups,
        };
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [data, groupedReferrerData, destinationUrlsData, selectedTab, saleUnit]);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  // Handle channel click for filtering
  const handleChannelClick = (channelType: ChannelType) => {
    // Check if we're already filtering by this channel
    const currentChannel = searchParams.get("channel");
    
    if (currentChannel === channelType) {
      // Remove filter if clicking on the already-filtered channel
      queryParams({ del: "channel" });
    } else {
      // Set filter to this channel
      queryParams({ set: { channel: channelType }, del: "page", scroll: false });
    }
  };

  // Calculs basés sur les dimensions observées
  const { width, height } = dimensions;

  if (!chartData.length) {
    return (
      <div
        ref={containerRef}
        className="flex h-full w-full items-center justify-center"
      >
        <p className="text-sm text-gray-600">No data available</p>
      </div>
    );
  }

  // Ne render que si on a des dimensions valides
  if (width === 0 || height === 0) {
    return <div ref={containerRef} className="h-full w-full" />;
  }

  // LOGIQUE CORRECTE : Utiliser TOUT l'espace disponible !
  const centerY = height / 2;
  const centerX = width / 2;

  // CALCUL INTELLIGENT : Espace disponible pour le graphique
  // NOTE: on NE réduit plus le rayon en fonction des légendes; on les borne séparément
  const availableWidth = width;
  const availableHeight = height;

  // Prendre la contrainte la plus restrictive (comme vous l'avez dit !)
  const safe = 30; // marge de sécurité pour éviter les coupes (stroke, arrondis)
  const maxRadiusBase = Math.min(width / 2 - safe, height / 2 - safe);
  let radius = Math.max(maxRadiusBase, 50); // Minimum 50px pour être visible

  // Borne supplémentaire basée sur la distance max allouée aux labels
  const maxLabelDistanceGlobal = Math.min(width / 2 - safe, height / 2 - safe);
  const desiredLabelDistanceGlobal = Math.min(
    radius + 40,
    maxLabelDistanceGlobal,
  );
  radius = Math.min(radius, desiredLabelDistanceGlobal - 40); // garde 40px pour labels
  radius = Math.max(radius, 50);
  const innerRadius = radius * 0.6;
  // Responsive helpers for labels
  const isMobile = width < 520;
  const isVeryNarrow = width < 380;

  // Donut sized to container with safe margins and separate label clamping

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg width={width} height={height}>
        {/* Define shadows and gradients */}
        <defs>
          <filter id="labelShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="3"
              floodColor="rgba(0,0,0,0.1)"
            />
          </filter>
          <filter id="dotShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="1"
              stdDeviation="1"
              floodColor="rgba(0,0,0,0.2)"
            />
          </filter>
        </defs>
        <Group top={centerY} left={centerX}>
          <Pie
            data={chartData}
            pieValue={(d) => d.value}
            outerRadius={radius}
            innerRadius={innerRadius}
            cornerRadius={3}
            padAngle={0.02}
          >
            {(pie) => {
              return pie.arcs.map((arc, index) => {
                const hasSpaceForLabel = arc.endAngle - arc.startAngle >= 0.1;
                const arcPath = pie.path(arc) || "";
                const channel = arc.data.channel;
                const isHovered = hoveredChannel === channel;
                // Remove this line as we're using website icons now

                // ÉTIQUETTES AU MAX : Utiliser tout l'espace jusqu'aux bords
                const angle = (arc.startAngle + arc.endAngle) / 2;

                // Distance optimale : aller jusqu'aux bords moins une petite marge
                const maxDistanceX = width / 2 - safe; // Distance max horizontale
                const maxDistanceY = height / 2 - safe; // Distance max verticale
                const optimalDistance = Math.min(maxDistanceX, maxDistanceY);
                // Distance de label finale bornée (plus proche sur mobile)
                const labelDistance = Math.min(
                  radius + (isMobile ? 10 : 40),
                  optimalDistance,
                );

                const labelX = Math.cos(angle - Math.PI / 2) * labelDistance;
                const labelY = Math.sin(angle - Math.PI / 2) * labelDistance;
                const textAnchor: "start" | "middle" | "end" =
                  labelX > 0 ? "start" : labelX < 0 ? "end" : "middle";

                return (
                  <g key={`arc-${index}`}>
                    <motion.path
                      d={arcPath}
                      fill={arc.data.color}
                      stroke="white"
                      strokeWidth={2}
                      className="transition-smooth cursor-pointer will-change-transform"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{
                        opacity: hoveredChannel ? (isHovered ? 1 : 0.7) : 1,
                        scale: isHovered ? 1.05 : 1,
                      }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      onMouseEnter={(e) => {
                        setHoveredChannel(channel);

                        const sections: TooltipSection[] = [
                          { type: "header", title: arc.data.channel },
                          createBaseMetrics({
                            clicks: arc.data.clicks,
                            leads: arc.data.leads,
                            sales: arc.data.sales,
                            saleAmount: arc.data.saleAmount,
                          }),
                          createKeyMetrics({
                            clicks: arc.data.clicks,
                            leads: arc.data.leads,
                            sales: arc.data.sales,
                            saleAmount: arc.data.saleAmount,
                          }),
                        ];

                        // Add top sources if available
                        if (arc.data.topReferrerGroups.length > 0) {
                          sections.push(
                            createTopSources(
                              arc.data.topReferrerGroups,
                              getReferrerProviderIconUrl,
                            ),
                          );
                        }

                        // Force new tooltip data to ensure it updates
                        setTooltipData(null);
                        setTimeout(() => {
                          setTooltipData({
                            sections,
                            position: { x: e.clientX, y: e.clientY },
                          });
                        }, 0);
                      }}
                      onMouseLeave={() => {
                        setHoveredChannel(null);
                        setTooltipData(null);
                      }}
                      onMouseMove={(e) => {
                        if (tooltipData && hoveredChannel === channel) {
                          setTooltipData({
                            ...tooltipData,
                            position: { x: e.clientX, y: e.clientY },
                          });
                        }
                      }}
                      onClick={() => {
                        handleChannelClick(arc.data.channelType);
                      }}
                    />

                    {/* Top 3 website icons on segments */}
                    {hasSpaceForLabel &&
                      arc.data.topReferrerGroups.length > 0 && (
                        <motion.g
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          pointerEvents="none"
                        >
                          {(() => {
                            // Simple thresholds based on slice percentage
                            const percent = (arc.data.value / total) * 100;
                            const allowedIconCount =
                              percent >= 18
                                ? 3
                                : percent >= 10
                                  ? 2
                                  : percent >= 6
                                    ? 1
                                    : 0;
                            const visibleGroups =
                              arc.data.topReferrerGroups.slice(
                                0,
                                allowedIconCount,
                              );
                            const totalIcons = visibleGroups.length;

                            return visibleGroups.map((referrerGroup, idx) => {
                              // Calculate position inside the arc using its mid-angle and band center radius
                              const getIconPosition = (
                                index: number,
                                total: number,
                                iconSize: number,
                              ) => {
                                // Mid-angle of the slice (in rad). visx's 0 angle is at 12 o'clock; we already
                                // use angle - PI/2 elsewhere, so be consistent here too
                                const midAngle =
                                  (arc.startAngle + arc.endAngle) / 2 -
                                  Math.PI / 2;
                                // Place icons at the center of the donut band
                                const bandCenterRadius =
                                  (innerRadius + radius) / 2;
                                const baseX =
                                  Math.cos(midAngle) * bandCenterRadius;
                                const baseY =
                                  Math.sin(midAngle) * bandCenterRadius;

                                if (total === 1) {
                                  return { x: baseX, y: baseY };
                                }

                                // For multiple icons, offset them along the tangent (perpendicular) to the arc
                                const tangentAngle = midAngle + Math.PI / 2; // perpendicular
                                // Keep a consistent spacing
                                const gapPx = Math.max(
                                  2,
                                  Math.round(iconSize * 0.5),
                                );
                                const spacing = iconSize + gapPx;
                                const dx = Math.cos(tangentAngle) * spacing;
                                const dy = Math.sin(tangentAngle) * spacing;

                                if (total === 2) {
                                  return index === 0
                                    ? {
                                        x: baseX - dx / 2,
                                        y: baseY - dy / 2,
                                      }
                                    : {
                                        x: baseX + dx / 2,
                                        y: baseY + dy / 2,
                                      };
                                }

                                // 3 icons → small triangle oriented with the slice
                                const ux = Math.cos(midAngle);
                                const uy = Math.sin(midAngle);
                                const tx = Math.cos(tangentAngle);
                                const ty = Math.sin(tangentAngle);
                                const radialOut = iconSize * 0.3 + gapPx / 8; // toward outer edge
                                const radialIn = iconSize * 0.3 + gapPx / 8; // toward inner edge
                                const tangent = spacing; // sideways along arc, arc-aware

                                const positions = [
                                  // Tip towards outer edge
                                  {
                                    x: baseX + ux * radialOut,
                                    y: baseY + uy * radialOut,
                                  },
                                  // Bottom-left
                                  {
                                    x: baseX - ux * radialIn - tx * tangent,
                                    y: baseY - uy * radialIn - ty * tangent,
                                  },
                                  // Bottom-right
                                  {
                                    x: baseX - ux * radialIn + tx * tangent,
                                    y: baseY - uy * radialIn + ty * tangent,
                                  },
                                ];
                                return positions[index];
                              };

                              const iconSize = 20; // Restore original visual size
                              const iconPos = getIconPosition(
                                idx,
                                totalIcons,
                                iconSize,
                              );

                              return (
                                <g key={idx} pointerEvents="none">
                                  {/* Rounded clip for icon */}
                                  {(() => {
                                    const clipId = `iconClip-${index}-${idx}`;
                                    const x = iconPos.x - iconSize / 2;
                                    const y = iconPos.y - iconSize / 2;
                                    const r = Math.round(iconSize * 0.22);
                                    return (
                                      <>
                                        <clipPath
                                          id={clipId}
                                          clipPathUnits="userSpaceOnUse"
                                        >
                                          <rect
                                            x={x}
                                            y={y}
                                            width={iconSize}
                                            height={iconSize}
                                            rx={r}
                                            ry={r}
                                          />
                                        </clipPath>
                                        {/* White background behind icon */}
                                        <rect
                                          x={x}
                                          y={y}
                                          width={iconSize}
                                          height={iconSize}
                                          rx={r}
                                          ry={r}
                                          fill="white"
                                        />
                                        <image
                                          href={getReferrerProviderIconUrl(
                                            referrerGroup,
                                          )}
                                          x={x}
                                          y={y}
                                          width={iconSize}
                                          height={iconSize}
                                          className="pointer-events-none"
                                          clipPath={`url(#${clipId})`}
                                          onError={(e) => {
                                            const target =
                                              e.target as SVGImageElement;
                                            const domain =
                                              getReferrerDomainForIcon(
                                                referrerGroup,
                                              );

                                            // Try different favicon services in order
                                            target.href.baseVal = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
                                          }}
                                        />
                                      </>
                                    );
                                  })()}
                                </g>
                              );
                            });
                          })()}
                        </motion.g>
                      )}

                    {/* Ligne jusqu'à l'étiquette */}
                    {!isMobile &&
                      shouldShowSegmentLabel(arc.data.value, total) && (
                        <motion.line
                          x1={Math.cos(angle - Math.PI / 2) * (radius + 2)}
                          y1={Math.sin(angle - Math.PI / 2) * (radius + 2)}
                          x2={
                            Math.cos(angle - Math.PI / 2) * (labelDistance - 5)
                          }
                          y2={
                            Math.sin(angle - Math.PI / 2) * (labelDistance - 5)
                          }
                          stroke="#d1d5db"
                          strokeWidth={1}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.5 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                        />
                      )}

                    {/* Étiquette simple sans background complexe */}
                    {shouldShowSegmentLabel(arc.data.value, total) && (
                      <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                      >
                        {/* Nom du canal */}
                        <Text
                          x={labelX}
                          y={labelY - 6}
                          textAnchor={textAnchor}
                          fontSize={isMobile ? 11 : 12}
                          fontWeight="600"
                          fill="#374151"
                          className="pointer-events-none select-none"
                        >
                          {isVeryNarrow ? "" : channel}
                        </Text>

                        {/* Pourcentage */}
                        <Text
                          x={labelX}
                          y={labelY + (isVeryNarrow ? 2 : 8)}
                          textAnchor={textAnchor}
                          fontSize={isMobile ? 10 : 11}
                          fontWeight="500"
                          fill="#6b7280"
                          className="pointer-events-none select-none"
                        >
                          {isVeryNarrow
                            ? formatSegmentDisplay(
                                arc.data.value,
                                total,
                                false,
                                true,
                              ) // pourcentage seul
                            : formatSegmentDisplay(
                                arc.data.value,
                                total,
                                !isMobile,
                                isMobile,
                              )}
                        </Text>
                      </motion.g>
                    )}
                  </g>
                );
              });
            }}
          </Pie>
        </Group>
      </svg>

      {/* Unified Tooltip */}
      {tooltipData && (
        <UnifiedAnalyticsTooltip
          sections={tooltipData.sections}
          position={tooltipData.position}
        />
      )}
    </div>
  );
}
