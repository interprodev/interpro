import { Injectable } from '@angular/core';
import { DRILL_STATS_METRICS, DRILL_STATS_TITLE } from '@iterpro/manager/drills/stats/utils';
import { Drill, Player } from '@iterpro/shared/data-access/sdk';
import { ReportService, getMomentFormatFromStorage, DrillsMapping } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { sortBy } from 'lodash';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';
import {
	ChartFlags,
	DrillStatsComparisonReportCSV,
	DrillStatsData,
	DrillStatsReportPDF,
	DrillStatsResult,
	DrillStatsValues
} from '../models/drill-stats.interface';
import { DrillStatsReportType, DrillStatsViews, DrillType } from '../models/drill-stats.types';
import { DrillStatsChartService } from './drill-stats-chart.service';
import { DrillStatsDataService } from './drill-stats-data.service';

@Injectable({
	providedIn: 'root'
})
export class DrillStatsReportService {
	constructor(
		private chartService: DrillStatsChartService,
		private dataService: DrillStatsDataService,
		private translateService: TranslateService,
		private report: ReportService
	) {}

	// COMPARISON REPORT PDF
	getComparisonReportPDF(
		metric: string | null,
		datePeriod: Date[],
		players: Partial<Player>[],
		drills: Drill[],
		drillType: DrillType,
		statsResult: DrillStatsResult,
		chartFlags: ChartFlags,
		drillsMapping: DrillsMapping
	): DrillStatsReportPDF {
		const statsValues: DrillStatsValues = statsResult.stats;
		const chartMap: Map<string, DrillStatsData[]> = new Map(Object.entries(statsResult.results));
		const metrics: SelectItem<string>[] = this.dataService.getMetrics(chartMap, drillsMapping);
		const actualOrPlanned: string = this.translateService.instant(
			`event.drill.${drillType === DrillType.Actual ? 'actual' : 'planned'}`
		);
		const comparisonMap: Map<string, (number | string)[]> = this.dataService.getComparisonStatsMap(
			players,
			chartMap,
			drillsMapping
		);
		const reportPDF: DrillStatsReportPDF = {
			title: `${DRILL_STATS_TITLE} - [${actualOrPlanned}]`,
			subTitle: DrillStatsViews.Comparison,
			createdLabel: `${this.translateService.instant('general.createdOn')} ${moment(new Date()).format(
				`${getMomentFormatFromStorage()} hh:mm`
			)}`,
			metric: {
				label: this.translateService.instant('sidebar.metric'),
				value: this.translateService.instant(DRILL_STATS_METRICS.find(({ value }) => value === metric)?.label as string)
			},
			metricDescription: this.translateService.instant(`drillStats.${metric}.info`),
			datePeriod: {
				label: this.translateService.instant('sidebar.period'),
				value: `${moment(datePeriod[0]).format(getMomentFormatFromStorage())} - ${moment(datePeriod[1]).format(
					getMomentFormatFromStorage()
				)}`
			},
			actualFlag: {
				label: this.translateService.instant('drillStats.actualFlag'),
				value: actualOrPlanned
			},
			numSessions: {
				label: this.translateService.instant('drillStats.numSessions'),
				value: statsValues.numSessions
			},
			numSessionsMin: {
				label: this.translateService.instant('drillStats.numSessionsMin'),
				value: statsValues.numSessionsMin
			},
			numDrills: {
				label: this.translateService.instant('drillStats.numDrills'),
				value: statsValues.numDrills
			},
			numDrillsMin: {
				label: this.translateService.instant('drillStats.numDrillsMin'),
				value: statsValues.numDrillsMin
			},
			numSessionMinPercentage: {
				label: this.translateService.instant('drillStats.numSessionMinPercentage'),
				value: statsValues.numSessionMinPercentage
			},
			players: {
				label: this.translateService.instant('sidebar.partecipants'),
				value: players.map(({ displayName }) => displayName).join(', ')
			},
			drills: {
				label: this.translateService.instant('drills'),
				value: drills.map(({ name }) => name).join(', ')
			},
			statsTable: {
				headers: [this.translateService.instant('general.player'), ...metrics.map(({ label }) => label)], // METRICS
				values: sortBy(players, 'displayName').map(p => [
					p.displayName as string,
					...Array.from(comparisonMap.get(p.displayName as string)?.values() || [])
				])
			},
			data: this.chartService.buildComparisonChart(chartMap, players, chartFlags, drillsMapping),
			options: this.chartService.getChartOptions(chartFlags)
		};

		return reportPDF;
	}

	// PERIOD TREND REPORT PDF
	getPeriodTrendReportPDF(
		metric: string | null,
		datePeriod: Date[],
		players: Partial<Player>[],
		drills: Drill[],
		drillType: DrillType,
		statsResult: DrillStatsResult,
		chartFlags: ChartFlags,
		drillsMapping: DrillsMapping
	): DrillStatsReportPDF {
		const statsValues: DrillStatsValues = statsResult.stats;
		const chartMap: Map<string, DrillStatsData[]> = new Map(Object.entries(statsResult.results));
		const metrics: SelectItem<string>[] = this.dataService.getMetrics(chartMap, drillsMapping);
		const periodTrendMap: Map<string, (number | string)[]> = this.dataService.getPeriodTrendStatsMap(
			chartMap,
			drillsMapping
		);
		const actualOrPlanned: string = this.translateService.instant(
			`event.drill.${drillType === DrillType.Actual ? 'actual' : 'planned'}`
		);
		const reportPDF: DrillStatsReportPDF = {
			title: `${DRILL_STATS_TITLE} - [${actualOrPlanned}]`,
			subTitle: DrillStatsViews.Period,
			createdLabel: `${this.translateService.instant('general.createdOn')} ${moment(new Date()).format(
				`${getMomentFormatFromStorage()} hh:mm`
			)}`,
			metric: {
				label: this.translateService.instant('sidebar.metric'),
				value: this.translateService.instant(DRILL_STATS_METRICS.find(({ value }) => value === metric)?.label as string)
			},
			metricDescription: this.translateService.instant(`drillStats.${metric}.info`),
			datePeriod: {
				label: this.translateService.instant('sidebar.period'),
				value: `${moment(datePeriod[0]).format(getMomentFormatFromStorage())} - ${moment(datePeriod[1]).format(
					getMomentFormatFromStorage()
				)}`
			},
			actualFlag: {
				label: this.translateService.instant('drillStats.actualFlag'),
				value: actualOrPlanned
			},
			numSessions: {
				label: this.translateService.instant('drillStats.numSessions'),
				value: statsValues.numSessions
			},
			numSessionsMin: {
				label: this.translateService.instant('drillStats.numSessionsMin'),
				value: statsValues.numSessionsMin
			},
			numDrills: {
				label: this.translateService.instant('drillStats.numDrills'),
				value: statsValues.numDrills
			},
			numDrillsMin: {
				label: this.translateService.instant('drillStats.numDrillsMin'),
				value: statsValues.numDrillsMin
			},
			numSessionMinPercentage: {
				label: this.translateService.instant('drillStats.numSessionMinPercentage'),
				value: statsValues.numSessionMinPercentage
			},
			players: {
				label: this.translateService.instant('sidebar.partecipants'),
				value: players.map(({ displayName }) => displayName).join(', ')
			},
			drills: {
				label: this.translateService.instant('drills'),
				value: drills.map(({ name }) => name).join(', ')
			},
			statsTable: {
				headers: [this.translateService.instant('sidebar.period'), ...metrics.map(({ label }) => label)], // METRICS
				values: [...periodTrendMap.keys()].map(date => [date, ...Array.from(periodTrendMap.get(date)?.values() || [])])
			},
			data: this.chartService.buildPeriodTrendChart(chartMap, chartFlags, drillsMapping),
			options: this.chartService.getChartOptions(chartFlags)
		};

		return reportPDF;
	}

	// COMPARISON CSV
	getComparisonReportCSV(
		drillStatsMap: Map<string, DrillStatsData[]>,
		players: Partial<Player>[],
		datePeriod: Date[],
		metrics: SelectItem<string>[]
	): DrillStatsComparisonReportCSV[] {
		return sortBy(players, 'displayName').map(p => {
			const csvSession = {
				player: p.displayName,
				startDate: moment(datePeriod[0]).format(`${getMomentFormatFromStorage()} HH:mm:ss`),
				endDate: moment(datePeriod[1]).format(`${getMomentFormatFromStorage()} HH:mm:ss`)
			};
			metrics.forEach(metric => {
				(csvSession as any)[metric.label as string] = drillStatsMap
					.get(p.id)
					?.find(data => data.key === metric.value)?.value;
			});
			return csvSession;
		});
	}

	// PERIOD TREND CSV
	getPeriodTrendReportCSV(drillStatsMap: Map<string, DrillStatsData[]>, metrics: SelectItem<string>[]) {
		return [...drillStatsMap.keys()].map(date => {
			const csvSession = {
				date
			};
			metrics.forEach(metric => {
				(csvSession as any)[metric.label as string] = drillStatsMap
					.get(date)
					?.find(data => data.key === metric.value)?.value;
			});
			return csvSession;
		});
	}

	downloadReport(name: DrillStatsReportType, data: DrillStatsReportPDF, filename: string): void {
		this.report.getReport(name, data, '', null, filename);
	}
}
