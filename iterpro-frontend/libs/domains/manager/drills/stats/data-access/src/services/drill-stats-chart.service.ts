import { Injectable, inject } from '@angular/core';
import { ChartOptionsWithLabels, Player } from '@iterpro/shared/data-access/sdk';
import { PRIMARIES, getDataLabels, getDefaultCartesianConfig, DrillsMapping } from '@iterpro/shared/utils/common-utils';
import { ChartData, TooltipItem } from 'chart.js';
import chroma from 'chroma-js';
import { sortBy } from 'lodash';
import { SelectItem } from 'primeng/api';
import { ChartFlags, DrillStatsData } from '../models/drill-stats.interface';
import { OrderType } from '../models/drill-stats.types';
import { DrillStatsDataService } from './drill-stats-data.service';

@Injectable({
	providedIn: 'root'
})
export class DrillStatsChartService {
	readonly #dataService = inject(DrillStatsDataService);

	//#region COMPARISON
	buildComparisonChart(
		drillStatsMap: Map<string, DrillStatsData[]>,
		selectedPlayers: Partial<Player>[],
		chartFlags: ChartFlags,
		drillsMapping: DrillsMapping
	): ChartData {
		// DISTINCT METRICS - INITIALIZE LABELS & DATASETS (ORDERING PLAYERS)
		const orderedPlayers = this.sortData(drillStatsMap, selectedPlayers, chartFlags.order);
		const playersMap: Map<string, DrillStatsData[]> = this.#dataService.getComparisonMap(orderedPlayers, drillStatsMap);
		const metrics: SelectItem<string>[] = this.#dataService.getMetrics(drillStatsMap, drillsMapping);
		const datasets: any[] = []; // Forced to any (datalabels is a chartjs plugin and not supported in ChartDataset type)
		const labels: string[] = [...playersMap.keys()];

		// Cicle Metrics to create Datasets
		metrics.forEach((metric, index) => {
			datasets.push({
				type: 'bar',
				label: metric.label,
				data: this._getData(labels, metric.value, playersMap, chartFlags),
				backgroundColor:
					index < PRIMARIES.length
						? PRIMARIES[index]
						: chroma(PRIMARIES[index % PRIMARIES.length])
								.set('hsl.h', Math.abs(360 - PRIMARIES.length * index))
								.hex(),
				datalabels: getDataLabels(chartFlags.labels, chartFlags.percentage)
			});
		});

		return { labels, datasets };
	}
	//#endregion

	//#region TREND
	buildPeriodTrendChart(
		drillStatsMap: Map<string, DrillStatsData[]>,
		chartFlags: ChartFlags,
		drillsMapping: DrillsMapping
	): ChartData {
		// DISTINCT METRICS - INITIALIZE LABES & DATASETS
		const metrics: SelectItem<string>[] = this.#dataService.getMetrics(drillStatsMap, drillsMapping);
		const labels: string[] = Array.from(drillStatsMap.keys());
		const datasets: any[] = []; // Forced to any (datalabels is a chartjs plugin and not supported in ChartDataset type)

		// CICLE METRICS TO CREATE DATASETS
		metrics.forEach((metric, index) => {
			datasets.push({
				type: 'bar',
				label: metric.label,
				data: this._getData(labels, metric.value, drillStatsMap, chartFlags),
				backgroundColor:
					index < PRIMARIES.length
						? PRIMARIES[index]
						: chroma(PRIMARIES[index % PRIMARIES.length])
								.set('hsl.h', Math.abs(360 - PRIMARIES.length * index))
								.hex(),
				datalabels: getDataLabels(chartFlags.labels, chartFlags.percentage)
			});
		});

		return { labels, datasets };
	}
	//#endregion

	//#region OPTIONS
	getChartOptions(chartFlags: ChartFlags): ChartOptionsWithLabels {
		const options: ChartOptionsWithLabels = {
			...getDefaultCartesianConfig('category'),
			responsive: true,
			maintainAspectRatio: true,
			scales: {
				x: {
					stacked: true,
					ticks: {
						color: '#ddd'
					},
					grid: {
						display: false
					}
				},
				y: {
					stacked: true,
					ticks: {
						color: '#ddd',
						callback: (value: number, index: number, ticksArr: string[]) =>
							chartFlags.percentage && index === ticksArr.length - 1 ? `${value}%` : value
					}
				}
			}
		};

		options.plugins.tooltip = {
			mode: 'index',
			intersect: false,
			callbacks: {
				label: (tooltip: TooltipItem<'bar'>) => {
					return `${tooltip.dataset.label}: ${tooltip.formattedValue}${chartFlags.percentage ? '%' : ''}`;
				}
			}
		};

		options.plugins.colors = {
			enabled: false,
			forceOverride: true
		};

		return options;
	}
	//#endregion

	//#region UTILS
	sortData(
		drillStatsMap: Map<string, DrillStatsData[]>,
		selectedPlayers: Partial<Player>[],
		orderType: OrderType
	): Partial<Player>[] {
		const players: Partial<Player>[] = sortBy(selectedPlayers, 'displayName');
		const mappedPlayers: any[] = players.map(p => ({
			data: p,
			total: drillStatsMap.get(p.id)?.reduce((acc, data) => acc + data.value || 0, 0) || 0
		}));

		switch (orderType) {
			case OrderType.Asc:
				return sortBy(mappedPlayers, 'total').map(p => p.data);

			case OrderType.Desc:
				return sortBy(mappedPlayers, 'total')
					.map(p => p.data)
					.reverse();

			case OrderType.Unordered:
				return players;

			default:
				return [];
		}
	}

	private _getData(
		keys: string[],
		metric: string,
		drillStatsMap: Map<string, DrillStatsData[]>,
		chartFlags: ChartFlags
	): (number | undefined)[] {
		if (chartFlags.percentage) {
			return keys.map(k => Number(drillStatsMap.get(k)?.find(data => data.key === metric)?.percentage));
		}
		return keys.map(k => drillStatsMap.get(k)?.find(data => data.key === metric)?.value);
	}
	//#endregion
}
