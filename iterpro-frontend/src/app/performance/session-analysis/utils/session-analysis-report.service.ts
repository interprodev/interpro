import { Injectable } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	DeviceMetricDescriptor,
	Event,
	LoopBackAuth,
	MixedType,
	Player,
	SessionPlayerData,
	Team,
	toJoinedString
} from '@iterpro/shared/data-access/sdk';
import {
	AzureStoragePipe,
	CalendarService,
	ReportService,
	ToServerEquivalentService,
	clearCircularJSON,
	getMomentFormatFromStorage,
	getPDFv2Path,
	getTeamSettings,
	isBase64Image
} from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { flatten, sortBy } from 'lodash';
import * as moment from 'moment';
import {
	PeriodMatch,
	PeriodReportDataCSV,
	PeriodTotalReportDataPDF,
	PeriodTrendReportDataPDF,
	PeriodTrendSession,
	SemaphoreMetricValue,
	SessionAnalysisReportType,
	SplitSelectItem,
	SummaryMetric,
	TeamSessionReportDataCSV,
	TeamSessionReportDataPDF
} from 'src/app/+state/session-analysis-store/ngrx/session-analysis-store.interfaces';
import { ChartInterfaceData } from './session-analysis-chart.service';
import { SessionAnalysisService } from './session-analysis.service';

@Injectable({
	providedIn: 'root'
})
export class SessionAnalysisReportService {
	constructor(
		private loopBackAuth: LoopBackAuth,
		private sessionAnalysisService: SessionAnalysisService,
		private report: ReportService,
		private calendar: CalendarService,
		private translateService: TranslateService,
		private azurePipe: AzureStoragePipe,
		private currentTeamService: CurrentTeamService,
		private toServer: ToServerEquivalentService
	) {}

	getReportDataSessionTeamPDF(
		selectedMetrics: DeviceMetricDescriptor[],
		selectedPDFMetrics: DeviceMetricDescriptor[],
		metrics: DeviceMetricDescriptor[],
		playersStatistics: Map<string, SemaphoreMetricValue[]>,
		session: Event,
		split: SplitSelectItem,
		data: ChartData,
		options: ChartOptions,
		bubble: boolean = false
	): TeamSessionReportDataPDF {
		const reportData: TeamSessionReportDataPDF = {
			header: {
				title: 'SESSION ANALYSIS',
				subTitle: 'SESSION TEAM'
			},
			metadata: {
				createdLabel: `${this.translateService.instant('general.createdOn')} ${moment(new Date()).format(
					`${getMomentFormatFromStorage()} hh:mm`
				)}`
			},
			summary: {
				sessionName: session._sessionImport.nameSession,
				split: {
					label: this.translateService.instant('sidebar.split'),
					value: split.label
				},
				metrics: {
					label: this.translateService.instant('sidebar.metrics'),
					value: toJoinedString(selectedMetrics.map(x => x.metricLabel))
				},
				players: {
					label: this.translateService.instant('sidebar.partecipants'),
					value: toJoinedString(data.labels as string[])
				},
				date: {
					label: this.translateService.instant('sidebar.date'),
					value: moment(session.start).format(getMomentFormatFromStorage())
				},
				time: {
					label: this.translateService.instant('sidebar.time'),
					value: moment(session.start).format('HH:mm:ss')
				},
				duration: {
					label: this.translateService.instant('duration'),
					value: session.duration
				},
				gdType: {
					label: this.translateService.instant('sidebar.gdType'),
					value: this.calendar.getGD(session.start)
				}
			},
			chart: {
				data: clearCircularJSON(data),
				options,
				bubble
			},
			table: {
				headers: [
					this.translateService.instant('sidebar.player'),
					...metrics
						.map(({ metricLabel }) => metricLabel)
						.filter(label => {
							return selectedPDFMetrics.map(({ metricLabel }) => metricLabel).includes(label);
						})
				].map((label, index) => ({
					label: label,
					mode: 'text',
					alignment: index === 0 ? 'left' : 'right'
				})),
				rows: data.labels.map((label: string | string[]) => {
					const playerCell: MixedType = {
						label: Array.isArray(label) ? label[0] : label,
						mode: 'text',
						alignment: 'left',
						cssStyle: 'white-space: nowrap'
					};

					let playerStatistics: SemaphoreMetricValue[] = playersStatistics
						.get(Array.isArray(label) ? label[0] : label)
						.map(x => {
							if (x === null) {
								return {
									value: '-'
								};
							}

							return x;
						});

					// Checking whick metric values are selected for PDF
					const selectedPDFMetricsNames: string[] = selectedPDFMetrics.map(({ metricName }) => metricName);
					metrics.forEach((m, index) => {
						if (!selectedPDFMetricsNames.includes(m.metricName)) {
							playerStatistics[index] = null;
						}
					});
					playerStatistics = playerStatistics.filter(x => x !== null);

					const statsMixedTypes: MixedType[] = (playerStatistics || []).map((data: SemaphoreMetricValue) => ({
						label: String(data.value),
						mode: data.canShowSemaphore ? 'pointType' : 'text',
						cssStyle: data.canShowSemaphore ? 'background: ' + data.semaphore : undefined,
						alignment: 'right'
					}));

					return [playerCell, ...statsMixedTypes];
				})
			}
		};
		return JSON.parse(JSON.stringify(reportData));
	}

	getReportDataSessionTeamCSV(session: Event, metrics: DeviceMetricDescriptor[], playersSessions: SessionPlayerData[]) {
		return playersSessions.map(s => {
			const csvSession: TeamSessionReportDataCSV = {
				displayName: s.playerName,
				splitName: s.splitName,
				splitStartTime: moment(s.splitStartTime).format(`${getMomentFormatFromStorage()} HH:mm:ss`),
				splitEndTime: moment(s.splitEndTime).format(`${getMomentFormatFromStorage()} HH:mm:ss`),
				gdType: this.calendar.getGD(session.start),
				partecipants: s.dirty ? 'Modified' : 'Full'
			};
			metrics.map(metric => metric.metricName).forEach(m => (csvSession[m] = s[m]));
			return csvSession;
		});
	}

	getReportDataSessionIndividual(
		metrics: DeviceMetricDescriptor[],
		summary: SummaryMetric[],
		session: Event,
		playersSessions: SessionPlayerData[],
		player: Player,
		chartData: ChartData,
		radarData: ChartData,
		chartOptions: ChartOptions,
		radarOptions: ChartOptions
	) {
		const tableMetrics = summary.map(x => ({
			norm: Number((x.norm * 100).toFixed(0)),
			value: x.value,
			name: x.name
		}));

		const reportData = {
			sessionName: session._sessionImport.nameSession,
			type: this.calendar.getGD(session.start),
			player: player.displayName,
			duration: this.sessionAnalysisService.getSessionDuration(session, playersSessions, player),
			metric: metrics.map(x => x.metricLabel)[0],
			data: clearCircularJSON(chartData),
			options: chartOptions,
			data2: clearCircularJSON(radarData),
			options2: radarOptions,
			tableMetrics
		};

		return JSON.parse(JSON.stringify(reportData));
	}

	getReportDataPeriodTotalPDF(
		metrics: DeviceMetricDescriptor[],
		selectedPDFMetrics: DeviceMetricDescriptor[],
		selectedMetrics: DeviceMetricDescriptor[],
		playersStatistics: Map<string, SemaphoreMetricValue[]>,
		dates: Date[],
		splits: SplitSelectItem[],
		chartData: ChartInterfaceData
	): PeriodTotalReportDataPDF {
		const selectedMetricsLabels: string[] = selectedMetrics.map(x => x.metricLabel);
		const splitsLabels: string[] = splits.map(x => x.label);
		const from: moment.Moment = moment(dates[0]);
		const to: moment.Moment = moment(dates[1]);

		const reportData: PeriodTotalReportDataPDF = {
			header: {
				title: 'SESSION ANALYSIS',
				subTitle: 'TOTAL'
			},
			metadata: {
				createdLabel: `${this.translateService.instant('general.createdOn')} ${moment(new Date()).format(
					`${getMomentFormatFromStorage()} hh:mm`
				)}`
			},
			summary: {
				datePeriod: {
					label: this.translateService.instant('sidebar.period'),
					value: from.format(getMomentFormatFromStorage()) + ' - ' + to.format(getMomentFormatFromStorage())
				},
				days: { label: this.translateService.instant('days'), value: to.diff(from, 'days') },
				split: { label: this.translateService.instant('sidebar.split'), value: toJoinedString(splitsLabels) },
				metrics: {
					label: this.translateService.instant('sidebar.metrics'),
					value: toJoinedString(selectedMetricsLabels)
				},
				players: {
					label: this.translateService.instant('sidebar.partecipants'),
					value: toJoinedString(chartData.data.labels as string[])
				}
			},
			chart: {
				data: clearCircularJSON(chartData.data),
				options: chartData.options
			},
			table: {
				headers: [
					this.translateService.instant('sidebar.player'),
					...metrics
						.map(({ metricLabel }) => metricLabel)
						.filter(label => {
							return selectedPDFMetrics.map(({ metricLabel }) => metricLabel).includes(label);
						})
				].map((label, index) => ({
					label: label,
					mode: 'text',
					alignment: index === 0 ? 'left' : 'right'
				})),
				rows: sortBy(Array.from(playersStatistics.keys())).map(playerName => {
					const playerCell: MixedType = {
						label: Array.isArray(playerName) ? playerName[0] : playerName,
						mode: 'text',
						alignment: 'left',
						cssStyle: 'white-space: nowrap'
					};

					let playerStatistics: SemaphoreMetricValue[] = playersStatistics.get(playerName).map(x => {
						if (x === null) {
							return {
								value: '-'
							};
						}

						return x;
					});

					// Checking whick metric values are selected for PDF
					const selectedPDFMetricsNames: string[] = selectedPDFMetrics.map(({ metricName }) => metricName);
					metrics.forEach((m, index) => {
						if (!selectedPDFMetricsNames.includes(m.metricName)) {
							playerStatistics[index] = null;
						}
					});
					playerStatistics = playerStatistics.filter(x => x !== null);

					const statsMixedTypes: MixedType[] = playerStatistics.map((data: SemaphoreMetricValue) => ({
						label: String(data.value),
						mode: data.canShowSemaphore ? 'pointType' : 'text',
						cssStyle: data.canShowSemaphore ? 'background: ' + data.semaphore : undefined,
						alignment: 'right'
					}));

					return [playerCell, ...statsMixedTypes];
				})
			}
		};
		return JSON.parse(JSON.stringify(reportData));
	}

	getReportDataPeriodTrendPDF(
		sessions: PeriodTrendSession[],
		periodStatistics: Map<string, SemaphoreMetricValue[]>,
		metrics: DeviceMetricDescriptor[],
		selectedPDFMetrics: DeviceMetricDescriptor[],
		selectedMetrics: DeviceMetricDescriptor[],
		players: Player[],
		dates: Date[],
		splits: SplitSelectItem[],
		chartData: ChartInterfaceData,
		eventGameData: Map<string, PeriodMatch>,
		periodTableDate: Map<string, Map<string, { [key: string]: number }[]>>
	): PeriodTrendReportDataPDF {
		const selectedMetricsLabels: string[] = selectedMetrics.map(x => x.metricLabel);
		const playersLabels: string[] = players.map(x => x.displayName);
		const splitsLabels: string[] = splits.map(x => x.label);
		const from = moment(dates[0]);
		const to = moment(dates[1]);
		const reportData: PeriodTrendReportDataPDF = {
			header: {
				title: 'SESSION ANALYSIS',
				subTitle: 'TREND'
			},
			metadata: {
				createdLabel: `${this.translateService.instant('general.createdOn')} ${moment(new Date()).format(
					`${getMomentFormatFromStorage()} hh:mm`
				)}`
			},
			summary: {
				datePeriod: {
					label: this.translateService.instant('sidebar.period'),
					value: from.format(getMomentFormatFromStorage()) + ' - ' + to.format(getMomentFormatFromStorage())
				},
				days: {
					label: this.translateService.instant('days'),
					value: to.diff(from, 'days') + 1
				},
				split: { label: this.translateService.instant('sidebar.split'), value: toJoinedString(splitsLabels) },
				metrics: {
					label: this.translateService.instant('sidebar.metrics'),
					value: toJoinedString(selectedMetricsLabels)
				},
				players: {
					label: this.translateService.instant('sidebar.partecipants'),
					value: toJoinedString(playersLabels)
				},
				sessions: {
					label: this.translateService.instant('import.dashboard.sessions'),
					value: [...chartData.data.datasets[1].data, ...chartData.data.datasets[2].data].filter(val => val !== 0)
						.length
				}
			},
			chart: {
				data: {
					labels: chartData.data.labels.map(date => this.toServer.convert((date as moment.Moment).toDate())),
					datasets: chartData.data.datasets
				},
				options: chartData.options
			},
			table: {
				headers: [
					this.translateService.instant('general.date'),
					...metrics
						.map(({ metricLabel }) => metricLabel)
						.filter(label => {
							return selectedPDFMetrics.map(({ metricLabel }) => metricLabel).includes(label);
						})
				].map((label, headerIndex) => ({
					label: label,
					mode: 'text',
					alignment: headerIndex === 0 ? 'left' : 'right',
					cssClass: `${selectedMetrics.map(m => m.metricLabel).includes(label) ? 'text-bold' : ''}`
				})),
				rows: sessions
					.filter(s => s.values)
					.map(s => {
						const sessionValuesMap = new Map(Object.entries(s.values));
						const selectedPDFMetricNames = selectedPDFMetrics.map(({ metricName }) => metricName);
						return [
							s.label,
							...Array.from(sessionValuesMap.keys()).filter(k => selectedPDFMetricNames.includes(k))
						].map((key, index) => ({
							label:
								index === 0 // Date
									? key // Metric array values
									: sessionValuesMap
											.get(key)
											.map(value => (value ? Number(value.toFixed(1)) : 0))
											.join(' - '),
							mode: 'text',
							alignment: index === 0 ? 'left' : 'right'
						}));
					})
			},
			playerPages: sortBy(players, 'displayName').map(player => {
				const playerData: Map<string, { [key: string]: number }[]> = periodTableDate.get(player.displayName);
				const sessionsNum: number = flatten(Array.from(playerData.values())).filter(value =>
					Array.from(Object.values(value)).some(val => val !== 0)
				).length;
				const playerChart = this.sessionAnalysisService.getSinglePlayerChartData(
					sessions,
					selectedMetrics,
					periodTableDate,
					player,
					eventGameData
				);

				return {
					header: {
						title: player.displayName,
						subTitle: 'TREND',
						currentTeamHeader: {
							logo:
								player.downloadUrl && isBase64Image(player.downloadUrl)
									? player.downloadUrl
									: this.azurePipe.transform(player.downloadUrl),
							team: this.currentTeamService.getCurrentTeam().name,
							coach: ''
						}
					},
					metadata: {
						createdLabel: `${this.translateService.instant('general.createdOn')} ${moment(new Date()).format(
							`${getMomentFormatFromStorage()} hh:mm`
						)}`
					},
					summary: {
						datePeriod: {
							label: this.translateService.instant('sidebar.period'),
							value: from.format(getMomentFormatFromStorage()) + ' - ' + to.format(getMomentFormatFromStorage())
						},
						days: {
							label: this.translateService.instant('days'),
							value: to.diff(from, 'days') + 1
						},
						split: {
							label: this.translateService.instant('sidebar.split'),
							value: toJoinedString(splitsLabels)
						},
						metrics: {
							label: this.translateService.instant('sidebar.metrics'),
							value: toJoinedString(selectedMetricsLabels)
						},
						sessions: {
							label: this.translateService.instant('import.dashboard.sessions'),
							value: sessionsNum
						}
					},
					chart: {
						data: {
							labels: playerChart.data.labels.map(date => this.toServer.convert((date as moment.Moment).toDate())),
							datasets: playerChart.data.datasets
						},
						options: playerChart.options
					},
					table: {
						headers: [
							player.displayName,
							...metrics
								.map(({ metricLabel }) => metricLabel)
								.filter(label => {
									return selectedPDFMetrics.map(({ metricLabel }) => metricLabel).includes(label);
								})
						].map((label, headerIndex) => ({
							label: label,
							mode: 'text',
							alignment: headerIndex === 0 ? 'left' : 'right',
							cssClass: `${selectedMetrics.map(({ metricLabel }) => metricLabel).includes(label) ? 'text-bold' : ''}`
						})),
						rows: sessions
							.filter(s => s.values)
							.map((s: PeriodTrendSession, index: number) => {
								// DATE LABEL
								const dateLabel: MixedType = {
									label: s.label,
									mode: 'text',
									alignment: 'left',
									cssStyle: 'white-space: nowrap'
								};

								// ALL VALUES WITH SEMAPHORES OF CURRENT DAY ... [index]
								const metricValues: SemaphoreMetricValue = (periodStatistics.get(player.displayName) || [])[index];

								// Checking whick metric values are selected for PDF
								const selectedPDFMetricsNames: string[] = selectedPDFMetrics.map(({ metricName }) => metricName);
								let playerMetrics = metricValues.value as string[];
								metrics.forEach((m, index) => {
									if (!selectedPDFMetricsNames.includes(m.metricName)) {
										playerMetrics[index] = null;
									}
								});
								playerMetrics = playerMetrics.filter(x => x !== null);

								const statsMixedTypes: MixedType[] = playerMetrics.map((value: string, index: number) => {
									return {
										label: String(value || 0),
										mode: metricValues.canShowSemaphore[index] ? 'pointType' : 'text',
										cssStyle:
											(metricValues.canShowSemaphore || [])[index] &&
											metricValues.semaphore &&
											metricValues.semaphore[index]
												? 'background: ' + metricValues.semaphore[index]
												: undefined,
										alignment: 'right'
									};
								});

								return [dateLabel, ...statsMixedTypes];
							})
					}
				};
			})
		};
		return JSON.parse(JSON.stringify(reportData));
	}

	getReportDataPeriodCSV(
		currentTeam: Team,
		datePeriod: Date[],
		selectedPlayers: Player[],
		selectedPeriodSplits?: SplitSelectItem[],
		metrics?: any[]
	): PeriodReportDataCSV {
		return {
			teamId: currentTeam.id,
			dateFrom: datePeriod[0].toJSON(),
			dateTo: moment(datePeriod[1]).endOf('day').toDate().toJSON(),
			playerIds: selectedPlayers.map(selectedPlayer => selectedPlayer.id),
			activeMetrics:
				metrics ||
				getTeamSettings(this.loopBackAuth.getCurrentUserData().teamSettings, currentTeam.id).metricsPerformance,
			splits: selectedPeriodSplits
				? selectedPeriodSplits.map(selectedPeriodSplit => selectedPeriodSplit.value)
				: undefined,
			timezoneOffset: moment().toDate().getTimezoneOffset()
		};
	}

	downloadReport(
		name: SessionAnalysisReportType,
		data: TeamSessionReportDataPDF | PeriodTotalReportDataPDF | PeriodTrendReportDataPDF,
		filename: string,
		isV2: boolean
	): void {
		if (isV2) {
			this.report.getReport(getPDFv2Path('session-analysis', name), data, '', null, filename);
		} else {
			this.report.getReport(name, data, '', null, filename);
		}
	}
}
