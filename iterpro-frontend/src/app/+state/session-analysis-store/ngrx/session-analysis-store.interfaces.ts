import {
	DeviceMetricDescriptor,
	Event,
	PdfBase,
	PdfBasicType,
	PdfChart,
	PdfMixedTable,
	Player,
	SessionPlayerData,
	TeamGroup
} from '@iterpro/shared/data-access/sdk';
import { ChartOptions } from 'chart.js';
import { SelectItem } from 'primeng/api';

export enum Views {
	Session = 0,
	Period = 1
}

export enum SessionAnalysis {
	Team = 0,
	Individual = 1
}

export enum PeriodAnalysis {
	Total = 0,
	Trend = 1
}

export interface RouteParams {
	metric: string[];
	date: Date;
	session_id: string;
	season_id: string;
	player_id: string;
	ewma: boolean;
}

export interface SplitSelectItem extends SelectItem {
	start: Date;
	main: boolean;
}

export interface BubbleMetrics {
	xAxis: DeviceMetricDescriptor;
	yAxis: DeviceMetricDescriptor;
	size: DeviceMetricDescriptor;
}

export interface SessionFilters {
	selectedAnalysis: SessionAnalysis;
	sessions: Event[];
	splits: SplitSelectItem[];
	playersSessions: SessionPlayerData[];
	selectedSession: Event;
	selectedTeamSplit: SplitSelectItem;
	selectedIndividualSplits: SplitSelectItem[];
	selectedIndividualPlayer: Player;
	selectedPlayers: (Player | TeamGroup)[];
	bubbleMetrics: BubbleMetrics;
}

export enum FiltersType {
	All,
	Modified,
	Full
}

export enum SessionsType {
	All,
	Individual,
	Team
}

export interface PeriodFilters {
	splits: SplitSelectItem[];
	games: number;
	trainings: number;
	eventData: Map<string, PeriodMatch>;
	tableData: Map<string, TrendTableData[]>;
	periodTotalSessions: PeriodTotalSession[];
	periodTrendSessions: PeriodTrendSession[];
	selectedAnalysis: PeriodAnalysis;
	selectedDatePeriod: Date[];
	selectedSessionType: SessionsType;
	selectedSplits: SplitSelectItem[];
	selectedPlayers: (Player | TeamGroup)[];
}

export interface ChartFlags {
	bubble: boolean;
	percent: boolean;
	thresholds: boolean;
	labels: boolean;
	order: boolean;
}

export interface ViewFlags {
	sidebar: boolean;
	uploadDialog: boolean;
	isLoading: boolean;
}

export interface SelectOption {
	label: string;
	value: any;
}

export interface SessionsResult {
	events: Event[];
	preselectedSession: Event;
}

export interface PeriodTrendSession {
	label: string;
	values: {
		[key: string]: number[];
	};
}

export interface PeriodTotalSession {
	label: string;
	values: {
		[key: string]: number;
	};
}

export interface PeriodTotalSession {
	label: string;
	values: {
		[key: string]: number;
	};
}

export interface PeriodTotalResult {
	data: PeriodTotalSession[];
	games: number;
	mainSplits: string[];
	splits: string[];
	trainings: number;
}

export interface PeriodTrendResult {
	data: PeriodTrendSession[];
	eventData: Map<string, PeriodMatch>;
	tableData: Map<string, TrendTableData[]>;
	games: number;
	mainSplits: string[];
	splits: string[];
	trainings: number;
}

export interface TrendTableData {
	countGame: number;
	countTraining: number;
	date: string;
	eventHome: boolean;
	eventId: string;
	eventOpponent: string;
	eventResult: string;
	eventStart: string;
	playerId: string;
	playerName: string;
	splitName: string;
	[key: string]: any;
}

export interface PeriodMatch {
	opponent: string;
	result: string;
}
export interface ChartReportData {
	data: {
		datasets: any[];
		labels: any;
	};
	options: ChartOptions;
}

export interface ChartCatDatasets {
	categories: any[];
	datasets: any[];
}

export interface SemaphoreMetricValue {
	value: string | string[];
	semaphore?: string | string[];
	threshold?: string | string[];
	norm?: number | number[];
	ratio?: string | string[];
	canShowSemaphore?: boolean | boolean[];
}

export interface AdvancedState {
	advancedData: Map<string, AdvancedMetricData[]>;
	selectedAdvanced: AdvancedEnum;
	advancedProgress: boolean;
}

export interface AdvancedData {
	name: string;
	value: string;
}

export enum AdvancedEnum {
	'ACWL' = 'ac',
	'Monotony' = 'mon',
	'Strain' = 'strain',
	'Training Stress Balance' = 'tsb',
	'AL/CL EWMA' = 'ewma'
}

export interface AdvancedFlags {
	blockAcc: boolean;
	advancedProgress: boolean;
	advancedAvailable: boolean;
	advancedWrongSelection: boolean;
	noAdvanced: boolean;
}

export interface AdvancedMetricData {
	day: Date;
	id: string;
	metric: string;
	playerId: string;
	playerName: string;
	values: AdvancedMetricValues;
}

// Map<string (playerName), Map<string (date), metri,

export interface AdvancedMetricValues {
	acuteLoad: number;
	alClRatio: number;
	cronicLoad: number;
	ewmaAcuteLoad: number;
	ewmaAlCl: number;
	ewmaCronicLoad: number;
	monthlyMonotony: number;
	monthlyStrain: number;
	stdDevAcute: number;
	stdDevCronic: number;
	sumAcute: number;
	sumCronic: number;
	totalStressBalance: number;
	weeklyMonotony: number;
	weeklyStrain: number;
}

export interface ALCLIndividual {
	name: string;
	value: string;
}

export interface SummaryMetric {
	name: string;
	value: number;
	norm: number;
	colorMetric: string;
}

// REPORTS
export type SessionAnalysisReportType = 'session_team' | 'session_individual' | 'period_total' | 'period_trend';

export interface TeamSessionReportDataPDF extends PdfBase {
	summary: {
		sessionName: PdfBasicType;
		gdType: PdfBasicType;
		split: PdfBasicType;
		metrics: PdfBasicType;
		players: PdfBasicType;
		date: PdfBasicType;
		time: PdfBasicType;
		duration: PdfBasicType;
	};
	chart: PdfChart;
	table: PdfMixedTable;
}

export interface PeriodTotalReportDataPDF extends PdfBase {
	summary: {
		datePeriod: PdfBasicType;
		days: PdfBasicType;
		split: PdfBasicType;
		metrics: PdfBasicType;
		players: PdfBasicType;
	};
	chart: PdfChart;
	table: PdfMixedTable;
}

export interface PeriodTrendReportDataPDF extends PdfBase {
	summary: {
		datePeriod: PdfBasicType;
		days: PdfBasicType;
		split: PdfBasicType;
		metrics: PdfBasicType;
		players?: PdfBasicType; // empty for single players
		sessions: PdfBasicType;
	};
	chart: PdfChart;
	table: PdfMixedTable;
	playerPages?: PeriodTrendReportDataPDF[]; // empty for single players
}

export interface TeamSessionReportDataCSV {
	displayName: string;
	splitName: string;
	splitStartTime: string;
	splitEndTime: string;
	gdType: string;
	partecipants: string;
	[key: string]: any;
}

export interface PeriodReportDataCSV {
	teamId: string;
	dateFrom: any;
	dateTo: any;
	playerIds: string[];
	activeMetrics: any;
	splits: number[];
	timezoneOffset: number;
}
