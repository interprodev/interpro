import { getDefaultRadarConfig, PRIMARIES, radarBackground } from '@iterpro/shared/utils/common-utils';
import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';
import { ChartData, ChartOptions } from 'chart.js';
import { isArray } from 'lodash';
import { adapter, DrillsProfileStore, drillsProfileStoreFeatureKey, State } from './drills-profile-store.state';

const { selectIds, selectAll } = adapter.getSelectors();
const getSelectedDrillId = (state: State): string => state.selectedDrillId;
const getSelectedDrillsProfile = (state: State): DrillsProfileStore => state.selectedDrillsProfile;
const getIsLoading = (state: State): boolean => state.isLoading;

// to move in dedicated store service
const wrapChartData = (selectedDrillsProfile: DrillsProfileStore) => {
	const response: ChartData = {
		labels: [],
		datasets: []
	};
	if (selectedDrillsProfile) {
		const labelsArray = Object.keys(selectedDrillsProfile.abs);
		const data = Object.values(selectedDrillsProfile.perc).map(x => Math.round(x));
		response.labels = labelsArray;
		response.datasets = [
			{
				data,
				backgroundColor: radarBackground,
				borderColor: PRIMARIES[0],
				pointBackgroundColor: PRIMARIES[0],
				pointBorderColor: '#fff',
				pointHoverBackgroundColor: PRIMARIES[0],
				pointHoverBorderColor: PRIMARIES[0],
				pointRadius: 7,
				pointHoverRadius: 10,
				tension: 0
			}
		];
	}
	return response;
};

const wrapChartOptions = (selectedDrillsProfile: DrillsProfileStore) => {
	const options: ChartOptions = { ...getDefaultRadarConfig() };
	if (selectedDrillsProfile) {
		const absolute = Object.values(selectedDrillsProfile.abs);
		options.plugins.tooltip = {
			intersect: true,
			callbacks: {
				title: ([{ label }, ...{}]) => <string | string[]>(isArray(label) ? (label as any).join(' ') : label),
				label: ({ dataIndex }) => {
					if (absolute) {
						return `Absolute: ${Number(absolute[dataIndex]).toFixed(1)}`;
					}
				},
				afterLabel: ({ formattedValue }) => `Game %: ${formattedValue}%`
			},
			displayColors: false
		};
	}

	return options;
};

export const selectState: MemoizedSelector<object, State> = createFeatureSelector<State>(drillsProfileStoreFeatureKey);

export const selectDrill: MemoizedSelector<object, string> = createSelector(selectState, getSelectedDrillId);

export const selectIsLoading: MemoizedSelector<object, boolean> = createSelector(selectState, getIsLoading);

export const selectDrillChart = createSelector(selectState, getSelectedDrillsProfile);

export const selectAllDrills: MemoizedSelector<object, DrillsProfileStore[]> = createSelector(selectState, selectAll);

export const selectDrillsId: MemoizedSelector<object, string[] | number[]> = createSelector(selectState, selectIds);

// ho tolto il selectState perchè è già presente/eseguito in selectDrillChart e non viene usato nella funzione di projection
// per comodità ho spostato i selector "complessi" in fondo e lasciato in testa quelle che ti passano il valore dello state così com'è
export const selectChartData = createSelector(selectDrillChart, selectedDrillsProfile =>
	wrapChartData(selectedDrillsProfile)
);

export const selectChartOptions = createSelector(selectDrillChart, selectedDrillsProfile =>
	wrapChartOptions(selectedDrillsProfile)
);

export const selectSplitNumbers = createSelector(selectDrillChart, selectedDrillsProfile =>
	!!selectedDrillsProfile ? selectedDrillsProfile.num_splits : 0
);

export const selectChartDataByID = createSelector(
	selectDrillsId,
	selectAllDrills,
	selectDrill,
	(list: string[], entities: DrillsProfileStore[], selectedDrillId) => {
		const i = list.indexOf(selectedDrillId);
		return { chartData: i > -1 ? entities[i] : null };
	}
);
