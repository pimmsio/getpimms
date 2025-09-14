import {
  CHANNEL_CONFIGS,
  type ChannelType,
  getReferrerDomainForIcon,
  getReferrerProviderIconUrl,
  shouldShowSegmentLabel,
  getTopReferrerGroupsForChannel,
  formatSegmentDisplay,
  getResponsiveConfig,
} from "@/lib/analytics/utils";
import { getGoogleFavicon } from "@dub/utils";
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
           color: CHANNEL_CONFIGS[d.channelType]?.color ? 
            `${CHANNEL_CONFIGS[d.channelType].color}80` : "#9ca3af80", // Add 50% opacity for lighter colors
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
          const { isVerySmall, isSmallScreen, margins, labelDistance, fontSize, maxChannelNameLength } = config;

          const radius =
            Math.min(width - margins.horizontal, height - margins.vertical) / 2.2; // Slightly smaller
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
                              >
                                 <foreignObject
                                   x={centroidX - 45}
                                   y={centroidY - 28}
                                   width={90}
                                   height={56}
                                   className="pointer-events-none"
                                 >
                                  <div className="relative h-full w-full">
                                    {arc.data.topReferrerGroups
                                      .slice(0, 3)
                                      .map((referrerGroup, idx) => {
                                        const domain =
                                          getReferrerDomainForIcon(referrerGroup);
                                        const totalIcons =
                                          arc.data.topReferrerGroups.length;

                                         // Dynamic positioning based on number of icons with improved spacing
                                         const getPosition = (
                                           index: number,
                                           total: number,
                                         ) => {
                                           if (total === 1) {
                                             return { x: 45, y: 28 }; // Center (adjusted for larger container)
                                           } else if (total === 2) {
                                             return index === 0
                                               ? { x: 32, y: 28 } // Left with better spacing
                                               : { x: 54, y: 28 }; // Right with better spacing
                                           } else {
                                             // 3 icons - triangle with optimal spacing
                                             const positions = [
                                               { x: 45, y: 18 }, // Top center
                                               { x: 33, y: 42 }, // Bottom left (more gap)
                                               { x: 58, y: 42 }, // Bottom right (more gap)
                                             ];
                                             return positions[index];
                                           }
                                         };

                                        const position = getPosition(
                                          idx,
                                          totalIcons,
                                        );

                                        return (
                                          <div
                                            key={idx}
                                            className="absolute h-5 w-5 overflow-hidden"
                                            style={{
                                              left: `${position.x}px`,
                                              top: `${position.y}px`,
                                              transform:
                                                "translate(-50%, -50%)",
                                            }}
                                          >
                                            <img
                                              src={getReferrerProviderIconUrl(referrerGroup)}
                                              alt={referrerGroup}
                                              className="h-full w-full object-cover"
                                              onError={(e) => {
                                                console.log(
                                                  `Failed to load provider icon for ${referrerGroup}, using Google favicon fallback`,
                                                );
                                                const target =
                                                  e.target as HTMLImageElement;
                                                // Fallback to Google favicon
                                                target.src = getGoogleFavicon(domain, false);
                                                // If that fails too, use a simple fallback
                                                target.onerror = () => {
                                                  target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><rect width="20" height="20" fill="%233B82F6"/><text x="10" y="14" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${referrerGroup.charAt(0).toUpperCase()}</text></svg>`;
                                                };
                                              }}
                                            />
                                          </div>
                                        );
                                      })}
                                  </div>
                                </foreignObject>
                              </motion.g>
                            )}

                          {/* Leader lines - only show if percentage meets threshold */}
                          {shouldShowSegmentLabel(arc.data.value, total) && (
                            <>
                              <motion.line
                                x1={Math.cos(angle - Math.PI / 2) * (radius + 5)}
                                y1={Math.sin(angle - Math.PI / 2) * (radius + 5)}
                                x2={Math.cos(angle - Math.PI / 2) * (radius + 25)}
                                y2={Math.sin(angle - Math.PI / 2) * (radius + 25)}
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
                                x1={Math.cos(angle - Math.PI / 2) * (radius + 25)}
                                y1={Math.sin(angle - Math.PI / 2) * (radius + 25)}
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
                                {maxChannelNameLength !== Infinity && channel.length > maxChannelNameLength
                                  ? channel.substring(0, maxChannelNameLength) + "..."
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
                                {formatSegmentDisplay(arc.data.value, total, !isVerySmall, isVerySmall)}
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
