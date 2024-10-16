import { DatePipe, PercentPipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { DeviceMetricDescriptor, Match, PlayerStat, Threshold } from '@iterpro/shared/data-access/sdk';
import { CapitalizePipe } from '@iterpro/shared/ui/pipes';
import {
	AlertService,
	PRIMARIES,
	ReportService,
	getDataLabels,
	getDefaultCartesianConfig,
	getDefaultRadarConfig,
	getMomentFormatFromStorage,
	getThresholdActiveValue,
	isNotEmpty,
	radarBackground
} from '@iterpro/shared/utils/common-utils';
import { ChartData, ChartOptions } from 'chart.js';
import { flatten, isEmpty, max, mean } from 'lodash';
import * as moment from 'moment';
import { cleanJSON } from './../match-analysis.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'iterpro-match-analysis-summary',
	templateUrl: './match-analysis-summary.component.html',
	styleUrls: ['./match-analysis-summary.component.css']
})
export class MatchAnalysisSummaryComponent implements OnChanges {
	@Input() match: Match;
	@Input() playerView: boolean;
	@Input() metrics: DeviceMetricDescriptor[];
	@Input() thresholds: Threshold[];
	@Input() matches: Match[];
	@Input() metricsTeam: DeviceMetricDescriptor[];
	@Input() metricsPlayer: DeviceMetricDescriptor[];
	@Input() playerStat: PlayerStat;
	@Input() sidebarOpen: boolean;

	@Output() sidebarEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();
	@Output() saveAttachmentsEmitter: EventEmitter<void> = new EventEmitter<void>();

	radarData: ChartData;
	radarOptions: ChartOptions;
	barData: ChartData;
	barOptions: ChartOptions;
	percentage = false;
	datalabels = false;
	showThresholds = false;

	private indexes = ['y', 'yB'];

	uploadDialogVisibility: boolean;
	constructor(
		private reportService: ReportService,
		private notificationService: AlertService,
		private datePipe: DatePipe,
		private currentTeamService: CurrentTeamService,
		private capitalize: CapitalizePipe,
		private translate: TranslateService
	) {
		moment.locale(this.translate.currentLang);
	}

	ngOnChanges() {
		if (this.match && (this.match._teamStat || isNotEmpty(this.match._playerStats))) {
			this.drawRadar();
			this.drawColumn();
		}
	}

	onToggleSidebar() {
		this.sidebarOpen = !this.sidebarOpen;
		this.sidebarEmitter.emit(this.sidebarOpen);
	}

	onTogglePercent() {
		this.percentage = !this.percentage;
		this.drawColumn();
	}

	onToggleLabels() {
		this.datalabels = !this.datalabels;
		this.drawColumn();
	}

	onToggleThresholds() {
		this.showThresholds = !this.showThresholds;
	}

	getLinkPlanning() {
		const params = {
			id: this.match.eventId,
			start: this.match.date
		};
		return ['/manager/planning', params];
	}

	downloadReport() {
		this.reportService.getReport('match_summary', this.getSummaryReport());
	}

	getMetricValueForIndex(index: number, radar = false): number {
		let metricName = '';
		const metricsArr: DeviceMetricDescriptor[] = radar ? this.metrics.slice(0, 5) : this.metrics;
		if (index <= metricsArr.length - 1) {
			metricName = metricsArr[index].metricName;
			if (this.playerView) {
				const fieldValue = metricName in this.playerStat ? this.playerStat[metricName] : null;
				return fieldValue != null ? Number(fieldValue) : null;
			} else if (!this.playerView && this.match._teamStat) {
				const fieldValue = metricName in this.match._teamStat ? this.match._teamStat[metricName] : null;
				return fieldValue ? Number(fieldValue) : null;
			} else return null;
		} else return null;
	}

	getMetricLabelForIndex(index: number, radar = false): string {
		const metricsArr: DeviceMetricDescriptor[] = radar ? this.metrics.slice(0, 5) : this.metrics;

		if (index <= metricsArr.length - 1) return metricsArr[index].metricLabel.toLowerCase();
		else return '';
	}

	getMetricValueNormForIndex(index: number, radar = false): string {
		let metricName = '';
		const metricsArr: DeviceMetricDescriptor[] = radar ? this.metrics.slice(0, 5) : this.metrics;
		let metricValue: number = null;
		if (index <= metricsArr.length - 1) {
			metricName = metricsArr[index].metricName;
			if (this.playerView) {
				const fieldValue = metricName in this.playerStat ? this.playerStat[metricName] : null;
				metricValue = fieldValue != null ? Number(fieldValue) : null;
			} else if (!this.playerView) {
				const fieldValue = metricName in this.match._teamStat ? this.match._teamStat[metricName] : null;
				metricValue = fieldValue ? Number(fieldValue) : null;
			}
		}

		const thr = this.getThresholdValue(metricName);

		if (!metricValue) return null;
		else {
			const metricNormValue = Math.min(metricValue / (thr || 1), 1);
			return new PercentPipe('en-US').transform(metricNormValue, '1.0-0');
		}
	}

	getColor(index: number, radar = false) {
		if (!this.showThresholds) return '#1a5080';
		let metricName = '';
		const metricsArr: DeviceMetricDescriptor[] = radar ? this.metrics.slice(0, 5) : this.metrics;
		let metricValue: number = null;
		if (index <= metricsArr.length - 1) {
			metricName = metricsArr[index].metricName;
			if (this.playerView) {
				const fieldValue = metricName in this.playerStat ? this.playerStat[metricName] : null;
				metricValue = fieldValue != null ? Number(fieldValue) : null;
			} else if (!this.playerView) {
				const fieldValue = metricName in this.match._teamStat ? this.match._teamStat[metricName] : null;
				metricValue = fieldValue ? Number(fieldValue) : null;
			}
		}
		const thr = this.getThresholdValue(metricName);
		if (!metricValue) return 'transparent';
		else {
			const metricNormValue = metricValue / (thr || 1);
			if (metricNormValue >= 1) return 'green';
			if (metricNormValue >= 0.5) return 'yellow';
			return 'red';
		}
	}

	getTextColor(index: number) {
		const background = this.getColor(index);
		return background === 'yellow' ? 'black' : 'white';
	}

	private getSummaryReport() {
		const d = this.datePipe.transform.bind(this.datePipe);
		const tableMetrics = this.metrics.map((metric, i) => ({
			label: this.getMetricLabelForIndex(i),
			value: this.getMetricValueForIndex(i),
			valueNorm: this.getMetricValueNormForIndex(i)
		}));

		const data = cleanJSON(this.barData);
		const data2 = cleanJSON(this.radarData);

		return JSON.parse(
			JSON.stringify({
				displayDate: d(this.match.date, 'dd/MM/yy'),
				displayTime: d(this.match.date, 'HH:mm'),
				suffix: this.percentage ? '%' : '',
				home: this.match.home,
				team: this.currentTeamService.getCurrentTeam().name,
				opponent: this.match.opponent,
				result: this.match.result,
				data,
				options: this.barOptions,
				data2,
				options2: this.radarOptions,
				tableMetrics
			})
		);
	}

	private drawRadar() {
		const metricName1 = this.getMetricNameForIndex(0);
		const metricName2 = this.getMetricNameForIndex(1);
		const metricName3 = this.getMetricNameForIndex(2);
		const metricName4 = this.getMetricNameForIndex(3);
		const metricName5 = this.getMetricNameForIndex(4);
		const metricName6 = this.getMetricNameForIndex(5);

		const metricValue1 = this.getMetricValueForIndex(0);
		const metricValue2 = this.getMetricValueForIndex(1);
		const metricValue3 = this.getMetricValueForIndex(2);
		const metricValue4 = this.getMetricValueForIndex(3);
		const metricValue5 = this.getMetricValueForIndex(4);
		const metricValue6 = this.getMetricValueForIndex(5);

		const thr1 = this.getThresholdValue(metricName1);
		const thr2 = this.getThresholdValue(metricName2);
		const thr3 = this.getThresholdValue(metricName3);
		const thr4 = this.getThresholdValue(metricName4);
		const thr5 = this.getThresholdValue(metricName5);
		const thr6 = this.getThresholdValue(metricName6);

		const absolute = [
			metricValue1 / 1,
			metricValue2 / 1,
			metricValue3 / 1,
			metricValue4 / 1,
			metricValue5 / 1,
			metricValue6 / 1
		];

		const datasets = [
			+((metricValue1 / thr1) * 100).toFixed(0),
			+((metricValue2 / thr2) * 100).toFixed(0),
			+((metricValue3 / thr3) * 100).toFixed(0),
			+((metricValue4 / thr4) * 100).toFixed(0),
			+((metricValue5 / thr5) * 100).toFixed(0),
			+((metricValue6 / thr6) * 100).toFixed(0)
		];

		this.radarData = this.getRadarChartData(datasets);
		this.radarOptions = this.getRadarChartOptions(this.radarData, absolute);
	}

	private drawColumn() {
		const matchesToDraw = this.getMatchesToDraw();
		const graph: Map<string, Array<number>> = this.prepareChartData(matchesToDraw);
		this.barOptions = this.getBarChartOptions(graph, matchesToDraw);
		this.barData = this.getBarChartData(graph, matchesToDraw);
	}

	private getMatchesToDraw(): Match[] {
		const indexMatch = this.matches.indexOf(this.match);
		const previousIndex = indexMatch + 1 > this.matches.length - 1 ? this.matches.length - 1 : indexMatch + 1;
		const nextIndex = indexMatch + 10 > this.matches.length - 1 ? this.matches.length - 1 : indexMatch + 10;
		const matchesToDraw: Match[] =
			indexMatch === this.matches.length - 1 ? [] : this.matches.slice(previousIndex, nextIndex + 1).reverse();
		return matchesToDraw;
	}

	private prepareChartData(matches: Match[]): Map<string, Array<number>> {
		const graphMap: Map<string, Array<number>> = new Map<string, Array<number>>();
		if ((this.playerView && isEmpty(this.metricsPlayer)) || (!this.playerView && isEmpty(this.metricsTeam))) {
			this.notificationService.notify('error', 'matchAnalysis', 'alert.metricsRequired', false);
		} else {
			if (this.playerView) {
				if (this.playerStat) {
					for (const match of matches) {
						const playerStat = match._playerStats.find(({ playerId }) => playerId === this.playerStat.playerId);
						for (const metric of this.metricsPlayer) {
							if (!graphMap.has(metric.metricName)) graphMap.set(metric.metricName, []);
							if (!playerStat) graphMap.set(metric.metricName, [...graphMap.get(metric.metricName), null]);
							else {
								const value = playerStat[metric.metricName] || null;
								const thr = this.getThresholdValue(metric.metricName);
								if (value) {
									graphMap.set(metric.metricName, [
										...graphMap.get(metric.metricName),
										this.percentage ? Number((Number(value) / (thr || 1)) * 100) : Number(value)
									]);
								} else {
									graphMap.set(metric.metricName, [...graphMap.get(metric.metricName), null]);
								}
							}
						}
					}
				}
			} else {
				if (this.match._teamStat) {
					for (const match of matches) {
						const teamStat = match._teamStat;
						for (const metric of this.metricsTeam) {
							if (!graphMap.get(metric.metricName)) graphMap.set(metric.metricName, []);
							if (!teamStat) graphMap.set(metric.metricName, [...graphMap.get(metric.metricName), null]);
							else {
								const value = teamStat[metric.metricName] || null;
								const thr = this.getThresholdValue(metric.metricName);
								if (value) {
									graphMap.set(metric.metricName, [
										...graphMap.get(metric.metricName),
										this.percentage ? Number((Number(value) / (thr || 1)) * 100) : Number(value)
									]);
								} else {
									graphMap.set(metric.metricName, [...graphMap.get(metric.metricName), null]);
								}
							}
						}
					}
				}
			}
		}
		return graphMap;
	}

	private getBarChartData(graphMap: Map<string, Array<number>>, matches: Match[]): ChartData {
		const datasets = Array.from(graphMap.entries()).map(([key, data]: any, index) => ({
			data,
			label: this.capitalize.transform(this.metrics.find(({ metricName }) => metricName === key).metricLabel),
			backgroundColor: PRIMARIES[index],
			yAxisID: this.indexes[index]
		}));
		return {
			labels: matches.map(({ opponent, date }) => [
				opponent,
				moment(date).format(`${getMomentFormatFromStorage()} ddd`)
			]),
			datasets
		};
	}

	private getBarChartOptions(graphMap: Map<string, Array<number>>, matches: Match[]): ChartOptions {
		const datasets: Array<number[]> = Array.from(graphMap.values());
		const options = { ...getDefaultCartesianConfig() };
		options.plugins.tooltip = {
			mode: 'index',
			intersect: false,
			callbacks: {
				title: ([{ label }, ...{}]) => label.split(',')[1],
				afterTitle: ([{ label }, ...{}]) => {
					const formattedDate = moment(label.split(',')[1], getMomentFormatFromStorage()).format(
						getMomentFormatFromStorage()
					);
					const eventDataObj = matches.find(
						({ date }) => moment(date).format(getMomentFormatFromStorage()) === formattedDate
					);
					const opponent = eventDataObj && eventDataObj.opponent ? eventDataObj.opponent : '';
					const result = eventDataObj && eventDataObj.result ? eventDataObj.result : '';
					let homeValue: any = eventDataObj && eventDataObj.home ? eventDataObj.home : null;
					homeValue = homeValue === null ? '(A)' : homeValue ? '(H)' : '(A)';
					const home = opponent !== '' || result !== '' ? homeValue : '';
					const title = opponent + ' ' + result + ' ' + home;
					return title;
				}
			}
		};

		if (!isEmpty(datasets[0]) && datasets[0].find(x => x && x !== 0)) {
			let annotations: object = {
				yA_ann: {
					borderDash: [20, 20],
					type: 'line',
					mode: 'horizontal',
					scaleID: 'y',
					value: mean(datasets[0] || []),
					borderColor: PRIMARIES[0],
					borderWidth: 2
				}
			};
			if (datasets.length > 1) {
				annotations = {
					...annotations,
					yB_ann: {
						borderDash: [20, 20],
						type: 'line',
						scaleID: 'yB',
						mode: 'horizontal',
						value: mean(datasets[1] || []),
						borderColor: PRIMARIES[1],
						borderWidth: 2
					}
				};
			}

			options.plugins.annotation = {
				annotations
			};
		}

		if ((!this.playerView && this.metricsTeam.length > 1) || (this.playerView && this.metricsPlayer.length > 1)) {
			options.scales = {
				...options.scales,
				yB: {
					position: 'right',
					grid: {
						color: 'transparent',
						display: false
					},
					border: { display: false },
					min: 0,
					beginAtZero: true,
					ticks: {
						color: '#ddd',
						callback: (value: number) => {
							if (value % 1 === 0) {
								return value;
							}
						}
					}
				}
			};
		} else if (options.scales.yB) {
			options.scales.yB = null;
		}

		if (this.percentage) {
			Object.entries(options.scales).forEach(([key, { ticks, suggestedMax, grace }]: [string, any]) => {
				if (key.includes('y')) {
					ticks.callback = (value, index, ticksArr) =>
						value % 1 === 0 && index === ticksArr.length - 1 ? value + '%' : value;
					suggestedMax = Math.floor(
						max(flatten(datasets.map(array => array.filter((n: number) => !isNaN(n) && n !== Infinity)))) as number
					);
					grace = '10%';
				}
			});
		}

		if (this.datalabels) {
			options.plugins.datalabels = getDataLabels(this.datalabels);
		}

		return options;
	}

	private getRadarChartOptions(data, absolute) {
		const maxValue = Math.max.apply(null, data.datasets[0].data);
		const options = { ...getDefaultRadarConfig() };
		options.plugins.tooltip = {
			callbacks: {
				title: ([{ label }, ...{}]) => label,
				label: ({ dataIndex }) => `Absolute: ${Number(absolute[dataIndex]).toFixed(1)}`,
				afterLabel: ({ formattedValue }) => `Game %: ${formattedValue}%`
			},
			displayColors: false
		};
		// options.scales.r.max = maxValue;
		return options;
	}

	private getThresholdValue(metricName: string): number {
		const thrFound = this.thresholds.find(({ name }) => name === metricName);
		const thr = this.playerView ? (thrFound ? getThresholdActiveValue(thrFound) : 1) : thrFound?.value;
		return thr || 1;
	}

	private getRadarChartData(datasets) {
		const data = {
			labels: this.metrics
				.slice(0, 6)
				.map((val: DeviceMetricDescriptor, index: number) =>
					this.formatLabel(this.capitalize.transform(val.metricLabel), 25)
				),
			datasets: [
				{
					data: datasets,
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

		return data;
	}

	private getMetricNameForIndex(index: number, radar = false): string {
		const metricsArr: DeviceMetricDescriptor[] = radar ? this.metrics.slice(0, 5) : this.metrics;
		if (index <= metricsArr.length - 1) return metricsArr[index].metricName;
		else return '';
	}

	private formatLabel(str: string, maxwidth: number): string[] {
		const sections = [];
		const words = str.split(' ');
		let temp = '';

		words.forEach(function (item, index) {
			if (temp.length > 0) {
				const concat = temp + ' ' + item;
				if (concat.length > maxwidth) {
					sections.push(temp);
					temp = '';
				} else {
					if (index === words.length - 1) {
						sections.push(concat);
						return;
					} else {
						temp = concat;
						return;
					}
				}
			}
			if (index === words.length - 1) {
				sections.push(item);
				return;
			}

			if (item.length < maxwidth) {
				temp = item;
			} else {
				sections.push(item);
			}
		});
		return sections;
	}

	saveAttachments(event) {
		this.uploadDialogVisibility = false;
		this.match.event._attachments = event._attachments;
		this.saveAttachmentsEmitter.emit();
	}
}
