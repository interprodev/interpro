import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Injury, Player, ReadinessSidebarViewType, Team } from '@iterpro/shared/data-access/sdk';
import {
	AzureStoragePipe,
	CalendarService,
	ReportService,
	ToServerEquivalentService,
	clearCircularJSON,
	formatLabel,
	getBackendFormat,
	getDataLabels,
	getDefaultCartesianConfig,
	getMomentFormatFromStorage,
	getTimeseriesXAxis,
	stringToColour
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { saveAs } from 'file-saver';
import { cloneDeep, groupBy, omit, sortBy } from 'lodash';
import * as momentLib from 'moment';
import { extendMoment } from 'moment-range';
import * as Papa from 'papaparse';
import { SelectItem } from 'primeng/api';

const moment = extendMoment(momentLib);

@UntilDestroy()
@Component({
	selector: 'iterpro-readiness-period',
	templateUrl: './readiness-period.component.html',
	styles: [`::ng-deep .p-datatable.p-datatable-scrollable td.p-frozen-column {
      width: 16%;}`],
})
export class ReadinessPeriodComponent implements OnChanges {
	@Input() player: Player;
	@Input() metrics: string[] = [];
	@Input() metricsList: SelectItem<string>[] = [];
	@Input() periodData: any[] = [];
	@Input() datePeriod: Date[] = [];
	@Input() currentTeam: Team;
	@Input() currentViewState: ReadinessSidebarViewType;

	data: ChartData;
	options: ChartOptions;
	injuryFlag = false;
	datalabelsFlag = false;

	// TABLE
	headers: string[];
	rows: string[][];

	private label: Map<string, string> = new Map<string, string>();
	private color: Map<string, string> = new Map<string, string>();
	private datasets: Map<string, number[]> = new Map<string, number[]>();
	private allDataForChart: Map<string, any[]> = new Map<string, any[]>();
	private workload: number[] = [];
	private workload2: number[] = [];
	private sleep: number[] = [];
	private sleepHours: number[] = [];
	private stress: number[] = [];
	private fatigue: number[] = [];
	private soreness: number[] = [];
	private mood: number[] = [];
	private goscores: number[] = [];
	private days: momentLib.Moment[] = [];
	private injuries: Injury[] = [];
	private tests: Object = {};

	private colorArray: Map<string, string> = new Map<string, string>();
	private axisArray: Map<string, string> = new Map<string, string>();
	private labelArray: Map<string, string> = new Map<string, string>();

	constructor(
		private reportService: ReportService,
		private toServer: ToServerEquivalentService,
		private azureUrlPipe: AzureStoragePipe,
		private translate: TranslateService,
		private calendarService: CalendarService
	) {
		this.axisArray.set('go_score', 'y');
		this.axisArray.set('wellness_sleep', 'yB');
		this.axisArray.set('sleep_hours', 'yB');
		this.axisArray.set('wellness_stress', 'yB');
		this.axisArray.set('wellness_fatigue', 'yB');
		this.axisArray.set('wellness_soreness', 'yB');
		this.axisArray.set('wellness_mood', 'yB');
		this.axisArray.set('workload', 'yB');
		this.axisArray.set('workload2', 'yB');

		this.colorArray.set('go_score', '#ff5050');
		this.colorArray.set('wellness_sleep', 'red');
		this.colorArray.set('sleep_hours', 'orange');
		this.colorArray.set('wellness_stress', 'green');
		this.colorArray.set('wellness_fatigue', 'yellow');
		this.colorArray.set('wellness_soreness', 'blue');
		this.colorArray.set('wellness_mood', 'purple');
		this.colorArray.set('workload', 'lightblue');
		this.colorArray.set('workload2', 'blue');

		this.labelArray.set('go_score', 'GO Score');
		this.labelArray.set('wellness_sleep', 'Sleep');
		this.labelArray.set('sleep_hours', 'Sleep Hours');
		this.labelArray.set('wellness_stress', 'Stress');
		this.labelArray.set('wellness_fatigue', 'Fatigue');
		this.labelArray.set('wellness_soreness', 'Soreness');
		this.labelArray.set('wellness_mood', 'Mood');
		this.labelArray.set('workload', 'Workload');
		this.labelArray.set('workload2', 'Workload');
		this.labelArray.set('injury', 'Injury');
		moment.locale(this.translate.currentLang);
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['metrics']) {
			this.triggerRendering();
		}
		if (changes['periodData'] && this.periodData) {
			this.prepareChartData(this.periodData);
		}
		if (changes['currentTeam'] && this.currentTeam) {
			this.onUpdateCurrentTeam();
		}
	}

	downloadPDF() {
		const data = {
			...this.data,
			datasets: this.data.datasets.map(item => omit(item, 'pointStyle')),
			labels: this.data.labels.map((date: momentLib.Moment) => moment(this.toServer.convert(date.toDate())))
		};

		const reportData = {
			player: `${this.player.name} ${this.player.lastName}`,
			image: this.azureUrlPipe.transform(this.player.downloadUrl),
			from: this.toServer.convert(this.datePeriod[0]),
			to: this.toServer.convert(this.datePeriod[1]),
			metrics: this.data.datasets.map(({ label }) => label).join(', '),
			data: clearCircularJSON(data),
			options: this.options,
			readinessTable: {
				headers: this.headers.map((header, index) => ({
					label: header,
					alignment: index === 0 ? 'left' : 'right'
				})),
				rows: this.rows.map(row =>
					row.map((value, index) => ({
						label: value,
						alignment: index === 0 ? 'left' : 'right'
					}))
				)
			}
		};

		const filename = `Readiness Period - ${this.datePeriod[0]}-${this.datePeriod[1]}`;

		this.reportService
			.getImage(reportData.image)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: image => this.reportService.getReport('readiness_period', { ...reportData, image }, '', null, filename)
			});
	}

	downloadCSV() {
		const csvRows = Array.from(moment.range(this.datePeriod[0], this.datePeriod[1]).by('days')).map((date: momentLib.Moment) => {
			const dateData = this.periodData.find(({ label }) => label === date.format(getBackendFormat()));
			const row = {
				// 'Display Name': this.player.displayName,
				Date: date.endOf('day').format(getMomentFormatFromStorage()),
				Type: this.calendarService.getGD(date.endOf('day').toDate()),
				'GO Score': dateData?.goscore || null,
				Sleep: dateData?.wellness_sleep || null,
				'Sleep Hours': dateData?.sleep_hours || null,
				Mood: dateData?.wellness_mood || null,
				Stress: dateData?.wellness_stress || null,
				Soreness: dateData?.wellness_soreness || null,
				'Soreness Locations': (dateData?.locations || [])
					.map(location => this.translate.instant('medical.infirmary.details.location.' + location))
					.join(', '),
				Fatigue: dateData?.wellness_fatigue || null
			};
			this.currentTeam.goSettings.slice(1).forEach(({ testName, metricName }) => {
				row[`${testName} - ${metricName}`] = dateData ? dateData[`${testName}_${metricName}`] : null;
			});
			return row;
		});
		const results = Papa.unparse(csvRows, {});
		const blob = new Blob([results], { type: 'text/plain' });
		saveAs(blob, `Readiness - Period View - ${this.player.displayName}.csv`);
	}

	onToggleInjury() {
		this.injuryFlag = !this.injuryFlag;
		this.triggerRendering();
	}

	onToggleLabels() {
		this.datalabelsFlag = !this.datalabelsFlag;
		this.manageLabels();
	}

	private onUpdateCurrentTeam() {
		this.currentTeam.goSettings.slice(1).forEach(({ testName, metricName }) => {
			this.colorArray.set(`${testName}_${metricName}`, stringToColour(`${testName}_${metricName}`));
			this.labelArray.set(`${testName}_${metricName}`, `${testName} - ${metricName}`);
			this.axisArray.set(`${testName}_${metricName}`, 'yB');
		});
	}

	private triggerRendering() {
		this.addMetric();
		this.render(this.datasets, this.color, this.label, this.axisArray, this.calendarService, this.translate, this.getSingleAvailable);
	}

	private prepareChartData(results: any) {
		this.days = [];
		this.goscores = [];
		this.allDataForChart = new Map<string, number[]>();
		this.sleep = [];
		this.sleepHours = [];
		this.stress = [];
		this.fatigue = [];
		this.soreness = [];
		this.mood = [];
		this.workload = [];
		this.workload2 = [];
		this.injuries = [];
		this.tests = {};

		const days: momentLib.Moment[] = Array.from(moment.range(this.datePeriod[0], this.datePeriod[1]).by('days'));
		const groupedByLabel = groupBy(results, 'label');
		const groupedJson = JSON.parse(JSON.stringify(groupedByLabel));

		for (const day of days) {
			const backendFormattedDate: string = day.format(getBackendFormat());
			const datasetValue =
				backendFormattedDate in groupedJson && groupedJson[backendFormattedDate].length > 0 ? groupedJson[backendFormattedDate][0] : null;

			this.days.push(day);
			this.goscores.push(datasetValue?.goscore || null);
			this.sleep.push(datasetValue?.wellness_sleep || null);
			this.sleepHours.push(datasetValue?.sleep_hours || null);
			this.stress.push(datasetValue?.wellness_stress || null);
			this.fatigue.push(datasetValue?.wellness_fatigue || null);
			this.soreness.push(datasetValue?.wellness_soreness || null);
			this.mood.push(datasetValue?.wellness_mood || null);
			this.workload.push(datasetValue?.session0 || null);
			this.workload2.push(datasetValue?.session1 || null);
			this.currentTeam.goSettings.slice(1).forEach(({ testName, metricName }) => {
				if (datasetValue && datasetValue[`${testName}_${metricName}`]) {
					if (!this.tests[`${testName}_${metricName}`]) this.tests[`${testName}_${metricName}`] = [];
					this.tests[`${testName}_${metricName}`] = [...this.tests[`${testName}_${metricName}`], datasetValue[`${testName}_${metricName}`]];
				} else {
					if (!this.tests[`${testName}_${metricName}`]) this.tests[`${testName}_${metricName}`] = [];
					this.tests[`${testName}_${metricName}`] = [...this.tests[`${testName}_${metricName}`], null];
				}
			});
			this.injuries.push(datasetValue ? datasetValue.injury : null);
		}

		this.allDataForChart.set('go_score', this.goscores);
		this.allDataForChart.set('wellness_sleep', this.sleep);
		this.allDataForChart.set('sleep_hours', this.sleepHours);
		this.allDataForChart.set('wellness_stress', this.stress);
		this.allDataForChart.set('wellness_fatigue', this.fatigue);
		this.allDataForChart.set('wellness_soreness', this.soreness);
		this.allDataForChart.set('wellness_mood', this.mood);
		this.allDataForChart.set('workload', this.workload);
		this.allDataForChart.set('workload2', this.workload2);

		this.currentTeam.goSettings.slice(1).forEach(({ testName, metricName }) => {
			this.allDataForChart.set(`${testName}_${metricName}`, this.tests[`${testName}_${metricName}`]);
		});
		this.allDataForChart.set('injury', this.injuries);

		if (this.metrics && this.metrics.length > 0) {
			this.addMetric();
		}

		if (this.currentViewState === ReadinessSidebarViewType.Period) {
			this.triggerRendering();
		}
	}

	private render(
		datasets?: Map<string, number[]>,
		color?: Map<string, string>,
		label?: Map<string, string>,
		axeses?: Map<string, string>,
		calendarService?: CalendarService,
		translate?: TranslateService,
		available?: Function
	) {
		this.options = {
			...getDefaultCartesianConfig(),
			responsive: true,
			maintainAspectRatio: true
		};

		const data = [];

		let workload = null;
		let workload2 = null;
		let injury = null;

		if (!datasets) {
			datasets = new Map<string, number[]>();
		} else {
			if (datasets.has('workload')) {
				workload = datasets.get('workload');
				datasets.delete('workload');
			}

			if (datasets.has('workload2')) {
				workload2 = datasets.get('workload2');
				datasets.delete('workload2');
			}

			if (datasets.has('injury')) {
				injury = datasets.get('injury');
				datasets.delete('injury');
			}

			datasets.forEach((d, index) => {
				data.push({
					data: d,
					borderColor: color.get(index),
					pointBorderColor: color.get(index),
					pointBackgroundColor: color.get(index),
					pointHoverBackgroundColor: color.get(index),
					pointHoverBorderColor: '#fff',
					pointRadius: 0,
					borderWidth: 2,
					cubicInterpolationMode: 'monotone',
					yAxisID: axeses.get(index),
					type: 'line',
					label: label.get(index),
					spanGaps: true
				});
			});

			this.options.scales = {
				...this.options.scales,
				yB: {
					type: 'linear',
					position: 'right',
					min: 0,
					beginAtZero: true,
					suggestedMax: 6,
					ticks: {
						color: '#ddd',
						callback(value: number) {
							if (value % 1 === 0) {
								return value;
							}
						}
					},
					grid: {
						color: 'transparent',
						display: false
					},
					stacked: false
				}
			};
		}

		if (workload) {
			data.push({
				data: workload,
				type: 'bar',
				barPercentage: 0.8,
				categoryPercentage: 0.5,
				yAxisID: 'yB',
				label: 'Workload',
				backgroundColor: color.get('workload'),
				borderColor: color.get('workload'),
				hoverBackgroundColor: color.get('workload'),
				hoverBorderColor: color.get('workload'),
				spanGaps: true
			});
			data.push({
				data: workload2,
				type: 'bar',
				barPercentage: 0.8,
				categoryPercentage: 0.5,
				yAxisID: 'yB',
				label: 'Workload',
				backgroundColor: color.get('workload2'),
				borderColor: color.get('workload2'),
				hoverBackgroundColor: color.get('workload2'),
				hoverBorderColor: color.get('workload2'),
				spanGaps: true
			});
		}

		const bandaid = new Image();
		bandaid.src = '../../../../assets/img/custom-icons/band-aid.png';

		if (this.injuryFlag) {
			data.push({
				data: (injury || []).map(x => (x ? 100 : null)),
				borderColor: '#fff',
				pointBorderColor: '#fff',
				pointBackgroundColor: '#fff',
				pointHoverBackgroundColor: '#fff',
				pointHoverBorderColor: '#fff',
				pointStyle: bandaid,
				pointRadius: 3,
				borderWidth: 2,
				cubicInterpolationMode: 'monotone',
				yAxisID: 'y',
				type: 'line',
				label: label.get('injury'),
				spanGaps: true
			});
		}

		this.data = {
			labels: this.days.map((x: any) => (x.length > 10 ? formatLabel(x, 25) : x)),
			datasets: data.filter(
				({ label }) => label === 'Injury' || this.metrics.includes(this.metricsList.find(({ label: l }) => l === label)?.value)
			)
		};

		this.headers = [this.player?.displayName, ...data.map(({ label }) => label)];
		this.rows = this.days.map((d, index) => [
			d.format(getMomentFormatFromStorage()),
			...data.map(({ data, label }) => {
				switch (label) {
					case 'GO Score':
						return data[index] ? data[index].toFixed(1) : '0';

					case 'Sleep Hours':
						return data[index];

					case 'Injury':
						return data[index] ? 'Yes' : '-';

					default:
						return Math.round(Number(data[index]));
				}
			})
		]);
		this.options.scales.x = getTimeseriesXAxis(this.options.scales.x, calendarService);
		this.options.plugins.tooltip = {
			mode: 'index',
			intersect: false,
			callbacks: {
				title: ([{ label }, ...{}]) => {
					const formattedDate = moment(label, 'MMM D, YYYY, hh:mm:ss a');
					const dateObject = formattedDate.toDate();
					return `${formattedDate.format(`${getMomentFormatFromStorage()} ddd`)} (${calendarService.getGD(dateObject)})`;
				},
				label: tooltipItem => {
					if (tooltipItem.dataset.label === 'Injury') {
						const inj = injury[tooltipItem.dataIndex];
						const notAv = available(inj);
						let text = `${translate.instant(inj.issue)} - ${translate.instant(inj.location)}${inj.osics ? ` - ${inj.osics}` : ``}`;
						if (notAv.available === 'no') text = `${text} - Not available`;
						return text;
					} else {
						return `${tooltipItem.dataset.label}: ${tooltipItem.formattedValue}`;
					}
				}
			},
			displayColors: false
		};

		if (injury) {
			this.options.plugins.datalabels = {
				display: false
			};
		}
		this.manageLabels();
	}

	private addMetric() {
		this.datasets = new Map();
		this.color = new Map();
		this.label = new Map();
		this.metricsList.forEach(x => {
			if (x.value === 'workload') {
				this.datasets.set('workload2', this.allDataForChart.get('workload2'));
				this.color.set('workload2', this.colorArray.get('workload2'));
				this.label.set('workload2', this.labelArray.get('workload2'));
			}
			this.datasets.set(x.value, this.allDataForChart.get(x.value));
			this.color.set(x.value, this.colorArray.get(x.value));
			this.label.set(x.value, this.labelArray.get(x.value));
		});
		if (this.injuryFlag) {
			this.datasets.set('injury', this.allDataForChart.get('injury'));
			this.color.set('injury', this.colorArray.get('injury'));
			this.label.set('injury', this.labelArray.get('injury'));
		}
	}

	private manageLabels() {
		const temp = cloneDeep(this.data);
		temp.datasets.forEach((dataset: any) => {
			dataset.datalabels = getDataLabels(this.datalabelsFlag);
		});
		this.data = cloneDeep(temp);
	}

	private getSingleAvailable(injury: Injury): any {
		let availability = { available: 'yes' };
		if (injury._injuryAssessments?.length > 0) {
			injury._injuryAssessments = sortBy(injury._injuryAssessments, 'date');
			if (injury._injuryAssessments[0].available !== 'yes' && !moment().isSame(injury.endDate, 'day')) {
				availability = injury._injuryAssessments[0];
			}
		}
		return availability;
	}
}
