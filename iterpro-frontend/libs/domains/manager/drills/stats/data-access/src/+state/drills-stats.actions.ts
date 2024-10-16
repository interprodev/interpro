import { Drill, Player } from '@iterpro/shared/data-access/sdk';
import { createActionGroup, emptyProps } from '@ngrx/store';
import { DrillStatsFilters, DrillStatsResult } from '../models/drill-stats.interface';
import { DrillStatsViews, OrderType } from '../models/drill-stats.types';
import { DrillsMapping } from '@iterpro/shared/utils/common-utils';

/** UI Actions */
export const UIDrillStatsActions = createActionGroup({
	source: 'Drills Stats UI',
	events: {
		'Select view': (selectView: DrillStatsViews) => ({ selectedView: selectView }),
		'Toggle Sidebar': (isFullscreen: boolean) => ({ fullscreen: isFullscreen }),
		'Toggle Percentage': (percentage: boolean) => ({ percentage }),
		'Toggle Order': (order: OrderType) => ({ order }),
		'Toggle Labels': (labels: boolean) => ({ labels }),
		'Export PDF': emptyProps(),
		'Export CSV': emptyProps()
	}
});

/** Comparison Actions */
export const ComparisonDrillStatsActions = createActionGroup({
	source: 'Drills Stats Comparison',
	events: {
		'Filters Trigger Reload': (filters: DrillStatsFilters) => ({ filters }),
		'Load Drill Stats': (filters: DrillStatsFilters) => ({ filters }),
		'Load Drill Stats Success': (data: DrillStatsResult) => ({ data }),
		'Load Drill Stats Failure': (error: Error) => ({ error })
	}
});

/** Period Actions */
export const PeriodDrillStatsActions = createActionGroup({
	source: 'Drills Stats Period',
	events: {
		'Load Drill Stats': (filters: DrillStatsFilters) => ({ filters }),
		'Load Drill Stats Success': (data: DrillStatsResult) => ({ data }),
		'Load Drill Stats Failure': (error: Error) => ({ error })
	}
});

/** Filters Actions */
export const FiltersDrillStatsActions = createActionGroup({
	source: 'Drills Stats Filters',
	events: {
		'Init Filters': emptyProps(),
		'Load Filters': emptyProps(),
		'Load Filters Success': (players: Partial<Player>[], drills: Drill[], drillsMapping: DrillsMapping) => ({ players, drills, drillsMapping }),
		'Load Filters Failure': (error: Error) => ({ error }),
		'Update Filters': (filters: DrillStatsFilters) => ({ filters })
	}
});
