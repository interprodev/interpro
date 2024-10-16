import { createSelector } from '@ngrx/store';
import { isEqual } from 'lodash';
import { drillsStatsFeature } from './drills-stats.reducer';

export const selectHasPlayersChanged = createSelector(
	drillsStatsFeature.selectFilters,
	({ previousFilters, selectedFilters }) => !isEqual(previousFilters.players, selectedFilters.players)
);

export const selectHasValidFilters = createSelector(drillsStatsFeature.selectFilters, ({ selectedFilters }) => {
	const validPeriod = selectedFilters.datePeriod.every(date => Boolean(date));
	const validMetric = Boolean(selectedFilters.metric);
	const validDrills = Boolean(selectedFilters.drillsIds.length) && selectedFilters.drillsIds.every(id => Boolean(id));
	const validDrillType = selectedFilters.drillType !== undefined || selectedFilters.drillType !== null;
	return validPeriod && validMetric && validDrills && validDrillType;
});

export const selectCheckComparison = createSelector(
	selectHasPlayersChanged,
	selectHasValidFilters,
	(hasPlayersChanged, hasValidFilters) => !hasPlayersChanged && hasValidFilters
);

export const selectCheckPeriodTrend = createSelector(
	drillsStatsFeature.selectFilters,
	selectHasValidFilters,
	({ selectedFilters }, hasValidFilters) =>
		hasValidFilters && Boolean(selectedFilters.players.length) && selectedFilters.players.every(p => Boolean(p))
);

export const selectComparisonData = createSelector(drillsStatsFeature.selectComparison, comparisonData => ({
	stats: comparisonData.drillStats?.stats,
	results: comparisonData.drillStats?.results ? new Map(Object.entries(comparisonData.drillStats?.results)) : null
}));

export const selectPeriodData = createSelector(drillsStatsFeature.selectPeriod, periodTrendData => ({
	stats: periodTrendData.drillStats?.stats,
	results: new Map(Object.entries(periodTrendData.drillStats?.results || {}))
}));

export const selectSelectedFilters = createSelector(
	drillsStatsFeature.selectFilters,
	filters => filters.selectedFilters
);

export const selectSelectedView = createSelector(drillsStatsFeature.selectUi, ui => ui.selectedView);
