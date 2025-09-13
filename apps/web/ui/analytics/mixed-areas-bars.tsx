import { useChartContext, useChartTooltipContext } from "@dub/ui/charts";
import { cn } from "@dub/utils";
import { RectClipPath } from "@visx/clip-path";
import { curveMonotoneX } from "@visx/curve";
import { LinearGradient } from "@visx/gradient";
import { Group } from "@visx/group";
import { Area, AreaClosed, Circle } from "@visx/shape";
import { AnimatePresence, motion } from "framer-motion";
import { useId, useMemo } from "react";

// Custom BarRounded component for better visual effects
interface BarRoundedProps {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  radius?: number;
  roundTop?: boolean;
  roundBottom?: boolean;
}

function BarRounded({
  x,
  y,
  width,
  height,
  fill,
  radius = 6,
  roundTop = false,
  roundBottom = false,
}: BarRoundedProps) {
  const r = Math.min(radius, width / 2, height / 2);
  
  let path: string;
  
  if (roundTop && !roundBottom) {
    // Rounded top only (for sales bars)
    path = `M ${x} ${y + height} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} L ${x + width - r} ${y} Q ${x + width} ${y} ${x + width} ${y + r} L ${x + width} ${y + height} Z`;
  } else if (roundBottom && !roundTop) {
    // Rounded bottom only (for leads bars)
    path = `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height - r} Q ${x + width} ${y + height} ${x + width - r} ${y + height} L ${x + r} ${y + height} Q ${x} ${y + height} ${x} ${y + height - r} Z`;
  } else if (roundTop && roundBottom) {
    // Fully rounded
    path = `M ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} L ${x + width - r} ${y} Q ${x + width} ${y} ${x + width} ${y + r} L ${x + width} ${y + height - r} Q ${x + width} ${y + height} ${x + width - r} ${y + height} L ${x + r} ${y + height} Q ${x} ${y + height} ${x} ${y + height - r} Z`;
  } else {
    // No rounding
    path = `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
  }
  
  return (
    <path
      d={path}
      fill={fill}
      style={{
        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
      }}
    />
  );
}

export function MixedAreasAndBars() {
  const clipPathId = useId();
  const {
    data,
    series,
    margin,
    xScale,
    yScale,
    width,
    height,
    startDate,
    endDate,
  } = useChartContext();
  const { tooltipData } = useChartTooltipContext();

  // Separate line and bar series
  const lineSeries = series.filter((s) => s.type === "line");
  const barSeries = series.filter((s) => s.type === "bar");

  // Calculate bar width with maximum limit - bars should be narrower and more rounded
  const maxTotalBarWidth = width * 0.5; // Maximum 50% of chart width for all bars (narrower)
  const calculatedBarWidth = Math.min(
    maxTotalBarWidth / data.length,
    (width / data.length) * 0.4,
  );
  const barWidth = Math.min(calculatedBarWidth, 24); // Max individual bar width of 24px (narrower)

  // IMPROVED BAR SCALING: Calculate proportional scaling based on actual data relationships
  const maxLeads = Math.max(...data.map((d) => d.values.leads || 0));
  const maxSalesRevenue = Math.max(
    ...data.map((d) => d.values.saleAmount || 0),
  );

  // SIMPLE DIRECT SCALING with proper stacking limits
  // Bars use a separate scaling to not interfere with line chart Y-scale
  const maxBarHeight = height * 0.7; // Use 70% of chart height for bars

  // Calculate the maximum possible stacked height to ensure bars never overflow
  const maxStackedValue = Math.max(
    ...data.map((d) => {
      const leads = d.values.leads || 0;
      const revenue = d.values.saleAmount || 0;
      // Normalize both to comparable units (percentage of their max)
      const leadsNormalized = maxLeads > 0 ? leads / maxLeads : 0;
      const revenueNormalized =
        maxSalesRevenue > 0 ? revenue / maxSalesRevenue : 0;
      return leadsNormalized + revenueNormalized; // Total stacked ratio
    }),
  );

  // Scale factor to ensure max stacked height doesn't exceed maxBarHeight
  const stackScaleFactor =
    maxStackedValue > 0 ? maxBarHeight / (maxStackedValue * maxBarHeight) : 1;

  // Direct scaling that respects stacking limits
  const leadsBarHeight = (value: number) => {
    if (value === 0 || maxLeads === 0) return 0;
    const ratio = value / maxLeads;
    const rawHeight = ratio * maxBarHeight;
    return Math.max(
      rawHeight * stackScaleFactor,
      value > 0 ? height * 0.02 : 0,
    );
  };

  const revenueBarHeight = (value: number) => {
    if (value === 0 || maxSalesRevenue === 0) return 0;
    const ratio = value / maxSalesRevenue;
    const rawHeight = ratio * maxBarHeight;
    return Math.max(
      rawHeight * stackScaleFactor,
      value > 0 ? height * 0.02 : 0,
    );
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
              {/* Bar gradient with hardcoded PIMMS colors */}
              <defs>
                <linearGradient
                  id={`${s.id}-background`}
                  x1="0"
                  y1="1"
                  x2="0"
                  y2="0"
                >
                  {s.id === "leads" ? (
                    <>
                      <stop offset="0%" stopColor="#ffc65a" stopOpacity={1.0} />
                      <stop offset="100%" stopColor="#ffc65a" stopOpacity={1.0} />
                    </>
                  ) : s.id === "sales" ? (
                    <>
                      <stop offset="0%" stopColor="#1ec198" stopOpacity={1.0} />
                      <stop offset="100%" stopColor="#1ec198" stopOpacity={1.0} />
                    </>
                  ) : (
                    <>
                      <stop offset="0%" stopColor="#3970ff" stopOpacity={1.0} />
                      <stop offset="100%" stopColor="#3970ff" stopOpacity={1.0} />
                    </>
                  )}
                </linearGradient>
              </defs>

              {data.map((d, i) => {
                const value = s.valueAccessor(d) ?? 0;
                const x = (xScale(d.date) ?? 0) - barWidth / 2;

                if (s.id === "leads") {
                  // Render leads bars from bottom
                  const leadHeight = leadsBarHeight(value);
                  const salesValue =
                    barSeries
                      .find((bs) => bs.id === "sales")
                      ?.valueAccessor(d) ?? 0;
                  const salesHeight = revenueBarHeight(salesValue);
                  const totalStackHeight = leadHeight + salesHeight;
                  const leadsY = height - leadHeight; // Leads bar at bottom of chart
                  const hasSales = salesValue > 0;

                  return value > 0 ? (
                    <motion.g key={i}>
                      <BarRounded
                        x={x}
                        y={leadsY}
                        width={barWidth}
                        height={leadHeight}
                        fill={`url(#${s.id}-background)`}
                        radius={100}
                        roundTop={!hasSales}
                        roundBottom={true}
                      />
                    </motion.g>
                  ) : null;
                } else if (s.id === "sales") {
                  // Render sales bars - round ONLY the top corners
                  const leadsValue =
                    barSeries
                      .find((bs) => bs.id === "leads")
                      ?.valueAccessor(d) ?? 0;
                  const salesValue = value;
                  const leadHeight = leadsBarHeight(leadsValue);
                  const salesHeight = revenueBarHeight(salesValue);
                  const totalStackHeight = leadHeight + salesHeight;
                  const leadsY = height - leadHeight; // Leads bar at bottom
                  const salesY = leadsY - salesHeight; // Sales bar sits on top of leads

                  return salesValue > 0 ? (
                    <motion.g key={i}>
                      <BarRounded
                        x={x}
                        y={salesY}
                        width={barWidth}
                        height={salesHeight}
                        fill={`url(#${s.id}-background)`}
                        radius={100}
                        roundTop={true}
                        roundBottom={false}
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
              {/* Area gradient with sophisticated effect */}
              <defs>
                <linearGradient
                  id={`${s.id}-area-gradient`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#3970ff" stopOpacity={0.3} />
                  <stop offset="50%" stopColor="#3970ff" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#3970ff" stopOpacity={0.05} />
                </linearGradient>
                
                {/* Mask for line effect */}
                <mask id={`${s.id}-line-mask`}>
                  <rect width={width} height={height} fill="black" />
                  <Area
                    data={data}
                    x={(d) => xScale(d.date) ?? 0}
                    y={(d) => yScale(s.valueAccessor(d) ?? 0)}
                    curve={curveMonotoneX}
                  >
                    {({ path }) => (
                      <g>
                        <path
                          d={path(data) || ""}
                          stroke="white"
                          strokeWidth="20"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.2"
                        />
                        <path
                          d={path(data) || ""}
                          stroke="white"
                          strokeWidth="12"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.4"
                        />
                      </g>
                    )}
                  </Area>
                </mask>
              </defs>

              {/* Area fill with gradient following the line */}
              <g mask={`url(#${s.id}-line-mask)`}>
                <rect
                  width={width}
                  height={height}
                  fill={`url(#${s.id}-area-gradient)`}
                />
              </g>

              {/* Regular area fill */}
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
                    mask={`url(#${s.id}-line-mask)`}
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
                    className={cn(s.colorClassName ?? "text-data-clicks")}
                    stroke="#3970ff"
                    strokeOpacity={1}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="transparent"
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(57, 112, 255, 0.2))',
                    }}
                  />
                )}
              </Area>

              {/* Latest value circle */}
              {!tooltipData && (
                <Circle
                  cx={xScale(data.at(-1)!.date) ?? 0}
                  cy={yScale(s.valueAccessor(data.at(-1)!))}
                  r={4}
                  fill="#3970ff"
                />
              )}
            </motion.g>
          ))}
      </AnimatePresence>
    </Group>
  );
}
