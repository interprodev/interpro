import { ScoutingGame, Team } from '../../../../lib';
import { ProviderType } from '../../etl/interfaces';
import { Goal } from '../../game-stats/game-stats.interface';

export interface ThirdPartyGameDetailBase {
	competition: any;
	competitionId: number;
	date: string;
	dateutc: string;
	duration: string;
	gameweek: number;
	hasDataAvailable: boolean;
	label: string;
	referees: any[];
	roundId: number;
	seasonId: number;
	status: string;
	teamsData: ThirdPartyTeamsData;
	venue: string;
	winner: number;
}

export interface WyscoutThirdPartyGameDetail extends ThirdPartyGameDetailBase {
	wyId: number;
}
export interface InStatThirdPartyGameDetail extends ThirdPartyGameDetailBase {
	id: number;
}

export type ThirdPartyGameDetail = WyscoutThirdPartyGameDetail | InStatThirdPartyGameDetail;
export type ScoutingGameWithDetails = ScoutingGame & Pick<ThirdPartyGameDetail, 'teamsData' | 'competition'>;

export interface CompetitionGame {
	goals: Goal[];
	matchId: number;
	match: ThirdPartyGameDetail;
}

export interface ThirdPartyTeamSquad {
	teamId: number;
	players: any[];
}

export interface ThirdPartyTeamSquadHomeAway {
	home?: ThirdPartyTeamSquad;
	away?: ThirdPartyTeamSquad;
}

export interface ThirdPartyGameTeamStats {
	average: any;
	competitionId: number;
	matchId: number;
	percent: any;
	roundId: number;
	seasonId: number;
	teamId: number;
	total: any;
}

export type ThirdPartyGameStats = [ThirdPartyGameTeamStats, ThirdPartyGameTeamStats] | [];

export interface ThirdPartyTeamsData {
	[key: number]: ThirdPartyTeamDataDetail;
}

export interface ThirdPartyTeamDataDetail {
	coachId?: number;
	formation?: Formation;
	hasFormation: number;
	imageDataURL: string;
	score?: number;
	scoreET?: number;
	scoreHT?: number;
	scoreP?: number;
	side: 'home' | 'away';
	teamId: number;
	teamName: string;
}

export interface Formation {
	bench: ThirdPartyPlayerStat[];
	lineup: ThirdPartyPlayerStat[];
	substitutions: any[];
}

export interface ThirdPartyPlayerStat {
	assists: string;
	goals: string;
	ownGoals: string;
	player: any;
	playerId: number;
	redCards: string;
	shirtNumber: number;
	yellowCards: string;
}

export interface ParsedMatchStat {
	label: string | undefined;
	homePercentage: number;
	awayPercentage: number;
	home: number | undefined;
	away: number | undefined;
}

export type SearchResultTeam = Pick<Team, 'crest' | 'name'> & { thirdPartyId: any; thirdPartyProvider: ProviderType };

export interface SelectCustomTeamActionModel {
	team: SearchResultTeam;
	side: 'home' | 'away';
	crest: string;
}
