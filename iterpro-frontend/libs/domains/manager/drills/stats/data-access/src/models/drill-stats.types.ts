import { ChartFlags } from './drill-stats.interface';

export const DrillStatsViews = { Comparison: 'Comparison', Period: 'Period' } as const;
export type DrillStatsViews = (typeof DrillStatsViews)[keyof typeof DrillStatsViews];

export const OrderType = { Asc: 'ASC', Desc: 'DESC', Unordered: undefined } as const;
export type OrderType = (typeof OrderType)[keyof typeof OrderType];

export const DrillType = { Planned: 0, Actual: 1 } as const;
export type DrillType = (typeof DrillType)[keyof typeof DrillType];

export type DrillStatsReportType = 'drill_stats';

export type DrillsStatsUI = {
	selectedView: DrillStatsViews;
	fullscreen: boolean;
	chartFlags: ChartFlags;
	loading: boolean;
};
