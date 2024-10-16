import { Event, PlayerStat, SessionImportData, SessionPlayerData, TeamStat } from '@iterpro/shared/data-access/sdk';
import { Message } from 'primeng/api';
import { ImportStore } from '../ngrx/import-store.model';

export enum WizardPhase {
	SELECT = 0,
	REVIEW = 1,
	MAP = 2,
	COMPLETED = 3,
	INVALID = -1
}

export type ImportProvider =
	| 'gps'
	| 'gpexe'
	| 'statsport'
	| 'sonra'
	| 'catapult'
	| 'fieldwiz'
	| 'wimu'
	| 'teamStats'
	| 'playersStats';
export type SessionMessage = Message & { link?: SessionEvent; type?: string };

// these are raw data from csv/provider
export interface RawSessionImportData extends SessionImportData {
	csvFile?: string;
	headers?: any[];
	sessionPlayerData: SessionPlayerData[];
	notMappedPlayers?: any[];
}

export interface RawSessionPlayerData {
	sessions: SessionPlayerData[];
	notMappedPlayers: string[];
	parsed: unknown[];
}

export interface RawPlayersStats {
	csvFile: string;
	headers: any[];
	playersStats: PlayerStat[];
}

export interface RawTeamStats {
	csvFile: string;
	headers: any[];
	teamStats: TeamStat;
}

// componenent importGps/importProvider (source) output
export interface ImportedSessionSetInfo {
	importStores: ImportStore[];
	currentTeamSplitSession: string;
	currentTeamGameSplitSession: string;
}

interface ExtendedSessionPlayerData extends SessionPlayerData {
	drillToConvert: boolean;
}

export interface SessionPlayerDetail {
	id: string;
	enabled: boolean;
	playerId: string;
	playerName: string;
	sessionPlayerObj: ExtendedSessionPlayerData;
}

export interface PlayerStatsDetail {
	id: string;
	enabled: boolean;
	playerId: string;
	playerName: string;
	playerStat: PlayerStat;
}
export interface TeamStatsDetail {
	id: string;
	enabled: boolean;
	teamStats: TeamStat;
}
export type Labelled<T> = T & { importLabel: string; title?: string };
export type TrainingEvent = Pick<Event, 'id' | 'title' | 'description' | 'start' | 'lastUpdateDate'>;
export type MatchEvent = Pick<Event, 'id' | 'title' | 'description' | 'start' | 'lastUpdateDate' | 'opponent'>;

// these are the data that will be uploaded to the server
export interface UploadableSession {
	sessionImport: Omit<RawSessionImportData, 'sessionPlayerData'>;
	sessionPlayerData: SessionPlayerData[];
	eventId: string;
	matchId: string;
}

// this is the result of the db insertion
export interface UploadedSessionResult {
	errors: string[];
	numberSessions: number;
	confirmMessage: string[];
	sessEvents: SessionEvent[];
}

// this is the event associated with sessions, it is used to navigate to the event
export interface SessionEvent {
	name: string;
	start: string;
	eventId: string;
}

// map drill interface
export interface SplitAssociation {
	index: number;
	mainSession: boolean;
	splitName: string;
	newDrill: boolean;
	drillName: string;
	drillId: string;
	toConvert: boolean;
}

export enum ConfigurationProblem {
	NO = 0,
	GPS = 1,
	SEASON = 2,
	GPS_SEASON = 3 // (GPS 1 + SEASON 2 = 3)
}
