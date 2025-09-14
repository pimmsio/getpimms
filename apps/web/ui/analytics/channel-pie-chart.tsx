"use client";

import {
  CHANNEL_CONFIGS,
  formatSegmentDisplay,
  getReferrerDomainForIcon,
  getReferrerProviderIconUrl,
  getResponsiveConfig,
  getTopReferrerGroupsForChannel,
  shouldShowSegmentLabel,
  type ChannelType,
} from "@/lib/analytics/utils";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { Pie } from "@visx/shape";
import { Text } from "@visx/text";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
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

  if (!chartData.length) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <p className="text-sm text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      {" "}
      {/* Remove padding to maximize space */}
      <ParentSize>
        {({ width, height: parentHeight }) => {
          const height = parentHeight || 500;
          const centerY = height / 2;
          const centerX = width / 2;

          // Get responsive configuration
          const config = getResponsiveConfig(width);
          const {
            isVerySmall,
            isSmallScreen,
            margins,
            labelDistance,
            fontSize,
            maxChannelNameLength,
          } = config;

          const radius =
            Math.min(width - margins.horizontal, height - margins.vertical) /
            2.2; // Slightly smaller
          const innerRadius = radius * 0.6;
          const labelRadius = radius + labelDistance;

          return (
            <svg width={width} height={height}>
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
                      const [centroidX, centroidY] = pie.path.centroid(arc);
                      const hasSpaceForLabel =
                        arc.endAngle - arc.startAngle >= 0.1;
                      const arcPath = pie.path(arc) || "";
                      const channel = arc.data.channel;
                      const isHovered = hoveredChannel === channel;
                      // Remove this line as we're using website icons now

                      // Calculate label position
                      const angle = (arc.startAngle + arc.endAngle) / 2;
                      const labelX =
                        Math.cos(angle - Math.PI / 2) * labelRadius;
                      const labelY =
                        Math.sin(angle - Math.PI / 2) * labelRadius;

                      // Determine text anchor based on position
                      const textAnchor =
                        labelX > 0 ? "start" : labelX < 0 ? "end" : "middle";

                      return (
                        <g key={`arc-${index}`}>
                          <motion.path
                            d={arcPath}
                            fill={arc.data.color}
                            stroke="white"
                            strokeWidth={2}
                            className="transition-smooth cursor-pointer will-change-transform"
                            style={{
                              filter: isHovered
                                ? `drop-shadow(0 0 8px ${arc.data.color}80) drop-shadow(0 0 16px ${arc.data.color}40)`
                                : "none",
                            }}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                              opacity: hoveredChannel
                                ? isHovered
                                  ? 1
                                  : 0.7
                                : 1,
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
                                {arc.data.topReferrerGroups
                                  .slice(0, 3)
                                  .map((referrerGroup, idx) => {
                                    const totalIcons =
                                      arc.data.topReferrerGroups.length;

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
                                      const tangentAngle =
                                        midAngle + Math.PI / 2; // perpendicular
                                      // Arc-aware spacing so icons are close on narrow slices and wider on large ones
                                      const arcAngle =
                                        arc.endAngle - arc.startAngle;
                                      const idealSep =
                                        bandCenterRadius * arcAngle * 0.7; // tuned factor
                                      const minSep = iconSize * 1.05;
                                      const maxSep = iconSize * 1.3;
                                      const spacing = Math.max(
                                        minSep,
                                        Math.min(maxSep, idealSep),
                                      );
                                      const dx =
                                        Math.cos(tangentAngle) * spacing;
                                      const dy =
                                        Math.sin(tangentAngle) * spacing;

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
                                      const radialOut = iconSize * 0.4; // toward outer edge
                                      const radialIn = iconSize * 0.4; // toward inner edge
                                      const tangent = spacing; // sideways along arc, arc-aware

                                      const positions = [
                                        // Tip towards outer edge
                                        {
                                          x: baseX + ux * radialOut,
                                          y: baseY + uy * radialOut,
                                        },
                                        // Bottom-left
                                        {
                                          x:
                                            baseX -
                                            ux * radialIn -
                                            tx * tangent,
                                          y:
                                            baseY -
                                            uy * radialIn -
                                            ty * tangent,
                                        },
                                        // Bottom-right
                                        {
                                          x:
                                            baseX -
                                            ux * radialIn +
                                            tx * tangent,
                                          y:
                                            baseY -
                                            uy * radialIn +
                                            ty * tangent,
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
                                        {/* Icon image */}
                                        <image
                                          href={getReferrerProviderIconUrl(
                                            referrerGroup,
                                          )}
                                          x={iconPos.x - iconSize / 2}
                                          y={iconPos.y - iconSize / 2}
                                          width={iconSize}
                                          height={iconSize}
                                          className="pointer-events-none"
                                          onError={(e) => {
                                            console.log(
                                              `Failed to load provider icon for ${referrerGroup}, trying fallback`,
                                            );
                                            const target =
                                              e.target as SVGImageElement;
                                            const domain =
                                              getReferrerDomainForIcon(
                                                referrerGroup,
                                              );

                                            // Try different favicon services in order
                                            if (
                                              target.href.baseVal.includes(
                                                "google.com/s2/favicons",
                                              )
                                            ) {
                                              // Try DuckDuckGo favicon service
                                              target.href.baseVal = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
                                            } else if (
                                              target.href.baseVal.includes(
                                                "duckduckgo.com",
                                              )
                                            ) {
                                              // Try alternative favicon service
                                              target.href.baseVal = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
                                            } else {
                                              // Final fallback - better SVG with proper icon
                                              const iconColor =
                                                referrerGroup === "PIMMS"
                                                  ? "%23007AFF"
                                                  : referrerGroup === "Google"
                                                    ? "%234285F4"
                                                    : referrerGroup ===
                                                        "LinkedIn"
                                                      ? "%230077B5"
                                                      : referrerGroup ===
                                                          "Facebook"
                                                        ? "%231877F2"
                                                        : referrerGroup ===
                                                            "X.com"
                                                          ? "%23000000"
                                                          : "%236B7280";
                                              target.href.baseVal = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><rect width="12" height="12" rx="2" fill="${iconColor}"/><text x="6" y="9" text-anchor="middle" fill="white" font-size="7" font-weight="600">${referrerGroup.charAt(0).toUpperCase()}</text></svg>`;
                                            }
                                          }}
                                        />
                                      </g>
                                    );
                                  })}
                              </motion.g>
                            )}

                          {/* Leader lines - only show if percentage meets threshold */}
                          {shouldShowSegmentLabel(arc.data.value, total) && (
                            <>
                              <motion.line
                                x1={
                                  Math.cos(angle - Math.PI / 2) * (radius + 5)
                                }
                                y1={
                                  Math.sin(angle - Math.PI / 2) * (radius + 5)
                                }
                                x2={
                                  Math.cos(angle - Math.PI / 2) * (radius + 25)
                                }
                                y2={
                                  Math.sin(angle - Math.PI / 2) * (radius + 25)
                                }
                                stroke="#6b7280"
                                strokeWidth={1}
                                initial={{ opacity: 0, pathLength: 0 }}
                                animate={{ opacity: 1, pathLength: 1 }}
                                transition={{
                                  delay: 0.5 + index * 0.1,
                                  duration: 0.3,
                                }}
                              />

                              <motion.line
                                x1={
                                  Math.cos(angle - Math.PI / 2) * (radius + 25)
                                }
                                y1={
                                  Math.sin(angle - Math.PI / 2) * (radius + 25)
                                }
                                x2={labelX > 0 ? labelX - 5 : labelX + 5}
                                y2={labelY}
                                stroke="#6b7280"
                                strokeWidth={1}
                                initial={{ opacity: 0, pathLength: 0 }}
                                animate={{ opacity: 1, pathLength: 1 }}
                                transition={{
                                  delay: 0.6 + index * 0.1,
                                  duration: 0.3,
                                }}
                              />
                            </>
                          )}

                          {/* Label - only show if percentage meets threshold */}
                          {shouldShowSegmentLabel(arc.data.value, total) && (
                            <motion.g
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.7 + index * 0.1 }}
                            >
                              <Text
                                x={labelX}
                                y={labelY - 8}
                                textAnchor={textAnchor}
                                fontSize={fontSize.label}
                                fontWeight="600"
                                fill="#374151"
                                className="pointer-events-none select-none"
                              >
                                {maxChannelNameLength !== Infinity &&
                                channel.length > maxChannelNameLength
                                  ? channel.substring(0, maxChannelNameLength) +
                                    "..."
                                  : channel}
                              </Text>
                              <Text
                                x={labelX}
                                y={labelY + 8}
                                textAnchor={textAnchor}
                                fontSize={fontSize.percentage}
                                fill="#6b7280"
                                className="pointer-events-none select-none"
                              >
                                {formatSegmentDisplay(
                                  arc.data.value,
                                  total,
                                  !isVerySmall,
                                  isVerySmall,
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
          );
        }}
      </ParentSize>
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
