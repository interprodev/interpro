import { SelectItem } from 'primeng/api';
import { AttendancesItem } from '../ngrx/attendances-store.model';

export enum ViewType {
	ACTIVITY_LOG = 0,
	STATISTICS = 1
}

export interface PlayerRole {
	id: string;
	name: string;
	displayName: string;
	playerIds?: string[]; // I think that it is never assigned, but it's present in the code
	players?: PlayerRole[]; // same here?
}
export enum SessionType {
	ALL = 0,
	INDIVIDUAL = 1,
	TEAM = 2
}
export enum TeamType {
	PRIMARY = 0,
	SECONDARY = 1
}

export interface Legend {
	label: string;
	attrs: AttendancesItem;
}

export interface SecondaryTeamStats {
	apps: number;
	appsBySubFormat: any;
	minutesPlayed: number;
	minutesPlayedBySubFormat: any;
	startingApps: number;
	substitutingApps: number;
	gameRate: number;
	daysPerGame: number;
}

export type Metric = SelectItem & { clubGame?: boolean };

export type Counter = Record<'sessions' | 'trainings' | 'games' | 'days', number>;

export const paletteEvents = [
	'#0078D7',
	'#f1c40f',
	'#00CC6A',
	'#FF4343',
	'#FF8C00',
	'#018574',
	'#7f8c8d',
	'#9b59b6',
	'#847545',
	'#00B7C3'
] as const;
