import { Component, OnDestroy, OnInit } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { Event, LoopBackAuth, PlanningViewApi, Team } from '@iterpro/shared/data-access/sdk';
import {
	CalendarService,
	ConstantService,
	ErrorService,
	copyValue,
	getDataLabels,
	getDefaultCartesianConfig,
	getMomentFormatFromStorage,
	getTimeseriesXAxis,
	sortByDate
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ChartOptions } from 'chart.js';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import { SelectItem } from 'primeng/api';

const moment = extendMoment(Moment);

@UntilDestroy()
@Component({
	selector: 'iterpro-plan-viewer',
	templateUrl: './plan-viewer.component.html',
	styleUrls: ['./plan-viewer.component.css']
})
export class PlanViewerComponent implements OnInit, OnDestroy {
	themeList: SelectItem[];
	format = [];
	theme = [];
	opponent = [];
	currentTeam: Team;
	palette: any[] = ['#00CC6A', 'green'];
	datePeriod: Date[] = null;
	events: Event[];
	options: any = null;
	data: any = null;
	rangeDays: any[];
	rangeTraining: any[];
	rangeGame: any[];
	rangeFriendly: any[];
	viewContents = false;
	rangeEvents: any[];
	counters: any = {
		game: 0,
		training: 0,
		friendly: 0
	};
	datalabels: boolean;
	subtheme = [];
	subthemeList = [];

	constructor(
		private error: ErrorService,
		private teamApi: CurrentTeamService,
		private auth: LoopBackAuth,
		private calendar: CalendarService,
		private planningViewService: PlanningViewApi,
		private translate: TranslateService,
		private constants: ConstantService
	) {
		this.labelBinding = this.labelBinding.bind(this);
		this.currentTeam = this.teamApi.getCurrentTeam();
	}

	ngOnInit() {
		this.translate
			.getTranslation(this.translate.currentLang)
			.pipe(untilDestroyed(this))
			.subscribe(x => {
				this.themeList = this.constants.getEventTheme();
				this.subthemeList = this.constants.getFieldThemeList();
				this.datePeriod = [moment().subtract('1', 'month').startOf('day').toDate(), moment().endOf('day').toDate()];
				this.fetchData();
			});
	}

	ngOnDestroy() {
		console.debug('Plan Viewer Destroy');
	}

	getDays() {
		return this.datePeriod && this.datePeriod.length >= 2
			? moment(this.datePeriod[1]).diff(this.datePeriod[0], 'days')
			: '';
	}

	fetchData(e?) {
		if (this.datePeriod[1]) {
			this.datePeriod[1] = moment(this.datePeriod[1]).endOf('day').toDate();
			this.planningViewService
				.planningViewPlan(this.auth.getCurrentUserData().currentTeamId, this.datePeriod[0], this.datePeriod[1])
				.pipe(untilDestroyed(this))
				.subscribe(
					(results: any[]) => {
						const resDays = results.map(x => moment(x.label, getMomentFormatFromStorage()));
						const days = Array.from(moment.range(this.datePeriod[0], this.datePeriod[1]).by('days'));
						days.forEach((day: any) => {
							if (!resDays.find(x => x.isSame(day, 'day'))) {
								results = [
									...results,
									{
										label: day.format(getMomentFormatFromStorage()),
										game: [],
										friendly: [],
										training: [],
										theme: [null, null, null, null],
										subtheme: [null, null, null, null],
										opponent: [null, null, null, null],
										format: [null, null, null, null]
									}
								];
							}
						});
						this.events = sortByDate(results, 'label');
						this.dateRange(this.events, days);
						this.setCounters();
						this.renderContents();
					},
					(error: Error) => this.error.handleError(error)
				);
		}
	}

	private setCounters() {
		this.counters = {
			training: 0,
			game: 0,
			friendly: 0
		};
		this.events.forEach((event: any) => {
			this.counters.training += event.training.length;
			this.counters.game += event.game.length;
			this.counters.friendly += event.friendly.length;
		});
	}

	private dateRange(events, days) {
		let categories = [];
		let trainings = [];
		let friendly = [];
		let games = [];
		this.format = [];
		this.theme = [];
		this.subtheme = [];
		this.opponent = [];

		events.forEach(x => {
			categories = [...categories, moment(x, getMomentFormatFromStorage())];
			trainings = [...trainings, x.training];
			games = [...games, x.game];
			friendly = [...friendly, x.friendly];
			this.format = [...this.format, x.format];
			this.theme = [...this.theme, x.theme];
			this.subtheme = [...this.subtheme, x.subtheme];
			this.opponent = [...this.opponent, x.opponent];
		});

		this.renderGraph(
			days,
			trainings,
			friendly,
			games,
			this.format,
			this.theme,
			this.opponent,
			this.calendar,
			this.translate,
			this.labelBinding
		);
	}

	private renderContents() {
		this.viewContents = true;
	}

	private renderGraph(days, trainings, friendly, games, format, theme, opponent, calendar, translate, labelBinding) {
		const options: ChartOptions = { ...getDefaultCartesianConfig() };
		let first = [];
		let second = [];

		trainings.forEach(x => {
			first = [...first, x[0]];
			second = [...second, x[1]];
		});

		this.data = {
			labels: days,
			datasets: [
				{
					label: this.translate.instant('event.format.training'),
					backgroundColor: this.palette[0],
					stack: '0',
					data: first
				},
				{
					label: this.translate.instant('event.format.training'),
					backgroundColor: this.palette[1],
					stack: '0',
					data: second
				},
				{
					label: this.translate.instant('event.format.game'),
					backgroundColor: '#FF4343',
					stack: '0',
					data: games.map(x => x[0])
				},
				{
					label: this.translate.instant('event.format.friendly'),
					backgroundColor: '#FF8C00',
					stack: '0',
					data: friendly.map(x => x[0])
				}
			]
		};

		options.scales.x = getTimeseriesXAxis(options.scales.x, calendar);
		options.plugins = {
			datalabels: {
				display: false
			}
		};
		options.responsive = true;
		options.maintainAspectRatio = true;
		(options.scales.y as any).stacked = true;
		options.scales.y.ticks.callback = value => {
			if (value === 1) return translate.instant('event.effort.1');
			else if (value === 2) return translate.instant('event.effort.2');
			else if (value === 3) return translate.instant('event.effort.3');
			else if (value === 4) return translate.instant('event.effort.4');
			else if (value === 5) return translate.instant('event.effort.5');
			else if (value === 6) return translate.instant('event.effort.6');
			else return '';
		};
		(options.scales.y as any).title = {
			display: true,
			text: 'Workload',
			color: '#ddd'
		};
		options.plugins.tooltip = {
			mode: 'index',
			intersect: false,
			callbacks: {
				title: ([{ label }, ...{}]) => {
					const date = moment(label);
					return `${date.format('DD/MM/YYYY ddd')} (${calendar.getGD(date.toDate())})`;
				}
				// label: function({ formattedValue, dataset, dataIndex, datasetIndex }) {
				// 	if (formattedValue) {
				// 		if (Number(formattedValue) !== NaN) {
				// 			return `Workload: ${formattedValue} - ${labelBinding(formattedValue, dataset, dataIndex, datasetIndex)}`;
				// 		} else {
				// 			return 'Workload: not set';
				// 		}
				// 	}
				// }
			}
		};
		this.options = options;
	}

	labelBinding(formattedValue, { label }, dataIndex, datasetIndex) {
		if (label === 'Game' || label === 'Friendly') {
			return `${this.translate.instant('event.opponent')}: ${this.opponent[datasetIndex].find(x => x)}`;
		} else {
			if (this.theme[datasetIndex].filter(x => x).length > 1) {
				let theme = this.theme[datasetIndex][dataIndex];
				theme = this.themeList.find(({ value }) => value === theme).label;
				let subtheme = '';
				if (theme === 'event.theme.field') {
					subtheme = this.subtheme[datasetIndex][dataIndex];
					subtheme = this.subthemeList.find(({ value }) => value === subtheme).label;
				}
				if (subtheme !== '')
					subtheme = ` - ${this.translate.instant('event.subtheme')}: ${this.translate.instant(subtheme)}`;
				return `${this.translate.instant('event.theme')}: ${this.translate.instant(theme)}` + subtheme;
			} else {
				let theme = this.theme[datasetIndex].find(x => x);
				theme = this.themeList.find(({ value }) => value === theme).label;
				let subtheme = '';
				if (theme === 'event.theme.field') {
					subtheme = this.subtheme[datasetIndex][dataIndex];
					subtheme = this.subthemeList.find(({ value }) => value === subtheme).label;
				}
				if (subtheme !== '')
					subtheme = ` - ${this.translate.instant('event.subtheme')}: ${this.translate.instant(subtheme)}`;
				return `${this.translate.instant('event.theme')}: ${this.translate.instant(theme)}` + subtheme;
			}
		}
	}

	onToggleLabels() {
		this.datalabels = !this.datalabels;
		const temp = copyValue(this.data);
		this.data.datasets.forEach(x => {
			x.datalabels = getDataLabels(this.datalabels);
		});
		this.data = copyValue(temp);
	}
}
