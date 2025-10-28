/**
 * Data transformation utilities for analytics
 */

export interface TimeseriesDataPoint {
  date: Date;
  values: {
    clicks: number;
    leads: number;
    sales: number;
    saleAmount: number;
  };
}

/**
 * Normalize metric data to standardize access patterns
 */
export function normalizeMetricData<T extends Record<string, any>>(
  data: T[],
  selectedTab: "clicks" | "leads" | "sales",
): Array<T & { normalizedValue: number }> {
  return data.map((item) => {
    let normalizedValue = 0;

    if (selectedTab === "sales") {
      normalizedValue = item.saleAmount || 0;
    } else if (selectedTab === "leads") {
      normalizedValue = item.leads || 0;
    } else {
      normalizedValue = item.clicks || 0;
    }

    return {
      ...item,
      normalizedValue,
    };
  });
}

/**
 * Aggregate metrics from an array of data points
 */
export function aggregateMetrics(
  data: Array<{
    clicks?: number;
    leads?: number;
    sales?: number;
    saleAmount?: number;
  }>,
): {
  clicks: number;
  leads: number;
  sales: number;
  saleAmount: number;
} {
  return data.reduce<{
    clicks: number;
    leads: number;
    sales: number;
    saleAmount: number;
  }>(
    (acc, item) => ({
      clicks: acc.clicks + (item.clicks || 0),
      leads: acc.leads + (item.leads || 0),
      sales: acc.sales + (item.sales || 0),
      saleAmount: acc.saleAmount + (item.saleAmount || 0),
    }),
    { clicks: 0, leads: 0, sales: 0, saleAmount: 0 },
  );
}

/**
 * Format raw data for chart consumption
 * Merges multiple data sources into a unified chart data structure
 */
export function formatChartData(
  rawData: Array<{
    start: Date;
    clicks?: number;
    leads?: number;
    sales?: number;
    saleAmount?: number;
  }>,
): TimeseriesDataPoint[] {
  const dataMap = new Map<string, TimeseriesDataPoint>();

  rawData.forEach(({ start, clicks, leads, sales, saleAmount }) => {
    const dateKey = start.toString();
    const existing = dataMap.get(dateKey);

    if (existing) {
      // Merge with existing data
      existing.values.clicks += clicks || 0;
      existing.values.leads += leads || 0;
      existing.values.sales += sales || 0;
      existing.values.saleAmount += (saleAmount ?? 0) / 100;
    } else {
      // Create new entry
      dataMap.set(dateKey, {
        date: new Date(start),
        values: {
          clicks: clicks || 0,
          leads: leads || 0,
          sales: sales || 0,
          saleAmount: (saleAmount ?? 0) / 100,
        },
      });
    }
  });

  return Array.from(dataMap.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
}

/**
 * Calculate derived metrics from aggregated data
 */
export function calculateDerivedMetrics(metrics: {
  clicks: number;
  leads: number;
  sales: number;
  saleAmount: number;
}): {
  revenuePerClick: number;
  clickToLeadRate: number;
  leadToSaleRate: number;
  avgOrderValue: number;
} {
  const { clicks, leads, sales, saleAmount } = metrics;

  return {
    revenuePerClick: clicks > 0 ? saleAmount / clicks : 0,
    clickToLeadRate: clicks > 0 ? (leads / clicks) * 100 : 0,
    leadToSaleRate: leads > 0 ? (sales / leads) * 100 : 0,
    avgOrderValue: sales > 0 ? saleAmount / sales : 0,
  };
}

