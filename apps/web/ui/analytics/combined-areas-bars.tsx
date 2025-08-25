import { cn } from "@dub/utils";
import { LinearGradient } from "@visx/gradient";
import { RectClipPath } from "@visx/clip-path";
import { Group } from "@visx/group";
import { Area, AreaClosed, Circle } from "@visx/shape";
import { BarRounded } from "@visx/shape";
import { curveMonotoneX } from "@visx/curve";
import { AnimatePresence, motion } from "framer-motion";
import { useId, useMemo } from "react";
import { useChartContext, useChartTooltipContext } from "@dub/ui/charts";

export function CombinedAreasAndBars() {
  const clipPathId = useId();
  const { data, series, margin, xScale, yScale, width, height, startDate, endDate } =
    useChartContext();

  const { tooltipData } = useChartTooltipContext();

  // Data with all values set to zero to animate from
  const zeroedData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      values: Object.fromEntries(Object.keys(d.values).map((key) => [key, 0])),
    })) as typeof data;
  }, [data]);

  // Separate line and bar series
  const lineSeries = series.filter((s) => s.type === "line");
  const barSeries = series.filter((s) => s.type === "bar");

  // Calculate bar width based on scale type
  const barWidth = "bandwidth" in xScale 
    ? xScale.bandwidth() 
    : width / data.length * 0.4;

  return (
    <Group left={margin.left} top={margin.top}>
      <RectClipPath id={clipPathId} x={0} y={0} width={width} height={height} />
      
      {/* Render bars first (behind lines) */}
      <AnimatePresence>
        {barSeries
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
              {/* Bar gradient */}
              <LinearGradient
                className={cn(s.colorClassName ?? "text-orange-500")}
                id={`${s.id}-background`}
                fromOffset="0%"
                from="currentColor"
                fromOpacity={0.3}
                toOffset="100%"
                to="currentColor"
                toOpacity={0.8}
                x1={0}
                x2={0}
                y1={1}
                y2={0}
              />

              {data.map((d, i) => {
                const value = s.valueAccessor(d) ?? 0;
                const barHeight = yScale(0) - yScale(value);
                const x = (xScale(d.date) ?? 0) - barWidth / 2;
                
                return (
                  <motion.g key={i}>
                    <BarRounded
                      x={x}
                      y={yScale(value)}
                      width={barWidth}
                      height={Math.max(0, barHeight)}
                      radius={2}
                      fill={`url(#${s.id}-background)`}
                      className={cn(s.colorClassName ?? "text-orange-500")}
                    />
                  </motion.g>
                );
              })}
            </motion.g>
          ))}
      </AnimatePresence>

      {/* Render lines on top */}
      <AnimatePresence>
        {lineSeries
          .filter(({ isActive }) => isActive)
          .map((s) => (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              key={`${s.id}_line`}
            >
              {/* Line gradient for area fill */}
              <LinearGradient
                className={cn(s.colorClassName ?? "text-blue-500")}
                id={`${s.id}-area-gradient`}
                fromOffset="0%"
                from="currentColor"
                fromOpacity={0.1}
                toOffset="100%"
                to="currentColor"
                toOpacity={0.02}
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