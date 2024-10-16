import { Drill, Player } from '@iterpro/shared/data-access/sdk';
import { ChartData, ChartOptions } from 'chart.js';
import { DrillStatsViews, DrillType, OrderType } from './drill-stats.types';
import { DrillsMapping } from '@iterpro/shared/utils/common-utils';

export interface DrillStatsFiltersData {
	drills: Drill[];
	drillsMapping: DrillsMapping | undefined;
	players: Partial<Player>[];
}

export interface DrillStatsFilters {
	datePeriod: Date[];
	drillsIds: string[];
	players: Partial<Player>[];
	drillType: DrillType;
	metric: string | null;
}

export interface DrillStatsResponse {
	metric: string;
	numDrills: number;
	numDrillsMin: number;
	numSessions: number;
	numSessionsMin: number;
	numSessionMinPercentage: number;
	results: Map<string, DrillStatsData[]>;
}

export interface DrillStatsResult {
	stats: DrillStatsValues;
	results: Map<string, DrillStatsData[]>; // Key => PlayerID
}

export interface DrillStatsValues {
	numDrills: number;
	numDrillsMin: number;
	numSessions: number;
	numSessionsMin: number;
	numSessionMinPercentage: number;
}

export interface DrillStatsData {
	counter: number;
	key: string;
	value: number;
	percentage: string;
}

export interface DrillStatsFilterEvent {
	period: Date[];
	drillIds: string[];
	playerIds: string[];
	isActualMode: boolean;
	metric: string;
}

export interface DrillStatsReportPDF {
	title: string;
	subTitle: DrillStatsViews; // Comparison & Period
	createdLabel: string;
	metric: { label: string; value: string };
	metricDescription: string;
	datePeriod: { label: string; value: string }; // join start & end date
	actualFlag: { label: string; value: string }; // value = 'Planned' o 'Actual' tradotto
	numSessions: { label: string; value: number };
	numSessionsMin: { label: string; value: number };
	numDrills: { label: string; value: number };
	numDrillsMin: { label: string; value: number };
	numSessionMinPercentage: { label: string; value: number };
	players: { label: string; value: string }; // join players names
	drills: { label: string; value: string }; // join drills names
	statsTable: {
		headers: { label: string }[]; // 'Player Name', 'Metric 1', 'Metric 2', ...
		values: (string | number)[][]; // 'Player1', 278, 10, ... For each row
	};
	data: ChartData;
	options: ChartOptions;
}

export interface DrillStatsComparisonReportCSV {
	player: string | undefined;
	startDate: string;
	endDate: string;
	[key: string]: any; // METRCIS --> Forced to any
}

export interface ChartFlags {
	labels: boolean;
	percentage: boolean;
	order: OrderType;
}
