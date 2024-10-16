import { ChronicInjury, Injury } from '../../../lib';
import { TableColumnBase } from '../table/table-column';

export interface ReadinessPlayerData {
	displayName: string;
	downloadUrl: string;
	nationality: string;
	birthDate: Date;
	position: string;
	jersey: number;
	id: string;
	teamId: string;
	date: Date;
	status: string;
	goscore: GoScorePlayerData;
	healthStatus: HealthStatusPlayerData;
	wellness: WellnessPlayerData;
	readiness: TestInstancePlayerData[];
	bodyChart: BodyChartPlayerData;
}

export interface GoScorePlayerData {
	today: BasicScore;
	last48h: BasicScore;
	last7d: BasicScore;
	injuryRisk: string;
}

export interface HealthStatusPlayerData {
	injuries: InjuriesPlayerData[];
	available: string;
	expectation: string;
	flaredUp: boolean;
	injuryIcon: string;
	color: string;
}

export interface InjuriesPlayerData {
	issue: string;
	chronic: boolean;
	icon: string;
	location: string;
	status: string;
}

export interface WellnessPlayerData {
	fatigue: BasicScore;
	mood: BasicScore;
	sleep: BasicScore;
	soreness: BasicScore;
	stress: BasicScore;
	sleep_duration: string;
	sleep_start: string;
	sleep_end: string;
	locations: string[];
}

export interface TestInstancePlayerData {
	date: string;
	test: string;
	label: string;
	value: string;
	color: string;
	increment: string;
}

export interface BodyChartPlayerData {
	injuries: Injury[];
	chronicInjuries: ChronicInjury[];
}

export interface BasicScore {
	value: number;
	color: string;
	increment?: string;
}

export interface PdfSectionPlayer {
	position: string;
	displayName: string;
	goScore: number;
	incrementTeamView: string;
	careful: boolean;
	pic: string;
}

export enum ReadinessViewType {
	Default = 0,
	Table = 1
}

export enum ReadinessSidebarViewType {
	Session = 0,
	Period = 1
}

export enum ReadinessSessionViewType {
	List = 0,
	Detail = 1
}

export interface ReadinessColumn extends TableColumnBase {
	type: ReadinessColumnType;
	alternativeHeader?: string; // if this is setted, the pdf report take it istead of header
}

export declare type ReadinessColumnType =
	| 'text'
	| 'image'
	| 'icon'
	| 'flag'
	| 'date'
	| 'goScore'
	| 'injuryStatus'
	| 'wellnessBase'
	| 'wellnessSorenessLocation'
	| 'sleepTime'
	| 'withTooltip'
	| 'jerseyNumber'
	| 'translate';
