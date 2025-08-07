import { cn } from "@dub/utils";
import { LinearGradient } from "@visx/gradient";
import { RectClipPath } from "@visx/clip-path";
import { Group } from "@visx/group";
import { Area, AreaClosed, Circle } from "@visx/shape";
import { curveMonotoneX } from "@visx/curve";
import { AnimatePresence, motion } from "framer-motion";
import { useId, useMemo } from "react";
import { useChartContext, useChartTooltipContext } from "@dub/ui/charts";

export function MixedAreasAndBars() {
  const clipPathId = useId();
  const { data, series, margin, xScale, yScale, width, height, startDate, endDate } =
    useChartContext();
  const { tooltipData } = useChartTooltipContext();

  // Separate line and bar series
  const lineSeries = series.filter((s) => s.type === "line");
  const barSeries = series.filter((s) => s.type === "bar");

  // Calculate bar width with maximum limit - bars should not exceed 70% of total width
  const maxTotalBarWidth = width * 0.7; // Maximum 70% of chart width for all bars
  const calculatedBarWidth = Math.min(maxTotalBarWidth / data.length, width / data.length * 0.6);
  const barWidth = Math.min(calculatedBarWidth, 35); // Max individual bar width of 35px

  // IMPROVED BAR SCALING: Calculate proportional scaling based on actual data relationships
  const maxClicks = Math.max(...data.map(d => d.values.clicks));
  const maxLeads = Math.max(...data.map(d => d.values.leads || 0));
  const maxSalesRevenue = Math.max(...data.map(d => d.values.saleAmount || 0));
  
  // Calculate conversion rates to determine logical height limits
  const totalClicks = data.reduce((sum, d) => sum + d.values.clicks, 0);
  const totalLeads = data.reduce((sum, d) => sum + (d.values.leads || 0), 0);
  const totalRevenue = data.reduce((sum, d) => sum + (d.values.saleAmount || 0), 0);
  
  const avgConversionRate = totalClicks > 0 ? totalLeads / totalClicks : 0;
  const avgRevenuePerLead = totalLeads > 0 ? totalRevenue / totalLeads : 0;
  
  // SIMPLE DIRECT SCALING with proper stacking limits
  // Bars use a separate scaling to not interfere with line chart Y-scale
  const maxBarHeight = height * 0.7; // Use 70% of chart height for bars
  
  // Calculate the maximum possible stacked height to ensure bars never overflow
  const maxStackedValue = Math.max(...data.map(d => {
    const leads = d.values.leads || 0;
    const revenue = d.values.saleAmount || 0;
    // Normalize both to comparable units (percentage of their max)
    const leadsNormalized = maxLeads > 0 ? leads / maxLeads : 0;
    const revenueNormalized = maxSalesRevenue > 0 ? revenue / maxSalesRevenue : 0;
    return leadsNormalized + revenueNormalized; // Total stacked ratio
  }));
  
  // Scale factor to ensure max stacked height doesn't exceed maxBarHeight
  const stackScaleFactor = maxStackedValue > 0 ? maxBarHeight / (maxStackedValue * maxBarHeight) : 1;
  
  // Direct scaling that respects stacking limits
  const leadsBarHeight = (value: number) => {
    if (value === 0 || maxLeads === 0) return 0;
    const ratio = value / maxLeads;
    const rawHeight = ratio * maxBarHeight;
    return Math.max(rawHeight * stackScaleFactor, value > 0 ? height * 0.02 : 0);
  };
  
  const revenueBarHeight = (value: number) => {
    if (value === 0 || maxSalesRevenue === 0) return 0;
    const ratio = value / maxSalesRevenue;
    const rawHeight = ratio * maxBarHeight;
    return Math.max(rawHeight * stackScaleFactor, value > 0 ? height * 0.02 : 0);
  };



  // Data with all values set to zero to animate from
  const zeroedData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      values: Object.fromEntries(Object.keys(d.values).map((key) => [key, 0])),
    })) as typeof data;
  }, [data]);

  return (
    <Group left={margin.left} top={margin.top}>
      <RectClipPath id={clipPathId} x={0} y={0} width={width} height={height} />
      <AnimatePresence>
        {/* Render Stacked Bars */}
        {barSeries
          .filter(({ isActive }) => isActive)
          .map((s, index) => (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              key={`${s.id}_${startDate.toString()}_${endDate.toString()}`}
              clipPath={`url(#${clipPathId})`}
            >
              {/* Bar gradient */}
              <LinearGradient
                className={cn(s.colorClassName ?? "text-gray-500")}
                id={`${s.id}-background`}
                fromOffset="0%"
                from="currentColor"
                fromOpacity={1.0}
                toOffset="100%"
                to="currentColor"
                toOpacity={1.0}
                x1={0}
                x2={0}
                y1={1}
                y2={0}
              />

              {data.map((d, i) => {
                const value = s.valueAccessor(d) ?? 0;
                const x = (xScale(d.date) ?? 0) - barWidth / 2;
                
                if (s.id === "leads") {
                  // Render leads bars from bottom 
                  const leadHeight = leadsBarHeight(value);
                  const salesValue = barSeries.find(bs => bs.id === "sales")?.valueAccessor(d) ?? 0;
                  const salesHeight = revenueBarHeight(salesValue);
                  const totalStackHeight = leadHeight + salesHeight;
                  const leadsY = height - leadHeight; // Leads bar at bottom of chart
                  const hasSales = salesValue > 0;
                  
                  return value > 0 ? (
                    <motion.g key={i}>
                      {hasSales ? (
                        // If sales exist, leads bar is flat rectangle (no rounding)
                        <rect
                          x={x}
                          y={leadsY}
                          width={barWidth}
                          height={leadHeight}
                          fill={`url(#${s.id}-background)`}
                        />
                      ) : (
                        // If no sales, round ONLY the top corners of leads
                        <path
                          d={`M ${x} ${leadsY + leadHeight} 
                              L ${x} ${leadsY + 4} 
                              Q ${x} ${leadsY} ${x + 4} ${leadsY} 
                              L ${x + barWidth - 4} ${leadsY} 
                              Q ${x + barWidth} ${leadsY} ${x + barWidth} ${leadsY + 4} 
                              L ${x + barWidth} ${leadsY + leadHeight} 
                              Z`}
                          fill={`url(#${s.id}-background)`}
                        />
                      )}
                    </motion.g>
                  ) : null;
                } else if (s.id === "sales") {
                  // Render sales bars - round ONLY the top corners
                  const leadsValue = barSeries.find(bs => bs.id === "leads")?.valueAccessor(d) ?? 0;
                  const salesValue = value;
                  const leadHeight = leadsBarHeight(leadsValue);
                  const salesHeight = revenueBarHeight(salesValue);
                  const totalStackHeight = leadHeight + salesHeight;
                  const leadsY = height - leadHeight; // Leads bar at bottom 
                  const salesY = leadsY - salesHeight; // Sales bar sits on top of leads
                  
                  return salesValue > 0 ? (
                    <motion.g key={i}>
                      <path
                        d={`M ${x} ${salesY + salesHeight} 
                            L ${x} ${salesY + 4} 
                            Q ${x} ${salesY} ${x + 4} ${salesY} 
                            L ${x + barWidth - 4} ${salesY} 
                            Q ${x + barWidth} ${salesY} ${x + barWidth} ${salesY + 4} 
                            L ${x + barWidth} ${salesY + salesHeight} 
                            Z`}
                        fill={`url(#${s.id}-background)`}
                      />
                    </motion.g>
                  ) : null;
                }
                return null;
              })}
            </motion.g>
          ))}

        {/* Render Lines (Areas) */}
        {lineSeries
          .filter(({ isActive }) => isActive)
          .map((s) => (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              key={`${s.id}_${startDate.toString()}_${endDate.toString()}`}
              clipPath={`url(#${clipPathId})`}
            >
              {/* Area gradient */}
              <LinearGradient
                className={cn(s.colorClassName ?? "text-blue-500")}
                id={`${s.id}-area-gradient`}
                fromOffset="0%"
                from="currentColor"
                fromOpacity={0.1}
                toOffset="40%"
                to="currentColor"
                toOpacity={0.05}
                x1={0}
                x2={0}
                y1={0}
                y2={1}
              />

              {/* Area fill */}
              <AreaClosed
                data={data}
                x={(d) => xScale(d.date) ?? 0}
                y={(d) => yScale(s.valueAccessor(d) ?? 0)}
                yScale={yScale}
                curve={curveMonotoneX}
              >
                {({ path }) => (
                  <motion.path
                    initial={{ d: path(zeroedData) || "", opacity: 0 }}
                    animate={{ d: path(data) || "", opacity: 1 }}
                    fill={`url(#${s.id}-area-gradient)`}
                  />
                )}
              </AreaClosed>

              {/* Line */}
              <Area
                data={data}
                x={(d) => xScale(d.date) ?? 0}
                y={(d) => yScale(s.valueAccessor(d) ?? 0)}
                curve={curveMonotoneX}
              >
                {({ path }) => (
                  <motion.path
                    initial={{ d: path(zeroedData) || "" }}
                    animate={{ d: path(data) || "" }}
                    className={cn(s.colorClassName ?? "text-blue-500")}
                    stroke="currentColor"
                    strokeOpacity={1}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="transparent"
                  />
                )}
              </Area>

              {/* Latest value circle */}
              {!tooltipData && (
                <Circle
                  cx={xScale(data.at(-1)!.date) ?? 0}
                  cy={yScale(s.valueAccessor(data.at(-1)!))}
                  r={4}
                  className={cn(s.colorClassName ?? "text-blue-500")}
                  fill="currentColor"
                />
              )}
            </motion.g>
          ))}
      </AnimatePresence>
    </Group>
  );
}