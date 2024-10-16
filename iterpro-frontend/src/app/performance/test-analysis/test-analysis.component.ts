import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Customer,
	CustomerApi,
	CustomerTeamSettings,
	CustomerTeamSettingsApi,
	LoopBackAuth,
	Player,
	TeamSeasonApi,
	Test,
	TestApi,
	TestInstance,
	TestInstanceApi
} from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	ErrorService,
	ReportService,
	ToServerEquivalentService,
	getMomentFormatFromStorage,
	getTeamSettings,
	sortByDate,
	sortByName
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ChartData } from 'chart.js';
import { saveAs } from 'file-saver';
import { isEmpty, omit, sortBy } from 'lodash';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import { SelectItem } from 'primeng/api';
import { Subscription } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import fields from './items';
import { TestAnalysisComparisonComponent } from './test-analysis-comparison/test-analysis-comparison.component';
import { TestAnalysisPeriodComponent } from './test-analysis-period/test-analysis-period.component';

@UntilDestroy()
@Component({
	templateUrl: './test-analysis.component.html',
	styles: [`::ng-deep .p-datatable.p-datatable-scrollable td.p-frozen-column {
      width: 16%;}`],
})
export class TestAnalysisComponent implements OnInit {
	viewType: ViewType = ViewType.Comparison;
	viewTypes = ViewType;

	dataPeriod: { chart: ChartData; table: TablePeriod[] };
	selectedMetricsPeriod: SelectItem[] = [];
	selectedMetricsPeriod2: SelectItem[] = [];
	metrics2: SelectItem[] = [];
	selectedTest2: Test;
	filteredTests2: Test[] = [];
	selectedTest1: Test;
	filteredTests1: Test[] = [];
	selectedMetricsPeriod1: SelectItem[] = [];
	days: number;
	today: Date = null;
	periodRange: Date[] = [];
	selectedPlayersPeriod: Player[] = [];
	playersPeriod: Player[] = [];

	order: boolean;
	dataComparison: { label: string; series0: number; series1: number }[] = null;
	selectedMetricsComparison: string[] = [];
	metrics: SelectItem[] = [];
	selectedInstance: TestInstance;
	instances: TestInstance[] = [];
	selectedTest: Test;
	filteredTests: Test[] = [];
	tests: Test[] = [];
	selectedPlayers: Player[] = [];
	players: Player[] = [];
	purposes: { label: string; value: string }[] = [];
	obs: Subscription[] = [];
	plMap: Map<string, string> = new Map<string, string>();

	route$: Subscription;
	testModelIdRoute: string;
	dateTestRoute: Date;
	labels: boolean;
	percent: boolean;
	playersPeriodLoaded: boolean;
	playersLoaded: boolean;
	customer: Customer;
	currentPinnedTestsIds: string[];
	teamSettingsToUpdate: CustomerTeamSettings;
	@ViewChild(TestAnalysisComparisonComponent, {static: false}) testAnalysisComparison: TestAnalysisComparisonComponent;
	@ViewChild(TestAnalysisPeriodComponent, {static: false}) testAnalysisPeriod: TestAnalysisPeriodComponent;

	constructor(
		private auth: LoopBackAuth,
		private testApi: TestApi,
		private error: ErrorService,
		private translate: TranslateService,
		private alert: AlertService,
		private reportService: ReportService,
		private route: ActivatedRoute,
		private currentTeamService: CurrentTeamService,
		private router: Router,
		private toServer: ToServerEquivalentService,
		private customerTeamSettingsApi: CustomerTeamSettingsApi,
		private customerApi: CustomerApi,
		private teamSeasonApi: TeamSeasonApi,
		private testInstanceApi: TestInstanceApi
	) {
		this.downloadComparisonReport = this.downloadComparisonReport.bind(this);
		this.downloadCsvDataComparison = this.downloadCsvDataComparison.bind(this);
		this.downloadPeriodReport = this.downloadPeriodReport.bind(this);
	}

	ngOnInit() {
		this.today = moment().startOf('day').toDate();
		this.translate
			.getTranslation(this.translate.currentLang)
			.pipe(untilDestroyed(this))
			.subscribe(val => {
				this.purposes = sortByName(fields['purposes'], 'label');
				this.loadData();
			});
		this.route$ = this.route.paramMap.pipe(untilDestroyed(this)).subscribe((params: ParamMap) => {
			if (params['params']) {
				this.testModelIdRoute = params['params'].id;
				this.dateTestRoute = params['params'].date;
			} else {
				this.testModelIdRoute = null;
				this.dateTestRoute = null;
			}
		});
	}

	private loadData() {
		this.loadPinnedAndTests()
			.pipe(
				switchMap(() => this.getPlayers()),
				switchMap(() => this.getTests()),
				untilDestroyed(this)
			)
			.subscribe({
				next: () => {
					if (this.testModelIdRoute && this.dateTestRoute) {
						this.selectedTest = this.tests.find(({ id }) => String(id) === this.testModelIdRoute);
						if (this.selectedTest) this.onSelectTest({ value: this.selectedTest }, this.dateTestRoute);
						else {
							this.selectedTest = this.tests[0];
							this.onSelectTest({ value: this.tests[0] });
						}
					} else {
						this.selectedTest = this.tests[0];
						this.onSelectTest({ value: this.tests[0] });
					}
					this.preselectPeriod();
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private loadPinnedAndTests() {
		// Getting pinned test informstion per customer per team.
		return this.customerApi.getCurrent({ include: ['teamSettings'] }).pipe(
			map((customer: Customer) => {
				this.customer = customer;
				this.teamSettingsToUpdate = getTeamSettings(this.customer.teamSettings, this.auth.getCurrentUserData().currentTeamId);
				this.currentPinnedTestsIds = [...this.teamSettingsToUpdate.pinnedTestsIds];
			})
		);
	}

	private getPlayers() {
		return this.teamSeasonApi.getPlayers(this.currentTeamService.getCurrentSeason().id).pipe(
			map((players: Player[]) => {
				this.players = sortBy(players, 'displayName');
				this.players.forEach(player => {
					this.plMap.set(player.id, player.displayName);
				});
			})
		);
	}

	private getTests() {
		return this.testApi
			.find({
				where: {
					teamId: { inq: [this.auth.getCurrentUserData().currentTeamId, 'GLOBAL'] },
					medical: this.router.url.includes('medical')
				}
			})
			.pipe(
				switchMap((tests: Test[]) => {
					const filtered: Test[] = tests.filter(({ customFields }) => customFields?.length > 0);
					this.tests = this.sortByPinned(sortByName(filtered, 'name'));
					this.filteredTests = this.sortByPinned(sortByName(tests, 'name'));
					this.filteredTests1 = this.sortByPinned(sortByName(tests, 'name'));
					this.filteredTests2 = this.sortByPinned(sortByName(tests, 'name'));
					return this.testInstanceApi.find({
						where: {
							testId: { inq: this.tests.map(({ id }) => id) },
							teamId: this.auth.getCurrentUserData().currentTeamId
						}
					});
				}),
				map((instances: TestInstance[]) => {
					this.tests.forEach(test => {
						test.instances = instances.filter(({ testId }) => testId === test.id);
					});
				})
			);
	}

	onChangeTab(event: { index: ViewType }) {
		this.viewType = event.index;
		this.playersPeriod = this.players;
		this.selectedPlayersPeriod = this.playersPeriod;
		this.playersPeriodLoaded = true;
		if (this.viewType === 1 && this.selectedTest) {
			this.selectedTest1 = this.selectedTest;
			this.onSelectTest1({ value: this.selectedTest1 });
		}
	}

	onSelectPurpose(event) {
		if (isEmpty(event.value)) {
			this.filteredTests = this.tests;
		} else {
			this.filteredTests = this.tests.filter(val => {
				if (val.purpose == null) return false;
				else {
					return val.purpose.find(v => event.value.indexOf(v) !== -1);
				}
			});
		}
	}

	onSelectTest(event: SelectItem, dateInstancePreselected = null) {
		this.instances = sortByDate(event.value.instances, 'date').reverse();
		this.instances.forEach(x => (x.date = moment(x.date).toDate()));
		this.metrics = this.getCustomFieldsValues(event.value);
		this.metrics = sortByName(this.metrics, 'label');
		if (isEmpty(this.instances)) {
			this.alert.notify('warn', 'testAnalysis', 'alert.noTestInstanceFound', false);
			this.selectedInstance = null;
			this.selectedMetricsComparison = null;
		} else {
			if (dateInstancePreselected) {
				this.selectedInstance = this.instances.find(inst => moment(inst.date).isSame(moment(dateInstancePreselected), 'day'));
				if (!this.selectedInstance) this.selectedInstance = this.instances[0];
			} else {
				this.selectedInstance = this.instances[0];
			}
			this.selectedMetricsComparison = [this.metrics[0].value];
			this.selectedMetricsPeriod1 = [this.metrics[0].value];
			this.onSelectInstance();
		}
	}

	onSelectInstance() {
		const playerIds = this.selectedInstance?._testResults.map(({ playerId }) => playerId);
		this.selectedPlayers = this.players.filter(({ id }) => playerIds.includes(id));
		this.selectedPlayersPeriod = this.selectedPlayers;
		this.playersLoaded = true;
		this.getChartDataComparison(this.selectedTest, this.selectedInstance?.date, this.selectedPlayers, this.selectedMetricsComparison);
	}

	onSelectMetrics(event) {
		event.originalEvent.originalEvent.preventDefault();

		if (this.selectedMetricsComparison.length > 2) {
			this.selectedMetricsComparison = this.selectedMetricsComparison.slice(0, 2);
		}
		if (this.selectedInstance) {
			this.getChartDataComparison(this.selectedTest, this.selectedInstance?.date, this.selectedPlayers, this.selectedMetricsComparison);
		}
	}

	onSelectPlayers() {
		if (!isEmpty(this.selectedPlayers) && this.selectedInstance) {
			this.getChartDataComparison(this.selectedTest, this.selectedInstance?.date, this.selectedPlayers, this.selectedMetricsComparison);
		} else {
			this.dataComparison = null;
		}
	}

	onToggleOrder() {
		this.order = !this.order;
	}

	getChartDataComparison(test: Test, date: Date, players: Player[], metrics: string[]) {
		this.dataComparison = null;

		this.testApi
			.graphComparison(
				this.auth.getCurrentUserData().currentTeamId,
				test.id,
				moment(date).toDate(),
				metrics,
				players.map(({ id }) => id)
			)
			.pipe(untilDestroyed(this))
			.subscribe(
				(data: { label: string; series0: number; series1: number }[]) => {
					data.forEach(x => (x.label = this.plMap.get(x.label)));
					data = sortByName(data, 'label');
					this.dataComparison = data;
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	private preselectPeriod() {
		let day = this.today;
		// If I'm seeing an older season, I'll take as reference for date period the end of that season, otherwise I'll take today
		if (!moment().isBetween(this.currentTeamService.getCurrentSeason().offseason, this.currentTeamService.getCurrentSeason().inseasonEnd))
			day = this.currentTeamService.getCurrentSeason().inseasonEnd;
		this.periodRange = [moment(day).subtract(7, 'days').startOf('day').toDate(), moment(day).startOf('day').toDate()];
		this.selectedPlayersPeriod = this.players;
		this.onSelectPeriod();
		if (this.testModelIdRoute) {
			this.selectedTest1 = this.tests.find(({ id }) => String(id) === this.testModelIdRoute);
			if (this.selectedTest) {
				this.onSelectTest1({ value: this.selectedTest1 });
			} else {
				this.selectedTest1 = this.filteredTests1[0];
				this.onSelectTest1({ value: this.selectedTest1 });
			}
		} else {
			this.selectedTest1 = this.filteredTests1[0];
			this.onSelectTest1({ value: this.selectedTest1 });
		}
	}

	onSelectPlayerPeriod() {
		if (!isEmpty(this.periodRange) && this.selectedTest1 && !isEmpty(this.selectedMetricsPeriod1)) {
			this.getChartDataPeriod();
		}
	}

	onSelectPeriod() {
		if (this.periodRange[1]) {
			this.days = moment(this.periodRange[1]).diff(moment(this.periodRange[0]), 'day') + 1;
			if (this.selectedTest1 && !isEmpty(this.selectedMetricsPeriod1)) {
				this.getChartDataPeriod();
			}
		}
	}

	onSelectPurpose1(event) {
		if (isEmpty(event.value)) {
			this.filteredTests1 = this.tests;
		} else {
			this.filteredTests1 = this.tests.filter(val => {
				if (val.purpose == null) return false;
				else {
					return val.purpose.find(v => event.value.indexOf(v) !== -1);
				}
			});
		}
	}

	onSelectTest1(event?: { value: Test }) {
		this.metrics = this.getCustomFieldsValues(event.value);
		this.metrics = sortByName(this.metrics, 'label');
		this.selectedMetricsPeriod1 = [this.metrics[0].value];

		if (!isEmpty(this.selectedMetricsPeriod1)) {
			this.getChartDataPeriod();
		}
	}

	onSelectMetricsPeriod1(event) {
		event.originalEvent.originalEvent.preventDefault();

		if (this.selectedMetricsPeriod2.length >= 1) {
			this.selectedMetricsPeriod1 = this.selectedMetricsPeriod1.slice(0, 1);
			// this.getChartDataPeriod();
		} else if (this.selectedMetricsPeriod1.length > 2) {
			this.selectedMetricsPeriod1 = this.selectedMetricsPeriod1.slice(0, 2);
		} else {
			this.selectedTest2 = null;
			this.selectedMetricsPeriod2 = [];
		}
		this.getChartDataPeriod();
	}

	onSelectPurpose2(event) {
		if (isEmpty(event.value)) {
			this.filteredTests2 = this.tests;
		} else {
			this.filteredTests2 = this.tests.filter(val => {
				if (val.purpose == null) return false;
				else {
					return val.purpose.find(v => event.value.indexOf(v) !== -1);
				}
			});
		}
	}

	onSelectTest2(event: { value: Test }) {
		this.metrics2 = this.getCustomFieldsValues(event.value);
		this.selectedMetricsPeriod2 = [this.metrics2[0].value];

		if (!isEmpty(this.selectedMetricsPeriod2)) {
			this.getChartDataPeriod();
		}
	}

	onSelectMetricsPeriod2(event) {
		event.originalEvent.originalEvent.preventDefault();

		if (isEmpty(this.selectedMetricsPeriod2)) {
			// this.selectedTest2 = null;
		} else if (this.selectedMetricsPeriod1.length >= 1) {
			this.selectedMetricsPeriod2 = this.selectedMetricsPeriod2.slice(0, 1);
			// this.getChartDataPeriod();
		} else if (this.selectedMetricsPeriod2.length > 2) {
			this.selectedMetricsPeriod2 = this.selectedMetricsPeriod2.slice(0, 2);
		}
		this.getChartDataPeriod();
	}

	getChartDataPeriod() {
		if (!this.selectedPlayersPeriod) return;
		this.obs = [
			...this.obs,
			this.testApi
				.graphTrend(
					this.auth.getCurrentUserData().currentTeamId,
					this.selectedTest1.id,
					this.selectedMetricsPeriod1,
					this.selectedTest2 && !isEmpty(this.selectedMetricsPeriod2) ? this.selectedTest2.id : null,
					this.selectedMetricsPeriod2,
					this.toServer.convert(moment(this.periodRange[0]).startOf('day').toDate()),
					this.toServer.convert(moment(this.periodRange[1]).endOf('day').toDate()),
					this.selectedPlayersPeriod.map(({ id }) => id)
				)
				.pipe(untilDestroyed(this))
				.subscribe(
					(data: { chart: any; table: [] }) => {
						// data = sortByDate(data, 'label');
						this.selectedMetricsPeriod = [...this.selectedMetricsPeriod1, ...this.selectedMetricsPeriod2];
						this.dataPeriod = data;
					},
					(error: Error) => this.error.handleError(error)
				)
		];
	}

	downloadCsvDataComparison() {
		try {
			const results = [];
			const testDateString = moment(this.selectedInstance?.date).startOf('day').format(getMomentFormatFromStorage());
			const testName = this.selectedTest.name;
			for (const res of this.dataComparison) {
				const objTemp = {};
				objTemp['date'] = testDateString;
				objTemp['player'] = res.label;
				if (this.selectedMetricsComparison && this.selectedMetricsComparison.length > 0) {
					const metrics1String = this.selectedMetricsComparison[0];
					const compositeString = testName + '-' + metrics1String;
					objTemp[compositeString] = res.series0 ? res.series0 : '';
				}
				if (this.selectedMetricsComparison && this.selectedMetricsComparison.length > 1) {
					const metrics2String = this.selectedMetricsComparison[1];
					const compositeString2 = testName + '-' + metrics2String;
					objTemp[compositeString2] = res.series1 ? res.series1 : '';
				}
				results.push(objTemp);
			}
			const parsedResults = Papa.unparse(results, {});

			const fileName = `Test Analysis - Comparison ${moment(this.selectedInstance?.date)
				.startOf('day')
				.format(getMomentFormatFromStorage())}.csv`;

			const contentDispositionHeader: string = 'Content-Disposition: attachment; filename=' + fileName;
			const blob = new Blob([parsedResults], { type: 'text/plain' });
			saveAs(blob, fileName);
		} catch (e) {
			console.error(e);
		}
	}

	onTogglePercent() {
		this.percent = !this.percent;
	}

	downloadCsvDataTrend() {
		const results = [];
		for (const row of this.dataPeriod.table) {
			const dates = omit(row, 'playerId');
			Object.keys(dates).forEach(key => {
				const objTemp = {};
				objTemp['date'] = key;
				objTemp['player'] = this.players.find(({ id }) => id === row['playerId'])?.displayName;
				if (this.selectedMetricsPeriod1 && this.selectedMetricsPeriod1.length > 0) {
					const metrics1String = this.selectedMetricsPeriod1[0];
					const compositeString = this.selectedTest1.name + '-' + metrics1String;
					objTemp[compositeString] = row[key][0] ? row[key][0] : '';
				}
				if (this.selectedMetricsPeriod1 && this.selectedMetricsPeriod1.length > 1) {
					const metrics2String = this.selectedMetricsPeriod1[1];
					const compositeString2 = this.selectedTest1.name + '-' + metrics2String;
					objTemp[compositeString2] = row[key][1] ? row[key][1] : '';
				} else if (this.selectedMetricsPeriod2 && this.selectedMetricsPeriod2.length > 0) {
					const metrics2String = this.selectedMetricsPeriod2[0];
					const compositeString2 = this.selectedTest2.name + '-' + metrics2String;
					objTemp[compositeString2] = row[key][1] ? row[key][1] : '';
				}
				results.push(objTemp);
			});
		}
		const parsedResults = Papa.unparse(results, {});
		const fileName =
			'Test Analysis - Trend ' +
			moment(this.periodRange[0]).startOf('day').format('DD/MM/YYYY') +
			' - ' +
			moment(this.periodRange[1]).startOf('day').format('DD/MM/YYYY') +
			'.csv';
		const contentDispositionHeader: string = 'Content-Disposition: attachment; filename=' + fileName;
		const blob = new Blob([parsedResults], { type: 'text/plain' });
		saveAs(blob, fileName);
	}

	downloadComparisonReport(chart) {
		chart.data = {
			...chart.data,
			labels: chart.data.labels.map(x => (Array.isArray(x) ? x.join(' ') : x))
		};
		const t = this.translate.instant.bind(this.translate);
		const data = {
			date: {
				label: t('sidebar.date'),
				value: moment(this.selectedInstance?.date).format(getMomentFormatFromStorage())
			},
			...chart
		};
		const fileName = `Test Analysis - Comparison ${moment(this.selectedInstance?.date)
			.startOf('day')
			.format(getMomentFormatFromStorage())}`;
		this.reportService.getReport('test_comparison', data, '', null, fileName);
	}

	downloadPeriodReport(chart, table) {
		const t = this.translate.instant.bind(this.translate);
		chart.options.scales.y = {
			...chart.options.scales.y,
			ticks: {
				...chart.options.scales.y.ticks,
				beginAtZero: false
			}
		};
		chart.data.datasets = chart.data.datasets.map(dataset => ({
			...dataset,
			data: dataset.data
		}));
		const data = {
			// player: this.selectedPlayerPeriod.displayName,
			days: { label: t('sidebar.counterDays'), value: this.days },
			period: {
				label: t('sidebar.period'),
				value: this.periodRange.map(d => moment(d).format(getMomentFormatFromStorage())).join(' - ')
			},
			test1: {
				label: 'Test 1',
				value: this.selectedTest1 ? this.selectedTest1.name : '-'
			},
			metrics1: {
				label: t('sidebar.metrics'),
				value: this.selectedMetricsPeriod1.join(', ')
			},
			test2: {
				label: 'Test 2',
				value: this.selectedTest2 ? this.selectedTest2.name : '-'
			},
			metrics2: {
				label: t('sidebar.metrics'),
				value: this.selectedMetricsPeriod2.join(', ')
			},
			...chart,
			...table
		};
		const fileName = `Test Analysis - Period ${this.periodRange.map(d => moment(d).format(getMomentFormatFromStorage())).join(' - ')}`;
		this.reportService.getReport('test_period_trend', data, '', null, fileName);
	}

	onToggleLabels() {
		this.labels = !this.labels;
	}

	private getCustomFieldsValues(test: Test): SelectItem[] {
		return test.customFields.map(field => {
			const value = typeof field === 'string' ? field : field.value;
			return { label: value, value };
		});
	}

	// Putting all the pinned tests at top of the list.
	private sortByPinned(tests: Test[]) {
		return tests.sort((a, b) => {
			if (this.currentPinnedTestsIds && this.currentPinnedTestsIds.includes(a.id) && this.currentPinnedTestsIds.includes(b.id)) {
				return 0;
			}
			if (this.currentPinnedTestsIds && this.currentPinnedTestsIds.includes(a.id)) {
				return -1;
			}
			if (this.currentPinnedTestsIds && this.currentPinnedTestsIds.includes(b.id)) {
				return 1;
			}
		});
	}

	// Find if all the tests pinned by customer for selected team.
	isTestPinned(testReceived: Test): boolean {
		const currentTeamSettings = getTeamSettings(this.customer.teamSettings, this.auth.getCurrentUserData().currentTeamId);
		const pinnedTestIds = currentTeamSettings ? currentTeamSettings.pinnedTestsIds : [];
		return pinnedTestIds && pinnedTestIds.length > 0 && pinnedTestIds.includes(testReceived.id);
	}

	// Saving pinned test ids.
	savePin(event, testReceived: Test) {
		event.stopPropagation();
		let pinnedTestsIds = [];

		// toggle pin value by removing or adding testIds from customerTestsIds array of CustomerTeamSettings
		if (this.currentPinnedTestsIds) {
			if (this.currentPinnedTestsIds.includes(testReceived.id)) {
				//  Found, Remove
				this.currentPinnedTestsIds = this.currentPinnedTestsIds.filter(item => item !== testReceived.id);
			} else {
				// Now Found, Add
				this.currentPinnedTestsIds.push(testReceived.id);
			}
			pinnedTestsIds = this.currentPinnedTestsIds;
		}

		// destructurization to edit the teamSettingsToUpdate object
		this.teamSettingsToUpdate = { ...this.teamSettingsToUpdate, pinnedTestsIds };

		// Saving teamSettings(current team) to db for current customer.
		this.customerTeamSettingsApi
			.patchAttributes(this.teamSettingsToUpdate.id, { pinnedTestsIds })
			.pipe(
				switchMap(() => this.loadPinnedAndTests()),
				untilDestroyed(this)
			)
			.subscribe({
				next: () => (this.tests = this.sortByPinned(sortByName(this.tests, 'name'))),
				error: (error: Error) => this.error.handleError(error)
			});
	}

	get metrics1Limit(): number {
		return 2 - this.selectedMetricsPeriod2.length;
	}

	get metrics2Limit(): number {
		return 2 - this.selectedMetricsPeriod1.length;
	}
}

enum ViewType {
	Comparison = 0,
	Period = 1
}

interface TablePeriod {
	[key: string]: {
		0: number;
		1: number;
	};
}
