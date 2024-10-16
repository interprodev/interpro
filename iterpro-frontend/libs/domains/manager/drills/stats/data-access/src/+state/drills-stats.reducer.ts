import { createFeature, createReducer, on } from '@ngrx/store';
import {
	ComparisonDrillStatsActions,
	FiltersDrillStatsActions,
	PeriodDrillStatsActions,
	UIDrillStatsActions
} from './drills-stats.actions';
import { initialDrillsStatsState } from './drills-stats.state';

export const drillsStatsFeature = createFeature({
	name: 'drillsStats',
	reducer: createReducer(
		/** Initial State */
		initialDrillsStatsState,

		/** UI Actions */
		on(UIDrillStatsActions.selectView, (state, { selectedView }) => ({
			...state,
			ui: { ...state.ui, selectedView }
		})),
		on(UIDrillStatsActions.toggleSidebar, (state, { fullscreen }) => ({
			...state,
			ui: { ...state.ui, fullscreen }
		})),
		on(UIDrillStatsActions.toggleOrder, (state, { order }) => ({
			...state,
			ui: { ...state.ui, chartFlags: { ...state.ui.chartFlags, order } }
		})),
		on(UIDrillStatsActions.togglePercentage, (state, { percentage }) => ({
			...state,
			ui: { ...state.ui, chartFlags: { ...state.ui.chartFlags, percentage } }
		})),
		on(UIDrillStatsActions.toggleLabels, (state, { labels }) => ({
			...state,
			ui: { ...state.ui, chartFlags: { ...state.ui.chartFlags, labels } }
		})),

		/** Comparison Actions */
		on(ComparisonDrillStatsActions.loadDrillStats, state => ({
			...state,
			ui: { ...state.ui, loading: true },
			comparison: { drillStats: null }
		})),
		on(ComparisonDrillStatsActions.loadDrillStatsSuccess, (state, { data }) => ({
			...state,
			ui: { ...state.ui, loading: false },
			comparison: { drillStats: data }
		})),
		on(ComparisonDrillStatsActions.loadDrillStatsFailure, state => ({ ...state, ui: { ...state.ui, loading: false } })),

		/** Period Actions */
		on(PeriodDrillStatsActions.loadDrillStats, state => ({
			...state,
			ui: { ...state.ui, loading: true },
			period: { drillStats: null }
		})),
		on(PeriodDrillStatsActions.loadDrillStatsSuccess, (state, { data }) => ({
			...state,
			ui: { ...state.ui, loading: false },
			period: { drillStats: data }
		})),
		on(PeriodDrillStatsActions.loadDrillStatsFailure, state => ({ ...state, ui: { ...state.ui, loading: false } })),

		/** Filters Actions */
		on(FiltersDrillStatsActions.initFilters, (state) => ({
			...state,
			filters: {
				...state.filters,
				data: {
					players: state.filters.data?.players || [],
					drills: state.filters.data?.drills || [],
					drillsMapping: undefined
				}
			}
		})),
		on(FiltersDrillStatsActions.loadFilters, state => ({
			...state,
			ui: { ...state.ui, loading: true }
		})),
		on(FiltersDrillStatsActions.loadFiltersSuccess, (state, { players, drills, drillsMapping }) => ({
			...state,
			filters: {
				...state.filters,
				data: {
					players: players || [],
					drills,
					drillsMapping
				}
			},
			ui: { ...state.ui, loading: false }
		})),
		on(FiltersDrillStatsActions.loadFiltersFailure, state => ({
			...state,
			ui: { ...state.ui, loading: false }
		})),
		on(FiltersDrillStatsActions.updateFilters, (state, { filters }) => ({
			...state,
			filters: {
				...state.filters,
				previousFilters: { ...state.filters.previousFilters, ...state.filters.selectedFilters },
				selectedFilters: { ...state.filters.selectedFilters, ...filters }
			}
		}))
	)
});
