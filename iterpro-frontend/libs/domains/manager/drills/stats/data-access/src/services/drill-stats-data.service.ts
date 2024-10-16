import { Injectable } from '@angular/core';
import { Player } from '@iterpro/shared/data-access/sdk';
import { SelectItem } from 'primeng/api';
import { DrillStatsData } from '../models/drill-stats.interface';
import { DrillsMapping } from '@iterpro/shared/utils/common-utils';

@Injectable({
	providedIn: 'root'
})
export class DrillStatsDataService {
	getMetrics(drillStatsMap: Map<string, DrillStatsData[]>, drillsMapping: DrillsMapping): SelectItem<string>[] {
		const playersStats: DrillStatsData[] = []
			.concat(...(Array.from(drillStatsMap.values()) as []))
			.filter(item => Boolean(item)); // Flatten Players Data Arrays
		const distincMetrics = [...new Set(playersStats.map((data: DrillStatsData) => data.key))]; // Distinct metrics

		const keys: string[] = Array.from(Object.keys(drillsMapping));
		const values: SelectItem<string>[] = [];
		keys.forEach(k => values.push(...(Array.from((drillsMapping as any)[k]) as SelectItem<string>[])));

		return distincMetrics.map(m => ({ value: m, label: values.find(v => v.value === m)?.label }));
	}

	getComparisonMap(
		selectedPlayers: Partial<Player>[],
		drillStatsMap: Map<string, DrillStatsData[]>
	): Map<string, DrillStatsData[]> {
		const playersMap = new Map<string, DrillStatsData[]>();
		selectedPlayers.forEach(p => {
			const data: DrillStatsData[] | undefined = drillStatsMap.get(p.id);
			playersMap.set(p.displayName as string, data || []);
		});
		return playersMap;
	}

	getComparisonStatsMap(
		selectedPlayers: Partial<Player>[],
		drillStatsMap: Map<string, DrillStatsData[]>,
		drillsMapping: DrillsMapping
	): Map<string, (number | string)[]> {
		const playersMap = new Map<string, (number | string)[]>();
		const metrics = this.getMetrics(drillStatsMap, drillsMapping);
		selectedPlayers.forEach(p => {
			const data: DrillStatsData[] | undefined = drillStatsMap.get(p.id);
			const values: (number | string)[] = metrics.map(metric => data?.find(d => d.key === metric.value)?.value || '-');
			playersMap.set(p.displayName as string, values);
		});
		return playersMap;
	}

	getPeriodTrendStatsMap(
		drillStatsMap: Map<string, DrillStatsData[]>,
		drillsMapping: DrillsMapping
	): Map<string, (number | string)[]> {
		const playersMap = new Map<string, (number | string)[]>();
		const metrics = this.getMetrics(drillStatsMap, drillsMapping);
		[...drillStatsMap.keys()].forEach(k => {
			const data: DrillStatsData[] | undefined = drillStatsMap.get(k);
			const values: (number | string)[] = metrics.map(metric => data?.find(d => d.key === metric.value)?.value || '-');
			playersMap.set(k, values);
		});
		return playersMap;
	}
}
