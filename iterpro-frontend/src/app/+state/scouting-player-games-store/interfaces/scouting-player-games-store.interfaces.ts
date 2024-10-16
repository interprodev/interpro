import { ColorMapping, PlayerScouting, ScoutingGame, ScoutingGameWithReport } from '@iterpro/shared/data-access/sdk';

export const defaultFiveDoubleColorMapping: ColorMapping[] = [
	{ min: 1, max: 2, color: '#dd0000' },
	{ min: 2, max: 4, color: '#ffee00' },
	{ min: 4, max: 5, color: '#009900' }
];

export const defaultTenIntColorMapping: ColorMapping[] = [
	{ min: 1, max: 4, color: '#dd0000' },
	{ min: 4, max: 8, color: '#ffee00' },
	{ min: 8, max: 10, color: '#009900' }
];

export interface Action {
	target: ScoutingGame | ScoutingGame[] | ScoutingGameWithReport[];
	action: 'edit' | 'add' | 'deleteScoutingGame' | 'deleteGameReports';
}

export type PlayerScoutingInfo = Pick<PlayerScouting, 'id' | 'observerTeams' | 'teamId'>;

export enum GameLevels {
	'game.level.low' = 1,
	'game.level.medium' = 2,
	'game.level.high' = 3,
	'game.level.elite' = 4
}

export interface ScoutingGamesRecap {
	gamesCounter: number;
	levelAverage: string;
	tipssAverage: string;
	tipssDeviation: string;
}

/*
export interface ScoutingGameLinkedPlayer { // TODO REMOVE WHEN NO NEED ANYMORE
	game: ScoutingGame;
  gameReport: ScoutingGameReport;
}

export type PotentialLevel = 'A' | 'B' | 'C';

export interface SurveyQuestionAverage extends Partial<CustomQuestion> {
	yes: number;
	no: number;
	avg: 'yes' | 'no' | '-';
}
export interface TipssScore {
	technique: number;
	insight: number;
	personality: number;
	speed: number;
	structure?: number;
}
*/
