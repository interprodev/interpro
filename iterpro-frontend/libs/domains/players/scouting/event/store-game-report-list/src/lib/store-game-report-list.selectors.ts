import {
	PlayerScouting,
	Schema,
	ScoutingGameEssentialCustomer,
	ScoutingGameEssentialSettings,
	ScoutingGameReport,
	ScoutingGameReportWithPlayer,
	ScoutingSettings,
	ThirdPartyClubGame,
	ThirdPartyLinkedPlayer,
	ThirdPartyTeamSquadHomeAway
} from '@iterpro/shared/data-access/sdk';
import { getId, sortByName } from '@iterpro/shared/utils/common-utils';
import { MemoizedSelector, createFeatureSelector, createSelector } from '@ngrx/store';
import { uniq, uniqBy } from 'lodash';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';
import * as fromStoreGameReportList from './store-game-report-list.reducer';

export const selectStoreGameReportListState = createFeatureSelector<fromStoreGameReportList.State>(
	fromStoreGameReportList.storeGameReportListFeatureKey
);

const getIsLoading = (state: fromStoreGameReportList.State): boolean => state.isLoading;
const getError = (state: fromStoreGameReportList.State): any => state.error;
const getSuccess = (state: fromStoreGameReportList.State): string => state.success;
const getInfo = (state: fromStoreGameReportList.State): string => state.info;
const getGameReportTemplates = (state: fromStoreGameReportList.State): Schema[] => state.gameReportTemplates;
const getIsTeamSquadLoading = (state: fromStoreGameReportList.State): boolean => state.isTeamSquadLoading;
const getIsTemplatesLoading = (state: fromStoreGameReportList.State): boolean => state.isTemplatesLoading;
const getSettings = (state: fromStoreGameReportList.State): ScoutingGameEssentialSettings | undefined => state.settings;
const getCurrentScout = (state: fromStoreGameReportList.State): ScoutingGameEssentialCustomer => state.customer;
const getAllScouts = (state: fromStoreGameReportList.State): ScoutingGameEssentialCustomer[] => state.customers;
const getIsScoutingAdmin = (state: fromStoreGameReportList.State): boolean => state.isScoutingAdmin;
const getReports = (state: fromStoreGameReportList.State): ScoutingGameReportWithPlayer[] => state.gameReports;
const getReportsToDeleteIds = (state: fromStoreGameReportList.State): string[] => state.gameReportsToDeleteIds;
const getPlayersInTeam = (state: fromStoreGameReportList.State): ThirdPartyTeamSquadHomeAway => state.playersInTeam;
const getHomeTeamId = (state: fromStoreGameReportList.State): number => state.thirdPartyProviderHomeTeamId;
const getAwayTeamId = (state: fromStoreGameReportList.State): number => state.thirdPartyProviderAwayTeamId;
const getHomeTeamName = (state: fromStoreGameReportList.State): string => state.homeTeamName;
const getAwayTeamName = (state: fromStoreGameReportList.State): string => state.awayTeamName;
const getGameId = (state: fromStoreGameReportList.State): string => state.gameId;
const getClubId = (state: fromStoreGameReportList.State): string => state.clubId;
const getActiveTeamId = (state: fromStoreGameReportList.State): string => state.teamId;
const getScoutingPlayersInReport = (state: fromStoreGameReportList.State): PlayerScouting[] =>
	state.scoutingPlayersInReport;
const getExistingScoutingPlayers = (state: fromStoreGameReportList.State): PlayerScouting[] =>
	state.existingScoutingPlayers;
const getFormation = (state: fromStoreGameReportList.State): ThirdPartyClubGame => state.formation;
const getGameStartDate = (state: fromStoreGameReportList.State): Date => state.gameStartDate;
const getPlayersToSetAsObserved = (state: fromStoreGameReportList.State): number[] => state.playersToSetAsObserved;
const getConfirmPlayerCreationVisibility = (state: fromStoreGameReportList.State): boolean =>
	state.confirmPlayerCreationVisibility;
const getDenormalizedGameFields = (state: fromStoreGameReportList.State): any | undefined =>
	state.denormalizedScoutingGameFields;

export const selectError: MemoizedSelector<object, any> = createSelector(selectStoreGameReportListState, getError);
export const selectSuccess: MemoizedSelector<object, string> = createSelector(
	selectStoreGameReportListState,
	getSuccess
);
export const selectInfo: MemoizedSelector<object, string> = createSelector(selectStoreGameReportListState, getInfo);

export const selectReportTemplates: MemoizedSelector<object, Schema[]> = createSelector(
	selectStoreGameReportListState,
	getGameReportTemplates
);

export const selectBasicReports = createSelector(selectStoreGameReportListState, getReports);
export const selectCurrentScout = createSelector(selectStoreGameReportListState, getCurrentScout);
export const selectIsScoutingAdmin = createSelector(selectStoreGameReportListState, getIsScoutingAdmin);
export const selectScouts = createSelector(selectStoreGameReportListState, getAllScouts);

export const selectReports = createSelector(
	selectBasicReports,
	selectReportTemplates,
	selectCurrentScout,
	selectIsScoutingAdmin,
	(reports, templates, currentScout, isScoutingAdmin) => {
		return reports
			.filter(({ scoutId }) => isScoutingAdmin || !scoutId || scoutId === currentScout.id)
			.map(report => ({
				...report,
				template: templates.find(
					({ id, version }) => id && id === report.templateId && version && version === report.templateVersion
				)
			}));
	}
);

export const selectReportsToDeleteIds = createSelector(selectStoreGameReportListState, getReportsToDeleteIds);
export const selectIsLoading: MemoizedSelector<object, boolean> = createSelector(
	selectStoreGameReportListState,
	getIsLoading
);
export const selectIsTeamSquadLoading: MemoizedSelector<object, boolean> = createSelector(
	selectStoreGameReportListState,
	getIsTeamSquadLoading
);

export const selectIsTemplatesLoading: MemoizedSelector<object, boolean> = createSelector(
	selectStoreGameReportListState,
	getIsTemplatesLoading
);

export const selectSettings: MemoizedSelector<object, ScoutingGameEssentialSettings> = createSelector(
	selectStoreGameReportListState,
	getSettings
);

export const selectHomeTeamId: MemoizedSelector<object, number> = createSelector(
	selectStoreGameReportListState,
	getHomeTeamId
);

export const selectAwayTeamId: MemoizedSelector<object, number> = createSelector(
	selectStoreGameReportListState,
	getAwayTeamId
);

export const selectHomeTeamName: MemoizedSelector<object, string> = createSelector(
	selectStoreGameReportListState,
	getHomeTeamName
);

export const selectAwayTeamName: MemoizedSelector<object, string> = createSelector(
	selectStoreGameReportListState,
	getAwayTeamName
);

export const selectClubId: MemoizedSelector<object, string> = createSelector(selectStoreGameReportListState, getClubId);

export const selectGameId: MemoizedSelector<object, string> = createSelector(selectStoreGameReportListState, getGameId);
export const selectActiveTeamId: MemoizedSelector<object, string> = createSelector(
	selectStoreGameReportListState,
	getActiveTeamId
);

export const selectDenormalizedGameFields: MemoizedSelector<object, any> = createSelector(
	selectStoreGameReportListState,
	getDenormalizedGameFields
);

export const selectConfirmPlayerCreationVisibility: MemoizedSelector<object, boolean> = createSelector(
	selectStoreGameReportListState,
	getConfirmPlayerCreationVisibility
);

export const selectActiveTemplateSettings: MemoizedSelector<object, { templateId: string; templateVersion: number }> =
	createSelector(selectSettings, (scoutingSettings: ScoutingSettings) => ({
		templateId: scoutingSettings ? scoutingSettings.activeGameReportTemplateId : undefined,
		templateVersion: scoutingSettings ? scoutingSettings.activeGameReportTemplateVersion : undefined
	}));

export const selectFieldsToEditReport: MemoizedSelector<object, { gameId: string; activeTeamId: string }> =
	createSelector(selectGameId, selectActiveTeamId, (gameId, activeTeamId) => ({ gameId, activeTeamId }));

export const selectExistingScoutingPlayers: MemoizedSelector<object, PlayerScouting[]> = createSelector(
	selectStoreGameReportListState,
	getExistingScoutingPlayers
);

export const selectPlayersInTeam: MemoizedSelector<object, ThirdPartyTeamSquadHomeAway> = createSelector(
	selectStoreGameReportListState,
	getPlayersInTeam
);

export const selectScoutingPlayersInGameReport: MemoizedSelector<object, PlayerScouting[]> = createSelector(
	selectStoreGameReportListState,
	getScoutingPlayersInReport
);
export const selectFormation: MemoizedSelector<object, ThirdPartyClubGame> = createSelector(
	selectStoreGameReportListState,
	getFormation
);

export const selectPlayersToSetAsObserved: MemoizedSelector<object, number[]> = createSelector(
	selectStoreGameReportListState,
	getPlayersToSetAsObserved
);

export const selectGameReportsWithScoutingProfile: MemoizedSelector<object, ScoutingGameReportWithPlayer[]> =
	createSelector(selectReports, selectScoutingPlayersInGameReport, (gameReports, playersInReport) => {
		return sortByName(gameReports, 'displayName').reduce((accumulator, gameReport, index) => {
			const playerScouting = playersInReport
				.filter(player => player)
				.find(
					({ id, instatId, wyscoutId, displayName }) =>
						(!!id && id === gameReport.playerScoutingId) ||
						(!!instatId && instatId === gameReport.thirdPartyProviderId) ||
						(!!wyscoutId && wyscoutId === gameReport.thirdPartyProviderId) ||
						(!!displayName && displayName === gameReport.displayName)
				);
			const downloadUrl = playerScouting ? playerScouting?.downloadUrl : null;
			const reportData = gameReport?.reportData ? gameReport.reportData : {};
			return [...accumulator, { ...gameReport, index, playerScouting: { ...playerScouting, downloadUrl }, reportData }];
		}, []);
	});

export const selectGameReportsHome: MemoizedSelector<object, ScoutingGameReportWithPlayer[]> = createSelector(
	selectHomeTeamId,
	selectGameReportsWithScoutingProfile,
	(homeTeamId, players) => players.filter(({ thirdPartyProviderTeamId }) => thirdPartyProviderTeamId === homeTeamId)
);

export const selectAssignedToReports: MemoizedSelector<object, string[]> = createSelector(selectBasicReports, reports =>
	uniq(reports.filter(({ scoutId }) => scoutId).map(({ scoutId }) => scoutId))
);

export const selectIfAllReportsCompleted: MemoizedSelector<object, boolean> = createSelector(
	selectBasicReports,
	reports => reports.every(({ completed }) => completed)
);

export const selectGameReportsHomeBasic: MemoizedSelector<object, ScoutingGameReportWithPlayer[]> = createSelector(
	selectHomeTeamId,
	selectReports,
	(homeTeamId, players) => players.filter(({ thirdPartyProviderTeamId }) => thirdPartyProviderTeamId === homeTeamId)
);

export const selectGameReportsAwayBasic: MemoizedSelector<object, ScoutingGameReportWithPlayer[]> = createSelector(
	selectAwayTeamId,
	selectReports,
	(awayTeamId, players) => players.filter(({ thirdPartyProviderTeamId }) => thirdPartyProviderTeamId === awayTeamId)
);

export const selectHomeScoutsOptions = createSelector(selectGameReportsHomeBasic, selectScouts, (reports, scouts) => {
	return scouts.map(scout => ({
		label: `${scout.firstName} ${scout.lastName}`,
		value: scout.id,
		assignedPlayersIds: reports
			.filter(({ scoutId }) => scout.id === scoutId)
			.map(({ playerScoutingId }) => playerScoutingId)
	}));
});

export const selectAwayScoutsOptions = createSelector(selectGameReportsAwayBasic, selectScouts, (reports, scouts) => {
	return scouts.map(scout => ({
		label: `${scout.firstName} ${scout.lastName}`,
		value: scout.id,
		assignedPlayersIds: reports
			.filter(({ scoutId }) => scout.id === scoutId)
			.map(({ playerScoutingId }) => playerScoutingId)
	}));
});

export const selectGameReportsAway: MemoizedSelector<object, ScoutingGameReportWithPlayer[]> = createSelector(
	selectAwayTeamId,
	selectGameReportsWithScoutingProfile,
	(awayTeamId, players) => players.filter(({ thirdPartyProviderTeamId }) => thirdPartyProviderTeamId === awayTeamId)
);

export const selectIsGameReportNotCategorized: MemoizedSelector<object, boolean> = createSelector(
	selectHomeTeamId,
	selectAwayTeamId,
	selectHomeTeamName,
	selectAwayTeamName,
	selectGameReportsWithScoutingProfile,
	(homeTeamId, awayTeamId, homeTeamName, awayTeamName, players) =>
		players.some(
			player =>
				player.thirdPartyProviderTeamId !== homeTeamId &&
				player.teamName !== homeTeamName &&
				player.thirdPartyProviderTeamId !== awayTeamId &&
				player.teamName !== awayTeamName
		)
);

export const selectsGameReportsWithPlayersNotCategorized: MemoizedSelector<object, ScoutingGameReportWithPlayer[]> =
	createSelector(
		selectHomeTeamId,
		selectAwayTeamId,
		selectHomeTeamName,
		selectAwayTeamName,
		selectGameReportsWithScoutingProfile,
		(homeTeamId, awayTeamId, homeTeamName, awayTeamName, players) =>
			players.filter(
				player =>
					player.thirdPartyProviderTeamId !== homeTeamId &&
					player.teamName !== homeTeamName &&
					player.thirdPartyProviderTeamId !== awayTeamId &&
					player.teamName !== awayTeamName
			)
	);

export const selectNoReportInGame: MemoizedSelector<object, boolean> = createSelector(
	selectGameReportsHome,
	selectGameReportsAway,
	(homeReports, awayReports) => {
		return homeReports.length === 0 && awayReports.length === 0;
	}
);

export const selectHomeFormation: MemoizedSelector<object, ThirdPartyLinkedPlayer[]> = createSelector(
	selectFormation,
	formation => (formation?.home ? formation.home.players : [])
);

export const selectAwayFormation: MemoizedSelector<object, ThirdPartyLinkedPlayer[]> = createSelector(
	selectFormation,
	formation => (formation?.away ? formation.away.players : [])
);

export const selectActiveScoutingPlayersInReport: MemoizedSelector<object, PlayerScouting[]> = createSelector(
	selectScoutingPlayersInGameReport,
	players => players.filter(({ archived }) => !archived)
);

export const selectHomePlayersInTeam: MemoizedSelector<object, any[]> = createSelector(
	selectHomeTeamId,
	selectPlayersInTeam,
	(id, playersInTeam) => {
		const team = playersInTeam.home;
		return !!team && !!team.players ? team.players : [];
	}
);

export const selectAwayPlayersInTeam: MemoizedSelector<object, any[]> = createSelector(
	selectAwayTeamId,
	selectPlayersInTeam,
	(id, playersInTeam) => {
		const team = playersInTeam.away;
		return !!team && !!team.players ? team.players : [];
	}
);

export const selectHomeFormationSelectItem: MemoizedSelector<object, SelectItem[]> = createSelector(
	selectHomeFormation,
	selectScoutingPlayersInGameReport,
	(players, scoutedPlayers) =>
		players.map(({ playerStats, wyscoutId, instatId }) => {
			const alreadyScouted = scoutedPlayers.find(
				scoutedPlayer => scoutedPlayer.wyscoutId === wyscoutId || scoutedPlayer.instatId === instatId
			);
			const id = alreadyScouted ? alreadyScouted.id : null;
			return {
				label: playerStats.playerName,
				value: { id, thirdPartyId: instatId || wyscoutId }
			};
		})
);

export const selectAwayFormationSelectItem: MemoizedSelector<object, SelectItem[]> = createSelector(
	selectAwayFormation,
	selectScoutingPlayersInGameReport,
	(players, scoutedPlayers) =>
		players.map(({ playerStats, wyscoutId, instatId }) => {
			const alreadyScouted = scoutedPlayers.find(
				scoutedPlayer => scoutedPlayer.wyscoutId === wyscoutId || scoutedPlayer.instatId === instatId
			);
			const id = alreadyScouted ? alreadyScouted.id : null;
			return {
				label: playerStats.playerName,
				value: { id, thirdPartyId: instatId || wyscoutId }
			};
		})
);

export const selectHomePlayersInTeamSelectItem: MemoizedSelector<object, SelectItem[]> = createSelector(
	selectHomePlayersInTeam,
	selectActiveScoutingPlayersInReport,
	(players, playerScoutings) =>
		players.map(player => ({
			label: player.shortName,
			value: { id: getPlayerScoutingId(player, playerScoutings), thirdPartyId: player.instId || player.wyId }
		}))
);

export const selectAwayPlayersInTeamSelectItem: MemoizedSelector<object, SelectItem[]> = createSelector(
	selectAwayPlayersInTeam,
	selectActiveScoutingPlayersInReport,
	(players, playerScoutings) =>
		players.map(player => ({
			label: player.shortName,
			value: { id: getPlayerScoutingId(player, playerScoutings), thirdPartyId: player.instId || player.wyId }
		}))
);

export const selectScoutingPlayerSelectItem: MemoizedSelector<object, SelectItem[]> = createSelector(
	getGameStartDate,
	selectActiveScoutingPlayersInReport,
	(gameStartDate, players) =>
		!!gameStartDate && moment(gameStartDate).startOf('day').isAfter(moment().subtract(1, 'days').startOf('day'))
			? players.map(player => ({
					label: player.displayName,
					value: { id: getId(player), thirdPartyId: player.instatId || player.wyscoutId }
				}))
			: []
);

export const selectHomeAvailablePlayers: MemoizedSelector<object, SelectItem[]> = createSelector(
	selectScoutingPlayerSelectItem,
	selectHomeFormationSelectItem,
	selectHomePlayersInTeamSelectItem,
	selectExistingScoutingPlayers,
	(activeScoutingPlayersInReports, sideFormation, sidePlayersInTeam, profilePlayers) => {
		return getAvailablePlayers(activeScoutingPlayersInReports, sideFormation, sidePlayersInTeam, profilePlayers);
	}
);

export const selectAwayAvailablePlayers: MemoizedSelector<object, SelectItem[]> = createSelector(
	selectScoutingPlayerSelectItem,
	selectAwayFormationSelectItem,
	selectAwayPlayersInTeamSelectItem,
	selectExistingScoutingPlayers,
	(activeScoutingPlayersInReports, sideFormation, sidePlayersInTeam, existingScoutingPlayers) => {
		return getAvailablePlayers(
			activeScoutingPlayersInReports,
			sideFormation,
			sidePlayersInTeam,
			existingScoutingPlayers
		);
	}
);

export const selectReportsRemovedAttachmentURLs: MemoizedSelector<object, string[]> = createSelector(
	selectReports,
	reports => getRemovedURLs(reports)
);

function getAvailablePlayers(
	activeScoutingPlayersInReports: SelectItem[],
	sideFormation: SelectItem[],
	sidePlayersInTeam: SelectItem[],
	existingScoutingPlayers: PlayerScouting[]
): SelectItem[] {
	const uniqs = removeDuplicatePlayers(
		[...(sideFormation.length === 0 ? sidePlayersInTeam : sideFormation)],
		activeScoutingPlayersInReports
	);
	return uniqs.length > 0 ? uniqs : getPlayersScoutingList(existingScoutingPlayers);
}

function removeDuplicatePlayers(players: SelectItem[], playerScoutings: SelectItem[]): SelectItem[] {
	const uniquePlayers: SelectItem[] = [];
	players.forEach(player => {
		const index = playerScoutings.findIndex(
			playerScouting => playerScouting.value.thirdPartyId === player.value.thirdPartyId
		);
		if (index < 0) {
			uniquePlayers.push(player);
		} else {
			uniquePlayers.push(playerScoutings[index]);
			playerScoutings.splice(index, 1);
		}
	});
	return [...sortByName(uniqBy(uniquePlayers, 'label'), 'label'), ...playerScoutings];
}

function getPlayersScoutingList(existingScoutingPlayers: PlayerScouting[]): SelectItem[] {
	return existingScoutingPlayers.map(playerScouting => ({
		label: playerScouting.displayName,
		value: { id: playerScouting.id, thirdPartyId: playerScouting.instatId || playerScouting.wyscoutId }
	}));
}

function getPlayerScoutingId(player: any, playerScoutings: PlayerScouting[]): string {
	const found = playerScoutings.find(
		({ wyscoutId, instatId }) => (instatId && instatId === player.instId) || (wyscoutId && wyscoutId === player.wyId)
	);
	return found ? getId(found) : null;
}

function getRemovedURLs(reports: ScoutingGameReport[]): string[] {
	const reportURLs: string[] = reports.reduce(
		(accumulator: string[], report: ScoutingGameReport) =>
			accumulator.concat([...report._documents, ...report._videos].filter(Boolean).map(({ url }) => url)),
		[]
	);

	return reports.reduce((accumulator: string[], report: ScoutingGameReport) => {
		const actualPlayerURLs = [...report._documents, report._videos].filter(Boolean).map(({ url }) => url);
		return accumulator.concat(actualPlayerURLs.filter(url => !reportURLs.includes(url)));
	}, []);
}

export const selectGameReportsPlayersForCreationList: MemoizedSelector<object, SelectItem[]> = createSelector(
	selectGameReportsWithScoutingProfile,
	gameReports =>
		uniqBy(gameReports, 'thirdPartyProviderId')
			.filter(({ playerScouting }) => !playerScouting.observed)
			.map(({ thirdPartyProviderId, displayName }) => ({
				value: thirdPartyProviderId,
				label: displayName
			}))
);
