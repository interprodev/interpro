import * as moment from 'moment';
import {
	ChartFlags,
	DrillStatsFilters,
	DrillStatsFiltersData,
	DrillStatsResult
} from '../models/drill-stats.interface';
import { DrillStatsViews, DrillType } from '../models/drill-stats.types';

export interface DrillsStatsState {
	ui: {
		selectedView: DrillStatsViews;
		fullscreen: boolean;
		chartFlags: ChartFlags;
		loading: boolean;
	};
	filters: {
		data: DrillStatsFiltersData | null;
		previousFilters: DrillStatsFilters;
		selectedFilters: DrillStatsFilters;
	};
	comparison: {
		drillStats: DrillStatsResult | null;
	};
	period: {
		drillStats: DrillStatsResult | null;
	};
}

export const initialFilters: DrillStatsFilters = {
	datePeriod: [moment().add(-30, 'days').toDate(), moment().toDate()],
	drillsIds: [],
	players: [],
	drillType: DrillType.Planned,
	metric: null
};

export const initialDrillsStatsState: DrillsStatsState = {
	ui: {
		selectedView: DrillStatsViews.Comparison,
		fullscreen: false,
		chartFlags: { labels: false, percentage: false, order: undefined },
		loading: false
	},
	filters: {
		data: { players: [], drills: [], drillsMapping: undefined },
		previousFilters: initialFilters,
		selectedFilters: initialFilters
	},
	comparison: {
		drillStats: null
	},
	period: {
		drillStats: null
	}
};
