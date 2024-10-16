import { ChangeDetectionStrategy, Component, Injector, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ErrorService } from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ChartData } from 'chart.js';
import { Options } from 'chartjs-plugin-datalabels/types/options';
import { AttendancesStoreActions } from './../../../+state';
import { RootStoreState } from './../../../+state/root-store.state';

@UntilDestroy()
@Component({
	selector: 'iterpro-statistics',
	templateUrl: './statistics.component.html',
	styles: [`::ng-deep .p-datatable.p-datatable-scrollable td.p-frozen-column {
      width: 16%;}`],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatisticsComponent extends EtlBaseInjectable implements OnInit, OnChanges {
	@Input() stats: ChartData;
	@Input() options: Options;
	@Input() showInOrder: boolean;
	@Input() showLabels: boolean;

	showHelper = false;

	legend: Array<{ label: string; tooltip: string }> = [
		{
			label: 'attendance.statistics.legend.apps',
			tooltip: 'attendance.statistics.legend.apps.description'
		},
		{
			label: 'attendance.statistics.legend.startingApps',
			tooltip: 'attendance.statistics.legend.startingApps.description'
		},
		{
			label: 'attendance.statistics.legend.availability',
			tooltip: 'attendance.statistics.legend.availability.description'
		},
		{
			label: 'attendance.statistics.legend.gameRate',
			tooltip: 'attendance.statistics.legend.gameRate.description'
		},
		{
			label: 'attendance.statistics.legend.minutesPlayed',
			tooltip: 'attendance.statistics.legend.minutesPlayed.description'
		},
		{
			label: 'attendance.statistics.legend.playingTime',
			tooltip: 'attendance.statistics.legend.playingTime.description'
		},
		{
			label: 'attendance.statistics.legend.performanceReliability',
			tooltip: 'attendance.statistics.legend.performanceReliability.description'
		},
		{
			label: 'attendance.statistics.legend.periodBreakdown',
			tooltip: 'attendance.statistics.legend.periodBreakdown.description'
		},
		{
			label: 'attendance.statistics.legend.robustness',
			tooltip: 'attendance.statistics.legend.robustness.description'
		},
		{
			label: 'attendance.statistics.legend.daysMissedThroughInjury',
			tooltip: 'attendance.statistics.legend.daysMissedThroughInjury.description'
		},
		{
			label: 'attendance.statistics.legend.daysMissedInternationalDuties',
			tooltip: 'attendance.statistics.legend.daysMissedInternationalDuties.description'
		},
		{
			label: 'attendance.statistics.legend.daysMissedOthers',
			tooltip: 'attendance.statistics.legend.daysMissedOthers.description'
		},
		{
			label: 'attendance.statistics.legend.daysPerGame',
			tooltip: 'attendance.statistics.legend.daysPerGame.description'
		},
		{
			label: 'attendance.statistics.percGameTime',
			tooltip: 'attendance.statistics.legend.percGameTime.description'
		},
		{
			label: 'attendance.statistics.percTrainingTime',
			tooltip: 'attendance.statistics.legend.trainingGameTime.description'
		}
	];

	headers: string[] = [];
	rows: string[][] = [];

	// added ChangeDetectorRef because parent component has ChangeDetection.onPush
	constructor(
		private store$: Store<RootStoreState>,
		private translate: TranslateService,
		private error: ErrorService,
		injector: Injector
	) {
		super(injector);
	}

	ngOnInit() {
		this.translate
			.getTranslation(this.translate.currentLang)
			.pipe(untilDestroyed(this))
			.subscribe({
				error: (error: Error) => this.error.handleError(error)
			});
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes.stats) {
			this.headers = this.stats.datasets.map(({ label }) => label);
			this.headers.unshift(this.translate.instant('general.player'));

			this.rows = this.stats.labels.map((_, index) =>
				this.stats.datasets.map(dataset => String(isNaN(Number(dataset.data[index])) ? '0' : dataset.data[index]))
			);
			this.rows.map((row, index) => row.unshift((this.stats.labels as string[])[index]));
		}
	}

	onToggleOrderAction() {
		this.store$.dispatch(AttendancesStoreActions.statisticsOrderToggled());
	}

	onToggleLabelsAction() {
		this.store$.dispatch(AttendancesStoreActions.statisticsLabelToggled());
	}

	downloadReportAction() {
		this.store$.dispatch(AttendancesStoreActions.statisticsPdfReportRequested());
	}

	/*
	 * On click of Download csv option attendance stats data for each player for selected time range of month will get downloaded in csv format.
	 *
	 * Attendance Statistics calculate metrics for all the players in a defined time period range.
	 * Here in CSV download we don't want all the values for every day but the aggregated values per player per time range(the value of metrics for selected period)
	 *
	 * All the metrics are calculated in the UI.
	 * All the labels should be added to the csv along with dynamic labels.
	 *
	 */
	downloadCsvAction() {
		this.store$.dispatch(AttendancesStoreActions.statisticsCsvReportRequested());
	}
}
