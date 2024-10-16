import { Match } from '@iterpro/shared/data-access/sdk';
import {
	Labelled,
	MatchEvent,
	PlayerStatsDetail,
	RawPlayersStats,
	RawSessionImportData,
	RawTeamStats,
	SessionPlayerDetail,
	TeamStatsDetail,
	TrainingEvent
} from '../interfaces/import-store.interfaces';

// these are the data ready to be displayed as a table with added event/match id
export class ImportStore {
	id?: string;
	sessionName: string;
	sessionObj: RawSessionImportData | RawPlayersStats | RawTeamStats;
	matches: Array<Labelled<MatchEvent>> | Array<Match>;
	events: Array<Labelled<TrainingEvent>>;
	eventId: string;
	matchId: string;
	enabled: boolean;
	gameImport: boolean;
	sessionPlayers: SessionPlayerDetail[];
	playersStats?: PlayerStatsDetail[] = [];
	teamStats?: TeamStatsDetail = null;
	errors?: string;
	splits: string[];
	csvFile: any;
}
