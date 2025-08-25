import { startOfWeek, addWeeks, addDays, isAfter, isBefore } from "date-fns";

type TimeseriesDataPoint = {
  date: Date;
  values: {
    clicks: number;
    leads: number;
    sales: number;
    saleAmount: number;
  };
};

/**
 * Groups daily timeseries data into weekly or bi-weekly periods
 * @param data - Array of daily data points
 * @param granularity - "week" for weekly grouping, "biweekly" for bi-weekly grouping
 * @returns Grouped data with aggregated values
 */
export function groupTimeseriesData(
  data: TimeseriesDataPoint[],
  granularity: "week" | "biweekly"
): TimeseriesDataPoint[] {
  if (!data || data.length === 0) return [];
  
  // Sort data by date to ensure proper grouping
  const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const groupedData: TimeseriesDataPoint[] = [];
  const weekSize = granularity === "biweekly" ? 2 : 1; // 2 weeks for biweekly, 1 week for weekly
  
  // Start from the beginning of the first week
  let currentPeriodStart = startOfWeek(sortedData[0].date, { weekStartsOn: 1 }); // Monday start
  
  while (currentPeriodStart <= sortedData[sortedData.length - 1].date) {
    const currentPeriodEnd = addDays(addWeeks(currentPeriodStart, weekSize), -1); // End of period
    
    // Find all data points within this period
    const periodData = sortedData.filter(d => 
      !isBefore(d.date, currentPeriodStart) && !isAfter(d.date, currentPeriodEnd)
    );
    
    if (periodData.length > 0) {
      // Aggregate values for this period
      const aggregatedValues = periodData.reduce(
        (acc, point) => ({
          clicks: acc.clicks + point.values.clicks,
          leads: acc.leads + point.values.leads,
          sales: acc.sales + point.values.sales,
          saleAmount: acc.saleAmount + point.values.saleAmount,
        }),
        { clicks: 0, leads: 0, sales: 0, saleAmount: 0 }
      );
      
      groupedData.push({
        date: currentPeriodStart, // Use the start of the period as the date
        values: aggregatedValues,
      });
    }
    
    // Move to next period
    currentPeriodStart = addWeeks(currentPeriodStart, weekSize);
  }
  
  return groupedData;
}