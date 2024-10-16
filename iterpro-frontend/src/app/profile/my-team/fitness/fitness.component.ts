import { Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import { Customer, Player, PlayerApi, Team, TeamSeason, TestMetric } from '@iterpro/shared/data-access/sdk';
import {
	CalendarService,
	ErrorService,
	PRIMARIES,
	ReportService,
	copyValue,
	getDataLabels,
	getDefaultCartesianConfig,
	getDefaultRadarConfig,
	getMomentFormatFromStorage,
	getTimeseriesXAxis,
	radarBackground,
	sortByName
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { saveAs } from 'file-saver';
import { isArray, sortBy } from 'lodash';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import * as Papa from 'papaparse';
import { distinctUntilChanged, filter, first, map, switchMap, tap } from 'rxjs/operators';
import { RootStoreState } from 'src/app/+state/root-store.state';
import getReport from './report';
import { MultiSelectChangeEvent } from 'primeng/multiselect';
import { combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
const moment = extendMoment(Moment);

@UntilDestroy()
@Component({
	selector: 'iterpro-fitness',
	templateUrl: './fitness.component.html',
	styleUrls: ['./fitness.component.scss']
})
export class FitnessComponent implements OnInit, OnChanges {
	@Input() player: Player;
	@Input() customer: Customer;
	@Input() seasons: TeamSeason[];

	table: TableResult = null;
	private radar: RadarResult[] = null;
	private timeline: Array<{ date: Date; series1: number; series2: number }> = [];
	selectedSeason: TeamSeason; // keep it public for reports

	private yAxesIds = ['y', 'yB'];
	private yAxisPositions = ['left', 'right'];

	optionsTimeline: ChartOptions;
	dataTimeline: ChartData;

	optionsRadar: ChartOptions;
	dataRadar: ChartData;

	labels = false;
	selectedMetrics: TestMetric[] = [];
	selectedMetricsRadar: TestMetric[] = [];
	metrics: TestMetric[] = [];
	#store$: Store<RootStoreState> = inject(Store<RootStoreState>);
	#error: ErrorService = inject(ErrorService);
	translate: TranslateService = inject(TranslateService); // keep it public for reports
	#playerApi: PlayerApi = inject(PlayerApi);
	#calendar: CalendarService = inject(CalendarService);
	reportService: ReportService = inject(ReportService); // keep it public for reports
	readonly #authStore = inject(Store<AuthState>);
	readonly #currentTeam$ = this.#authStore.select(AuthSelectors.selectCurrentTeam).pipe(takeUntilDestroyed());
	readonly #currentSeason$ = this.#authStore.select(AuthSelectors.selectTeamSeason).pipe(takeUntilDestroyed());
	#currentTeam: Team;
	ngOnInit() {
		this.translate.getTranslation(this.translate.currentLang).pipe(untilDestroyed(this)).subscribe();
		moment.locale(this.translate.currentLang);
		combineLatest([this.#currentTeam$, this.#currentSeason$])
			.pipe(distinctUntilChanged(), filter(([team, season]) => !!team && !!season),
			switchMap(([team, season]) => {
				this.#currentTeam = team;
				this.selectedSeason = season;
				this.getMetrics();
				return this.getData();
			})).subscribe({
				error: (error: Error) => this.#error.handleError(error)
		})
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['player'] && this.player && this.#currentTeam) {
			this.getMetrics();
		}
	}

	private getMetrics() {
		this.metrics = this.#currentTeam?.metricsTests;
		this.selectedMetrics = [this.metrics[0]];
		this.selectedMetricsRadar = [...this.metrics.slice(0, 5)];
	}

	private getData() {
		return this.#playerApi
			.getFitnessProfile(
				this.player.id,
				this.selectedMetrics.length > 0 ? this.selectedMetrics.map(({ testId }) => testId) : [],
				this.selectedMetrics.length > 0 ? this.selectedMetrics.map(({ metricName }) => metricName) : []
			)
			.pipe(
				first(),
				map(({ table, radar, rawTimeline }) => {
					this.table = table;
					this.timeline = sortBy(rawTimeline, 'date');
					this.radar = radar;
				}),
				tap(() => {
					if (this.selectedSeason) this.renderTimeline(this.timeline);
					this.renderRadar(this.radar);
				})
			);
	}


	handleMetricsSelect(metric: { value: TestMetric[]; originalEvent: MultiSelectChangeEvent }) {
		this.selectedMetrics = metric.value;
		metric.originalEvent.originalEvent.preventDefault();
		if (this.selectedMetrics.length > 2) this.selectedMetrics = this.selectedMetrics.slice(0, 2);
		this.getData().subscribe({
			error: (error: Error) => this.#error.handleError(error)
		});
	}

	handleMetricsRadarSelect(metric: { value: TestMetric[]; originalEvent: MultiSelectChangeEvent }) {
		this.selectedMetricsRadar = metric.value;
		this.renderRadar(this.radar);
	}

	private renderTimeline(results: Array<{ date: Date; series1: number; series2: number }>) {
		// DELETE IF WE WANT TO REMOVE SEASON SELECTOR
		const filteredTimeline = results.filter(({ date }) =>
			moment(date).isBetween(moment(this.selectedSeason.offseason), moment(this.selectedSeason.inseasonEnd), 'day')
		);
		this.optionsTimeline = this.getTimelineChartOptions(this.selectedMetrics, this.#calendar);
		this.dataTimeline = this.getTimelineChartData(filteredTimeline);
	}

	private renderRadar(results: RadarResult[]) {
		this.optionsRadar = this.getChartRadarOptions();
		this.dataRadar = this.getChartRadarData(results);
	}

	private getChartRadarOptions(): ChartOptions {
		const options = { ...getDefaultRadarConfig() };
		options.plugins.tooltip = {
			callbacks: {
				title: ([{ label }]) => <string | string[]>(isArray(label) ? (label as any).join(' ') : label),
				label: ({ formattedValue }) => `Thresholds %: ${formattedValue}%`
			},
			displayColors: false
		};
		delete options.scales.r.max;

		return options;
	}

	private getChartRadarData(results: RadarResult[]): ChartData {
		const labels: string[] = sortByName(this.selectedMetricsRadar, 'metricLabel').map(({ metricLabel }) => metricLabel);
		const sorted = sortByName(
			results
				.map((item: any) => ({ ...item, labelName: `${item.testName} - ${item.metricName}` }))
				.filter(({ labelName }) => labels.includes(labelName)),
			'labelName'
		);
		const mappedToSelected = labels.map(label => sorted.find(({ labelName }) => labelName === label) || {});
		const data = mappedToSelected.map(({ diffThresholdValue, diffThresholdColor }) =>
			diffThresholdValue && diffThresholdColor !== 'grey' ? Number(diffThresholdValue.toFixed(1)) : null
		);
		return {
			labels: labels.map(x => x.split(' - ')),
			datasets: [
				{
					data,
					backgroundColor: radarBackground,
					borderColor: PRIMARIES[0],
					pointBackgroundColor: PRIMARIES[0],
					pointBorderColor: '#fff',
					pointHoverBackgroundColor: PRIMARIES[0],
					pointHoverBorderColor: PRIMARIES[0],
					tension: 0
				}
			]
		};
	}

	private getTimelineChartOptions(metrics: TestMetric[], calendar: CalendarService): ChartOptions {
		const options = {
			...getDefaultCartesianConfig(),
			responsive: true
		};
		let axes = {};
		Object.keys(metrics).forEach((x, index) => {
			axes = {
				...axes,
				[this.yAxesIds[index]]: {
					id: this.yAxesIds[index],
					type: 'linear',
					position: this.yAxisPositions[index],
					grid: {
						drawBorder: false,
						color: index === 0 ? '#333333' : 'transparent',
						display: index === 0
					},
					ticks: {
						beginAtZero: true,
						callback: value => {
							if (value % 1 === 0) {
								return value;
							}
						},
						color: '#ddd',
						padding: 15
					},
					// suggestedMax: 100,
					stacked: false
				}
			};
		});

		options.scales.x = getTimeseriesXAxis(options.scales.x);
		options.scales.x.type = 'time';
		// options.scales.x.ticks.source = 'data';

		options.scales = {
			...options.scales,
			...axes
		};
		options.plugins.tooltip = {
			mode: 'index',
			intersect: true,
			callbacks: {
				title: ([{ label }]) => {
					const date = moment(label);
					return `${date.format(`${getMomentFormatFromStorage()} ddd`)} (${calendar.getGD(date.toDate())})`;
				}
			}
		};

		return options;
	}

	private getTimelineChartData(results: Array<{ date: Date; series1: number; series2: number }>): ChartData {
		let datasets = [];

		this.selectedMetrics.forEach(({ metricLabel }, index) => {
			datasets = [
				...datasets,
				{
					label: metricLabel,
					data: results.map(({ series1, series2 }) => (index === 0 ? series1 : series2)),
					yAxisID: this.yAxesIds[index],
					borderColor: PRIMARIES[index],
					pointBorderColor: PRIMARIES[index],
					pointBackgroundColor: PRIMARIES[index],
					pointHoverBackgroundColor: PRIMARIES[index],
					pointHoverBorderColor: '#fff',
					pointRadius: 2,
					borderWidth: 2,
					spanGaps: true,
					cubicInterpolationMode: 'monotone'
				}
			];
		});
		return { labels: results.map(({ date }) => date), datasets: datasets };
	}

	onToggleLabels() {
		this.labels = !this.labels;
		const temp = copyValue(this.dataTimeline);
		this.dataTimeline.datasets.forEach(x => {
			x.datalabels = getDataLabels(this.labels);
		});
		this.dataTimeline = copyValue(temp);
	}

	downloadReportPdf() {
		const data = getReport(this);
		this.reportService
			.getImage(data.image)
			.pipe(first(), untilDestroyed(this))
			.subscribe(image => {
				this.reportService.getReport('player_fitness', { ...data, image });
			});
	}

	downloadReportCSV() {
		const rows = [];
		for (let i = 0; i < this.dataTimeline.labels.length; i += 1) {
			const row = { date: moment(this.dataTimeline.labels[i]).format(getMomentFormatFromStorage()) };
			let isNull = true;
			for (let j = 0; j < this.dataTimeline.datasets.length; j += 1) {
				row[this.dataTimeline.datasets[j].label] = this.dataTimeline.datasets[j].data[i];
				if (this.dataTimeline.datasets[j].data[i] !== null) isNull = false;
			}
			if (!isNull) rows.push(row);
		}
		const results = Papa.unparse(rows, {});
		const fileName = 'Player fitness ' + this.player.displayName + '.csv';

		const blob = new Blob([results], { type: 'text/plain' });
		saveAs(blob, fileName);
	}

	isOutsideCurrentSeason(date: Date): boolean {
		return date && moment(date).isBetween(this.selectedSeason.offseason, this.selectedSeason.inseasonEnd, 'day', '[]');
	}
}

interface RadarResult {
	date: Date;
	testInstanceId: string;
	testId: string;
	testPurpose: string;
	testName: string;
	metricName: string;
	valueCurrent: number;
	datePrev: Date;
	valuePrev: number;
	diffThresholdColor: string;
	diffThresholdValue: number;
	tooltip: {
		key: string;
		value: string;
	};
	diffValuePercentage: string;
}

interface TableResult {
	[key: string]: RadarResult;
}
