import { Injectable, inject } from '@angular/core';
import { REPORT_TEMPLATE_KEY } from '@iterpro/manager/drills/stats/utils';
import { Drill, DrillApi, LoopBackAuth, Player, TeamApi, TeamSeasonApi } from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	DrillsMapping,
	DrillsMappingService,
	getMomentFormatFromStorage
} from '@iterpro/shared/utils/common-utils';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import { SelectItem } from 'primeng/api';
import { Observable, catchError, filter, forkJoin, map, of, switchMap, withLatestFrom } from 'rxjs';
import {
	DrillStatsData,
	DrillStatsReportPDF,
	DrillStatsResponse,
	DrillStatsResult
} from '../models/drill-stats.interface';
import { DrillStatsViews } from '../models/drill-stats.types';
import { DrillStatsDataService } from '../services/drill-stats-data.service';
import { DrillStatsReportService } from '../services/drill-stats-report.service';
import {
	ComparisonDrillStatsActions,
	FiltersDrillStatsActions,
	PeriodDrillStatsActions,
	UIDrillStatsActions
} from './drills-stats.actions';
import { drillsStatsFeature } from './drills-stats.reducer';
import {
	selectCheckComparison,
	selectCheckPeriodTrend,
	selectComparisonData,
	selectPeriodData,
	selectSelectedFilters,
	selectSelectedView
} from './drills-stats.selectors';
import { DrillsStatsState } from './drills-stats.state';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';

@Injectable()
export class DrillsStatsEffects {
	readonly #actions$ = inject(Actions);
	readonly #drillApi = inject(DrillApi);
	readonly #teamApi = inject(TeamApi);
	readonly #teamSeasonApi = inject(TeamSeasonApi);
	readonly #drillsMappingService = inject(DrillsMappingService);
	readonly #authService = inject(LoopBackAuth);
	readonly #currentTeamService = inject(CurrentTeamService);
	readonly #alertService = inject(AlertService);
	readonly #dataService = inject(DrillStatsDataService);
	readonly #reportService = inject(DrillStatsReportService);
	readonly #translateService = inject(TranslateService);
	readonly #store = inject(Store<DrillsStatsState>);

	/** UI Effects **/
	changeViewComparison$: Observable<Action> = createEffect(() =>
		this.#actions$.pipe(
			ofType(UIDrillStatsActions.selectView),
			filter(({ selectedView }) => selectedView === DrillStatsViews.Comparison),
			withLatestFrom(this.#store.select(selectCheckComparison)),
			filter(([_, validComparison]) => validComparison),
			withLatestFrom(this.#store.select(selectSelectedFilters)),
			map(([_, selectedFilters]) => ComparisonDrillStatsActions.loadDrillStats(selectedFilters))
		)
	);

	changeViewPeriod$: Observable<Action> = createEffect(() =>
		this.#actions$.pipe(
			ofType(UIDrillStatsActions.selectView),
			filter(({ selectedView }) => selectedView === DrillStatsViews.Period),
			withLatestFrom(this.#store.select(selectCheckPeriodTrend)),
			filter(([_, validPeriodTrend]) => validPeriodTrend),
			withLatestFrom(this.#store.select(selectSelectedFilters)),
			map(([_, selectedFilters]) => PeriodDrillStatsActions.loadDrillStats(selectedFilters))
		)
	);

	exportPDFComparison$: Observable<void> = createEffect(
		() =>
			this.#actions$.pipe(
				ofType(UIDrillStatsActions.exportPDF),
				withLatestFrom(this.#store.select(selectSelectedView)),
				filter(([_, selectedView]) => selectedView === DrillStatsViews.Comparison),
				withLatestFrom(
					this.#store.select(drillsStatsFeature.selectUi),
					this.#store.select(drillsStatsFeature.selectFilters),
					this.#store.select(drillsStatsFeature.selectComparison)
				),
				map(([_, ui, filters, comparison]) => {
					const report: DrillStatsReportPDF = this.#reportService.getComparisonReportPDF(
						filters.selectedFilters.metric,
						filters.selectedFilters.datePeriod,
						filters.selectedFilters.players,
						filters.data?.drills || [],
						filters.selectedFilters.drillType,
						comparison.drillStats as DrillStatsResult,
						ui.chartFlags,
						filters.data?.drillsMapping as DrillsMapping
					);

					this.#reportService.downloadReport(
						'drill_stats',
						report,
						`Drill Stats Comparison - ${moment().format(getMomentFormatFromStorage())}`
					);
				})
			),
		{ dispatch: false }
	);

	exportPDFPeriod$: Observable<void> = createEffect(
		() =>
			this.#actions$.pipe(
				ofType(UIDrillStatsActions.exportPDF),
				withLatestFrom(this.#store.select(selectSelectedView)),
				filter(([_, selectedView]) => selectedView === DrillStatsViews.Period),
				withLatestFrom(
					this.#store.select(drillsStatsFeature.selectUi),
					this.#store.select(drillsStatsFeature.selectFilters),
					this.#store.select(drillsStatsFeature.selectPeriod)
				),
				map(([_, ui, filters, comparison]) => {
					const report: DrillStatsReportPDF = this.#reportService.getPeriodTrendReportPDF(
						filters.selectedFilters.metric,
						filters.selectedFilters.datePeriod,
						filters.selectedFilters.players,
						filters.data?.drills || [],
						filters.selectedFilters.drillType,
						comparison.drillStats as DrillStatsResult,
						ui.chartFlags,
						filters.data?.drillsMapping as DrillsMapping
					);

					this.#reportService.downloadReport(
						REPORT_TEMPLATE_KEY,
						report,
						`Drill Stats Period Trend - ${moment().format(getMomentFormatFromStorage())}`
					);
				})
			),
		{ dispatch: false }
	);

	exportComparisonCSV$: Observable<void> = createEffect(
		() =>
			this.#actions$.pipe(
				ofType(UIDrillStatsActions.exportCSV),
				withLatestFrom(this.#store.select(selectSelectedView)),
				filter(([_, selectedView]) => selectedView === DrillStatsViews.Comparison),
				withLatestFrom(this.#store.select(drillsStatsFeature.selectFilters), this.#store.select(selectComparisonData)),
				map(([_, filters, comparisonData]) => {
					const metrics: SelectItem<string>[] = this.#dataService.getMetrics(
						comparisonData?.results as Map<string, DrillStatsData[]>,
						filters.data?.drillsMapping as DrillsMapping
					);
					const reportCSV = this.#reportService.getComparisonReportCSV(
						comparisonData?.results as Map<string, DrillStatsData[]>,
						filters.selectedFilters.players,
						filters.selectedFilters.datePeriod,
						metrics
					);
					const result = Papa.unparse(reportCSV, {});
					const filename = `Drill Stats Comparison - [${filters.selectedFilters.metric}] - ${moment(
						filters.selectedFilters.datePeriod[0]
					).format(getMomentFormatFromStorage())}.csv`;
					const file = new Blob([result], { type: 'text/csv;charset=utf-8' });
					saveAs(file, filename);
				})
			),
		{ dispatch: false }
	);

	exportPeriodCSV$: Observable<void> = createEffect(
		() =>
			this.#actions$.pipe(
				ofType(UIDrillStatsActions.exportCSV),
				withLatestFrom(this.#store.select(selectSelectedView)),
				filter(([_, selectedView]) => selectedView === DrillStatsViews.Period),
				withLatestFrom(this.#store.select(drillsStatsFeature.selectFilters), this.#store.select(selectPeriodData)),
				map(([_, filters, periodData]) => {
					const metrics: SelectItem<string>[] = this.#dataService.getMetrics(
						periodData?.results as Map<string, DrillStatsData[]>,
						filters.data?.drillsMapping as DrillsMapping
					);
					const reportCSV = this.#reportService.getPeriodTrendReportCSV(
						periodData.results as Map<string, DrillStatsData[]>,
						metrics
					);
					const result = Papa.unparse(reportCSV, {});
					const filename = `Drill Stats Comparison - [${filters.selectedFilters.metric}] - ${moment(
						filters.selectedFilters.datePeriod[0]
					).format(getMomentFormatFromStorage())}.csv`;
					const file = new Blob([result], { type: 'text/csv;charset=utf-8' });
					saveAs(file, filename);
				})
			),
		{ dispatch: false }
	);

	/** Comparison Effects */
	loadComparisonDrillStats$: Observable<Action> = createEffect(() =>
		this.#actions$.pipe(
			ofType(ComparisonDrillStatsActions.loadDrillStats),
			switchMap(({ filters }) =>
				this.#drillApi.getDrillStatsComparison(
					this.#authService.getCurrentUserData().currentTeamId,
					filters.drillsIds,
					filters.datePeriod[0],
					filters.datePeriod[1],
					filters.drillType,
					filters.metric
				)
			),
			map((drillStatsResult: DrillStatsResponse) => {
				const drillStats: DrillStatsResult = {
					results: drillStatsResult.results,
					stats: {
						numSessions: drillStatsResult.numSessions,
						numSessionsMin: drillStatsResult.numSessionsMin,
						numDrills: drillStatsResult.numDrills,
						numDrillsMin: drillStatsResult.numDrillsMin,
						numSessionMinPercentage: drillStatsResult.numSessionMinPercentage
					}
				};
				return ComparisonDrillStatsActions.loadDrillStatsSuccess(drillStats);
			}),
			catchError((error: Error) => of(ComparisonDrillStatsActions.loadDrillStatsFailure(error)))
		)
	);

	loadComparisonDrillStatsFailed$: Observable<void> = createEffect(
		() => {
			return this.#actions$.pipe(
				ofType(ComparisonDrillStatsActions.loadDrillStatsFailure),
				map(({ error }) => this.#alertService.notify('error', 'drillStats', error.message, false))
			);
		},
		{ dispatch: false }
	);

	/** Period Effects */
	loadPeriodDrillStats$: Observable<Action> = createEffect(() =>
		this.#actions$.pipe(
			ofType(PeriodDrillStatsActions.loadDrillStats),
			switchMap(({ filters }) =>
				this.#drillApi.getDrillStatsTrend(
					this.#authService.getCurrentUserData().currentTeamId,
					filters.drillsIds,
					filters.datePeriod[0],
					filters.datePeriod[1],
					filters.drillType,
					filters.metric,
					filters.players.map(({ id }) => id)
				)
			),
			map((drillStatsResult: DrillStatsResponse) => {
				const drillStats: DrillStatsResult = {
					results: drillStatsResult.results,
					stats: {
						numSessions: drillStatsResult.numSessions,
						numSessionsMin: drillStatsResult.numSessionsMin,
						numDrills: drillStatsResult.numDrills,
						numDrillsMin: drillStatsResult.numDrillsMin,
						numSessionMinPercentage: drillStatsResult.numSessionMinPercentage
					}
				};
				return PeriodDrillStatsActions.loadDrillStatsSuccess(drillStats);
			}),
			catchError(error => of(PeriodDrillStatsActions.loadDrillStatsFailure(error)))
		)
	);

	loadDrillStatsFailed$: Observable<void> = createEffect(
		() => {
			return this.#actions$.pipe(
				ofType(PeriodDrillStatsActions.loadDrillStatsFailure),
				map(({ error }) => this.#alertService.notify('error', 'sessionAnalysis', error.message, false))
			);
		},
		{ dispatch: false }
	);

	/** Filters Effects */
	onInitStore$: Observable<Action> = createEffect(() =>
		this.#actions$.pipe(
			ofType(FiltersDrillStatsActions.initFilters),
			map(() => FiltersDrillStatsActions.loadFilters())
		)
	);

	onFiltersUpdate$: Observable<void> = createEffect(
		() =>
			this.#actions$.pipe(
				ofType(FiltersDrillStatsActions.updateFilters),
				withLatestFrom(
					this.#store.select(drillsStatsFeature.selectUi).pipe(map(ui => ui.selectedView)),
					this.#store.select(selectCheckComparison),
					this.#store.select(selectCheckPeriodTrend)
				),
				map(([{ filters }, view, validComparison, validPeriodTrend]) => {
					switch (view) {
						case DrillStatsViews.Comparison:
							if (validComparison) return this.#store.dispatch(ComparisonDrillStatsActions.loadDrillStats(filters));
							break;

						case DrillStatsViews.Period:
							if (validPeriodTrend) return this.#store.dispatch(PeriodDrillStatsActions.loadDrillStats(filters));
							break;
					}
				})
			),
		{ dispatch: false }
	);

	onLoadStoreFilters$: Observable<Action> = createEffect(() =>
		this.#actions$.pipe(
			ofType(FiltersDrillStatsActions.loadFilters),
			switchMap(() =>
				forkJoin([
					this.#teamSeasonApi.getPlayers(this.#currentTeamService.getCurrentSeason()?.id, {
						fields: [
							'id', 'displayName'
						],
						order: 'displayName DESC'
					}),
					this.#teamApi.getDrills(this.#authService.getCurrentUserData().currentTeamId),
					of({
						...this.#drillsMappingService.getDrillsMapping(this.#currentTeamService.getCurrentTeam()),
						themes: [
							...this.#drillsMappingService.getDrillsMapping(this.#currentTeamService.getCurrentTeam()).themes,
							{ label: this.#translateService.instant('drills.theme.noTheme'), value: 'noTheme' }
						]
					})
				])
			),
			map(([players, drills, drillsMapping]: [Partial<Player>[], Drill[], DrillsMapping]) =>
				FiltersDrillStatsActions.loadFiltersSuccess(players, drills, drillsMapping)
			),
			catchError((error: Error) => of(FiltersDrillStatsActions.loadFiltersFailure(error)))
		)
	);
}
