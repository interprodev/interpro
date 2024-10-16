import {
	Customer,
	ScoutingGame,
	ScoutingGameWithReport,
	ScoutingPlayerGamesTableRow,
	ScoutingSettings
} from '@iterpro/shared/data-access/sdk';
import { isDefined, sortByDateDesc } from '@iterpro/shared/utils/common-utils';
import { MemoizedSelector, createFeatureSelector, createSelector } from '@ngrx/store';
import { map, mean, sum } from 'lodash';
import * as moment from 'moment';
import {
	GameLevels,
	PlayerScoutingInfo,
	ScoutingGamesRecap
} from '../interfaces/scouting-player-games-store.interfaces';
import { State, adapter, scoutingGamesFeatureKey } from './scouting-player-games-store.state';

export const { selectAll } = adapter.getSelectors();

const getPlayerInfo = (state: State): PlayerScoutingInfo => state.playerInfo;
const getCurrentTeamId = (state: State): string => state.currentTeamId;
const getLoading = (state: State): boolean => state.loading;
const getSettings = (state: State): ScoutingSettings => state.settings;
const getCustomers = (state: State): Customer[] => state.customers;

export const selectState: MemoizedSelector<object, State> = createFeatureSelector<State>(scoutingGamesFeatureKey);
export const selectAllPlayerGamesStore: MemoizedSelector<object, any[]> = createSelector(selectState, selectAll);
export const selectPlayerInfo: MemoizedSelector<object, PlayerScoutingInfo> = createSelector(
	selectState,
	getPlayerInfo
);

export const selectCurrentTeamId: MemoizedSelector<object, string> = createSelector(selectState, getCurrentTeamId);
export const selectLoading: MemoizedSelector<object, boolean> = createSelector(selectState, getLoading);
export const selectSettings: MemoizedSelector<object, ScoutingSettings> = createSelector(selectState, getSettings);
export const selectCustomers: MemoizedSelector<object, Customer[]> = createSelector(selectState, getCustomers);
export const selectPlayerId: MemoizedSelector<object, string> = createSelector(selectPlayerInfo, info => info.id);
export const selectIsTipss: MemoizedSelector<object, boolean> = createSelector(
	selectSettings,
	settings => settings.gameReport === 'tipss'
);

export const selectIsWatford: MemoizedSelector<object, boolean> = createSelector(
	selectSettings,
	settings => settings.gameReport === 'watford'
);

export const selectIsSwiss: MemoizedSelector<object, boolean> = createSelector(
	selectSettings,
	settings => settings.survey === 'swiss'
);

export const selectAllPlayerGamesStoreSorted: MemoizedSelector<object, ScoutingGame[]> = createSelector(
	selectAllPlayerGamesStore,
	games => sortByDateDesc(games, 'start')
);

export const selectScoutingPlayerLinkedGamesWithoutTipss: MemoizedSelector<object, ScoutingGameWithReport[]> =
	createSelector(selectAllPlayerGamesStoreSorted, selectPlayerId, (games, id) =>
		games.reduce((table: ScoutingGameWithReport[], game: ScoutingGameWithReport) => {
			return !!game ? [...table, game] : table;
		}, [])
	);

export const selectScoutingPlayerLinkedGamesWithTipss: MemoizedSelector<object, ScoutingGameWithReport[]> =
	createSelector(
		selectPlayerInfo,
		selectAllPlayerGamesStoreSorted,
		selectPlayerId,
		selectCurrentTeamId,
		({ teamId, observerTeams }, games, id, currentTeamId) => {
			return games.reduce((table: ScoutingGameWithReport[], game: ScoutingGameWithReport) => {
				let row = null;
				if (
					game.teamId === currentTeamId ||
					(observerTeams[game.teamId] &&
						moment(game.start).startOf('day').isBefore(moment(observerTeams[game.teamId]).startOf('day')))
				) {
					row = game || null;
				}
				return row ? [...table, row] : table;
			}, []);
		}
	);

export const selectScoutingPlayerLinkedGames: MemoizedSelector<object, ScoutingGameWithReport[]> = createSelector(
	selectIsSwiss,
	selectScoutingPlayerLinkedGamesWithTipss,
	selectScoutingPlayerLinkedGamesWithoutTipss,
	(isSwiss, withTipss, withoutTipss) => {
		return isSwiss ? withTipss : withoutTipss;
	}
);

export const selectScoutingPlayerLinkedGameReport: MemoizedSelector<object, ScoutingGameWithReport[]> = createSelector(
	selectScoutingPlayerLinkedGames,
	selectIsSwiss,
	selectIsWatford,
	selectIsTipss,
	(games, hasSurvey, isWatford, isTipss) =>
		games.filter(
			gameWithReport => !!gameWithReport.completed && areTipssFulfilled(gameWithReport, hasSurvey, isWatford, isTipss)
		)
);

export const selectGamesRecap: MemoizedSelector<object, ScoutingGamesRecap> = createSelector(
	selectScoutingPlayerLinkedGameReport,
	selectIsSwiss,
	selectIsWatford,
	selectIsTipss,
	(gameReports, isSwiss, isWatford, isTipss) => {
		const levelAverage = getAllGamesLevelAvg(gameReports);
		const tipssAverage = getTipssAvg(gameReports, isSwiss, isWatford, isTipss);
		const tipssDeviation = getTipssDeviation(tipssAverage, gameReports, isSwiss, isWatford, isTipss);
		return {
			gamesCounter: gameReports.length,
			levelAverage,
			tipssAverage: isNaN(tipssAverage) ? '-' : String(tipssAverage),
			tipssDeviation: isNaN(tipssDeviation) ? '-' : String(tipssDeviation)
		};
	}
);

export const selectScoutingPlayerGamesTable: MemoizedSelector<object, ScoutingPlayerGamesTableRow[]> = createSelector(
	selectScoutingPlayerLinkedGames,
	selectIsWatford,
	selectCustomers,
	(linkedGames, isWatford, customers) =>
		linkedGames.map((gameWithReport: ScoutingGameWithReport) => scoutingGame2GameReportRow(gameWithReport, customers))
);

const basic1section = ['Technique', 'Insight', 'Personality', 'Speed', 'Structure'];
const swissTotal = ['Technique', 'Insight', 'Personality', 'Speed'];
const malta1section = ['Technique', 'Insight', 'Personality', 'Speed', 'Structure', 'Performance'];
const watford1section = [
	'PerformanceGrade',
	'OverallGrade',
	'PotentialGrade',
	'PotentialFor',
	'Recommendation',
	'Position'
];

function scoutingGame2GameReportRow(
	gameWithReport: ScoutingGameWithReport,
	customers: Customer[]
): ScoutingPlayerGamesTableRow {
	const {
		start,
		scoutId,
		location,
		homeTeam,
		awayTeam,
		level,
		_videos,
		_documents,
		report,
		authorId,
		author,
		completed,
		teamName,
		reportData
	} = gameWithReport;

	const opponent = teamName === homeTeam ? awayTeam : homeTeam;

	const result = {
		game: gameWithReport,
		start,
		assignedTo: scoutId ? getUser(scoutId, customers) : null,
		opponent,
		location,
		level,
		_videos,
		_documents,
		report,
		author: getUser(authorId || author, customers),
		completed
	};
	if (reportData) {
		Object.keys(reportData).forEach(key => {
			for (const property of reportData[key]) {
				result[key + property.key] = {
					value: property.value,
					color: property.color,
					comment: property.comment
				};
			}
		});
	}
	return result;
}

function getUser(author: string, customers: Customer[]) {
	const found = customers.find(customer => customer.id === author);
	return !!found ? `${found.firstName} ${found.lastName}` : null;
}

function getTipssDeviation(
	avg: number,
	gameReports: ScoutingGameWithReport[],
	hasSurvey: boolean,
	isWatford: boolean,
	isTipss: boolean
): number {
	// @ts-ignore
	return Number(
		Math.sqrt(
			sum(
				map(
					gameReports.map(gameReport => getPlayerTotal(gameReport, hasSurvey, isWatford, isTipss)),
					i => Math.pow(i - avg, 2)
				)
			) / gameReports.length
		).toFixed(1)
	);
}

function getTipssAvg(
	gameReports: ScoutingGameWithReport[],
	isSwiss: boolean,
	isWatford: boolean,
	isTipss: boolean
): number {
	return Number(
		mean(gameReports.map(gameReport => getPlayerTotal(gameReport, isSwiss, isWatford, isTipss))).toFixed(1)
	);
}

function getAllGamesLevelAvg(gameReports: ScoutingGameWithReport[]): string {
	return GameLevels[Math.floor(mean(gameReports.map(({ level }) => getLevelNumber(level))))];
}

function getAttributesFromClubType(isSwiss: boolean, isWatford: boolean, isTipss: boolean): string[] {
	if (isWatford) return watford1section;
	if (isSwiss) return swissTotal;
	if (isTipss) return basic1section;
	return malta1section;
}

function getSectionNameFromClubType(hasSurvey: boolean, isWatford: boolean) {
	if (isWatford) return 'section';
	return hasSurvey ? 'performance' : 'tipss';
}

function areTipssFulfilled(
	gameReport: ScoutingGameWithReport,
	isSwiss: boolean,
	isWatford: boolean,
	isTipss: boolean
): boolean {
	const attributes = getAttributesFromClubType(isSwiss, isWatford, isTipss);
	const sectionName = getSectionNameFromClubType(isSwiss, isWatford);
	return attributes.every(attribute => isDefined(getReportDataFakeStatic(gameReport, sectionName, attribute)));
}

function getPlayerTotal(gameReport: ScoutingGameWithReport, isSwiss: boolean, isWatford, isTipss: boolean): number {
	if (isSwiss || isWatford) {
		let total = 0;
		const attributes = getAttributesFromClubType(isSwiss, isWatford, isTipss);
		attributes.forEach(attribute => {
			total += getReportDataFakeStatic(gameReport, isSwiss ? 'performance' : 'tipss', attribute)?.value || 0;
		});
		return total;
	}
	return getReportDataFakeStatic(gameReport, 'tipss', 'Total')?.value || 0;
}

function getReportDataFakeStatic(gameReport: ScoutingGameWithReport, section: string, propertyKey: string) {
	return gameReport?.reportData[section]?.find(({ key }) => key === propertyKey);
}

function getLevelNumber(level: string): number {
	return GameLevels[level];
}
