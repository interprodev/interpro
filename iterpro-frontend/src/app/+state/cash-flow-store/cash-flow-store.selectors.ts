import { ClubSeason } from '@iterpro/shared/data-access/sdk';
import { getDataLabels, getDefaultCartesianConfig, PRIMARIES } from '@iterpro/shared/utils/common-utils';
import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';
import { adapter, CashFlowData, cashFlowStoreFeatureKey, State } from './cash-flow-store.state';

const { selectIds, selectAll } = adapter.getSelectors();

const getError = (state: State): string => state.error;
const getIsLoading = (state: State): boolean => state.isLoading;
const getSelectedCashFlowData = (state: State): CashFlowData => state.selectedCashFlowData;
const getSelectedCombination = (state: State): any => state.selectedCombination;
const getAllClubSeasons = (state: State): ClubSeason[] => state.clubSeasons;
const getClubSeasons = (state: State): ClubSeason[] => state.clubSeasonsToShow;
const getTempSeasons = (state: State): ClubSeason[] => state.tempSeasons;

export const wrapChartData = tableData => {
	const response: any = {
		labels: [],
		datasets: []
	};
	if (tableData) {
		const salesData = tableData.map(
			({ sales }) => sales.transferFee + sales.bonuses + sales.agentFee + sales.agentBonuses
		);
		const purchasesData = tableData.map(
			({ purchases }) => purchases.transferFee + purchases.bonuses + purchases.agentFee + purchases.agentBonuses
		);
		const tradingBalanceData = tableData.map(({ tradingBalance }) => tradingBalance);
		response.labels = tableData.map(({ season }) => season);
		response.datasets = [
			{
				data: tradingBalanceData,
				type: 'line',
				pointRadius: 2,
				borderWidth: 2,
				borderColor: PRIMARIES[0],
				pointBorderColor: PRIMARIES[0],
				pointBackgroundColor: PRIMARIES[0],
				pointHoverBackgroundColor: PRIMARIES[0],
				pointHoverBorderColor: '#fff',
				label: 'Trading Balance',
				cubicInterpolationMode: 'monotone'
			},
			{
				label: 'Sales',
				type: 'bar',
				backgroundColor: 'green',
				barPercentage: 0.8,
				categoryPercentage: 0.5,
				data: salesData
			},
			{
				label: 'Purchases',
				type: 'bar',
				backgroundColor: 'red',
				barPercentage: 0.8,
				categoryPercentage: 0.5,
				data: purchasesData
			}
		];
	}
	return response;
};

export const wrapChartOptions = tableData => {
	const options: any = {
		...getDefaultCartesianConfig(),
		responsive: true,
		// maintainAspectRatio: true,
		scales: {
			x: {
				grid: { display: false, color: '#333333' },
				ticks: {
					autoSkip: false,
					color: '#ddd'
				},
				stacked: false
			},
			y: {
				id: 'y',
				position: 'left',
				stacked: false,
				grid: { color: '#333333', drawBorder: false },
				beginAtZero: true,
				ticks: {
					color: '#ddd',
					padding: 15,
					callback: (value, i, vals) => {
						if (value % 1 === 0) {
							if (i === vals.length - 1) {
								return toShortNumber(value, true);
							} else return toShortNumber(value, true);
						} else return toShortNumber(value, true);
					}
				}
			}
		},
	};
	options.plugins.datalabels = getDataLabels(tableData);
	options.plugins.tooltip.callbacks = {
		label: tooltipItem => `${tooltipItem.dataset.label}: ${toShortNumber(tooltipItem.raw, true)}`
	};
	return options;
};

export const selectState: MemoizedSelector<object, State> = createFeatureSelector<State>(cashFlowStoreFeatureKey);

export const selectError = createSelector(selectState, getError);

export const selectCombination: MemoizedSelector<object, any> = createSelector(selectState, getSelectedCombination);

export const selectIsLoading: MemoizedSelector<object, boolean> = createSelector(selectState, getIsLoading);

export const selectCashFlowData = createSelector(selectState, getSelectedCashFlowData);

export const selectTableData = createSelector(
	selectCashFlowData,
	selectedCashFlowData => selectedCashFlowData.tableData
);

export const selectChartData = createSelector(selectCashFlowData, selectedCashFlowData =>
	wrapChartData(selectedCashFlowData.tableData.filter(x => x.season !== 'TOTAL'))
);

export const selectChartOptions = createSelector(selectCashFlowData, selectedCashFlowData =>
	wrapChartOptions(selectedCashFlowData.tableData.filter(x => x.season !== 'TOTAL'))
);

export const selectAllCashFlow: MemoizedSelector<object, CashFlowData[]> = createSelector(selectState, selectAll);

export const selectCashFlowId: MemoizedSelector<object, string[] | number[]> = createSelector(selectState, selectIds);

export const selectDataFromParameters = createSelector(
	selectCashFlowId,
	selectAllCashFlow,
	selectCombination,
	(list: string[], entities: CashFlowData[], combination: any) => {
		const i = list.indexOf(combination);
		return { data: i > -1 ? entities[i] : null };
	}
);

export const selectAllClubSeasons = createSelector(selectState, getAllClubSeasons);

export const selectClubSeasons = createSelector(selectState, getClubSeasons);

export const selectTempSeasons = createSelector(selectState, getTempSeasons);

export const selectTotalOperatingCashFlow = createSelector(selectClubSeasons, clubSeasons =>
	clubSeasons.reduce((a, b) => a + (b.operatingCashFlow || 0), 0)
);

// copy of shortNumber pipe
export const toShortNumber = (input: any, showSuffix = false, fixed?): any => {
	let exp: number;
	const isNegative = input < 0 ? -1 : 1;
	const suffixes = ['k', 'M', 'G', 'T', 'P', 'E'];
	input = Math.abs(input);

	if (Number.isNaN(input) || input === null || input === undefined) {
		return '';
	} else if (Number(input) < 1000 && Number(input) > -1000) {
		return Number(input);
	} else if (Number(input) === 0) {
		return 0;
	} else {
		exp = Math.floor(Math.log(Number(input)) / Math.log(1000));
		if (!fixed) fixed = Math.round(Number(input) / Math.pow(1000, exp)) !== Number(input) / Math.pow(1000, exp) ? 1 : 0;
		return (isNegative * (Number(input) / Math.pow(1000, exp))).toFixed(fixed) + (showSuffix ? suffixes[exp - 1] : '');
	}
};
