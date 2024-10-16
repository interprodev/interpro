import {
	DenormalizedScoutingGameFields,
	PlayerScouting, ProviderType,
	Schema,
	ScoutingGameEssentialCustomer,
	ScoutingGameEssentialSettings,
	ScoutingGameReportWithPlayer,
	ThirdPartyClubGame,
	ThirdPartyTeamSquadHomeAway
} from '@iterpro/shared/data-access/sdk';
import { sortByName } from '@iterpro/shared/utils/common-utils';
import { createReducer, on } from '@ngrx/store';
import { cloneDeep } from 'lodash';
import * as moment from 'moment';
import * as StoreGameReportListActions from './store-game-report-list.actions';

export const storeGameReportListFeatureKey = 'scoutingEvent_storeGameReportList';

export interface State {
	isLoading: boolean;
	isTeamSquadLoading: boolean;
	isTemplatesLoading: boolean;
	error: any;
	success?: string;
	info?: string;
	gameReportTemplates: Schema[];
	clubId?: string;
	teamId?: string;
	settings?: ScoutingGameEssentialSettings;
	existingScoutingPlayers: PlayerScouting[];
	customer: ScoutingGameEssentialCustomer;
	customers: ScoutingGameEssentialCustomer[];
	isScoutingAdmin?: boolean;
	gameReports: ScoutingGameReportWithPlayer[];
	gameReportsToDeleteIds: string[];
	scoutingPlayersInReport: PlayerScouting[];
	playersInTeam?: ThirdPartyTeamSquadHomeAway;
	thirdPartyProviderHomeTeamId?: number;
	thirdPartyProviderAwayTeamId?: number;
	homeTeamName?: string;
	awayTeamName?: string;
	formation?: ThirdPartyClubGame;
	gameStartDate?: Date;
	completed: boolean;
	playersToSetAsObserved: number[];
	confirmPlayerCreationVisibility: boolean;
	gameId?: string;
	denormalizedScoutingGameFields: DenormalizedScoutingGameFields;
	stateBackup?: State;
}

export const initialState: State = {
	isLoading: false,
	isTemplatesLoading: false,
	isTeamSquadLoading: false,
	error: undefined,
	success: undefined,
	info: undefined,
	gameReportTemplates: [],
	clubId: undefined,
	teamId: undefined,
	settings: undefined,
	existingScoutingPlayers: [],
	customer: undefined,
	customers: [],
	isScoutingAdmin: false,
	gameReports: [],
	gameReportsToDeleteIds: [],
	scoutingPlayersInReport: [],
	playersInTeam: { home: undefined, away: undefined },
	thirdPartyProviderHomeTeamId: undefined,
	thirdPartyProviderAwayTeamId: undefined,
	homeTeamName: undefined,
	awayTeamName: undefined,
	formation: undefined,
	gameStartDate: undefined,
	completed: false,
	playersToSetAsObserved: [],
	confirmPlayerCreationVisibility: false,
	gameId: undefined,
	denormalizedScoutingGameFields: undefined,
	stateBackup: undefined
};

export const reducer = createReducer(
	initialState,
	on(
		StoreGameReportListActions.initStoreGameReportLists,
		(state, { settings, existingScoutingPlayers, customer, customers, isScoutingAdmin, clubId, teamId }) => ({
			...state,
			settings,
			existingScoutingPlayers,
			customer,
			customers,
			clubId,
			teamId,
			isScoutingAdmin
		})
	),
	on(StoreGameReportListActions.loadStoreGameReportLists, state => ({
		...state,
		isLoading: true,
		isTemplatesLoading: true
	})),
	on(StoreGameReportListActions.loadStoreGameReportListsSuccess, (state, { gameReports, playersInReport }) => ({
		...state,
		gameReports: gameReports,
		scoutingPlayersInReport: playersInReport,
		isLoading: false,
		isTemplatesLoading: gameReports.length > 0
	})),
	on(StoreGameReportListActions.loadStoreGameReportListsFailure, (state, { error }): State => ({ ...state, error })),
	on(StoreGameReportListActions.loadGameReportTemplatesSuccess, (state, { templates }) => ({
		...state,
		gameReportTemplates: templates,
		isTemplatesLoading: false
	})),
	on(StoreGameReportListActions.loadGameReportTemplatesFailure, (state, { error }): State => ({ ...state, error })),
	on(
		StoreGameReportListActions.loadTeamSquads,
		(
			state,
			{
				thirdPartyProviderMatchId,
				thirdPartyProviderHomeTeamId,
				thirdPartyProviderAwayTeamId,
				homeTeamName,
				awayTeamName
			}
		): State => ({
			...state,
			isTeamSquadLoading:
				thirdPartyProviderMatchId > 0 && thirdPartyProviderHomeTeamId > -1 && thirdPartyProviderAwayTeamId > -1,
			thirdPartyProviderHomeTeamId: thirdPartyProviderHomeTeamId > -1 ? thirdPartyProviderHomeTeamId : -1,
			thirdPartyProviderAwayTeamId: thirdPartyProviderAwayTeamId > -1 ? thirdPartyProviderAwayTeamId : -2,
			homeTeamName,
			awayTeamName
		})
	),
	on(
		StoreGameReportListActions.loadTeamSquadsSuccess,
		(state, { playersInTeam }): State => ({
			...state,
			playersInTeam,
			isTeamSquadLoading: false
		})
	),
	on(StoreGameReportListActions.loadTeamSquadsFailure, (state, { error }): State => ({ ...state, error })),
	on(
		StoreGameReportListActions.loadFormation,
		(state, { formation }): State => ({
			...state,
			formation
		})
	),
	on(
		StoreGameReportListActions.loadGameStartDate,
		(state, { startDate }): State => ({
			...state,
			gameStartDate: startDate
		})
	),
	on(
		StoreGameReportListActions.addGameReportAccepted,
		(state, { alreadyAssignedPlayersFound }): State => ({
			...state,
			isLoading: true,
			info: alreadyAssignedPlayersFound
				? 'Some players was not added because a Report assigned to that Scout already exist.'
				: undefined
		})
	),
	on(
		StoreGameReportListActions.addGameReportsSuccess,
		(state, { gameReports, newPlayerScouting, playersWithError }): State => ({
			...state,
			gameReports: [...state.gameReports, ...gameReports],
			isLoading: newPlayerScouting.length > 0,
			error:
				playersWithError.length > 0
					? {
							message:
								playersWithError.map(({ thirdPartyId, id }) => (thirdPartyId ? thirdPartyId : id)).toString() +
								' cannot add these players, no playerScouting has been found'
					  }
					: undefined
		})
	),
	on(StoreGameReportListActions.addNewPlayerScoutingSuccess, (state, { newPlayerScouting }): State => {
		const clonedDatas: any[] = [];
		for (const newPlayer of newPlayerScouting) {
			const editedObservedPlayer = state.gameReports.find(
				({ playerScouting }) =>
					playerScouting &&
					(playerScouting.instatId === newPlayer.instatId || playerScouting.wyscoutId === newPlayer.wyscoutId)
			);
			const clonedData = cloneDeep(editedObservedPlayer);
			clonedData.downloadUrl = newPlayer.downloadUrl;
			clonedDatas.push(clonedData);
		}
		return {
			...state,
			scoutingPlayersInReport: [...state.scoutingPlayersInReport, ...newPlayerScouting],
			isLoading: false
		};
	}),
	on(StoreGameReportListActions.selectedCustomTeam, (state, { team, side }): State => {
		if (side === 'home') {
			return {
				...state,
				isLoading: team.thirdPartyId > -1,
				isTeamSquadLoading: team.thirdPartyId > -1,
				thirdPartyProviderHomeTeamId:
					team.thirdPartyId === state.thirdPartyProviderAwayTeamId ? team.thirdPartyId - 1 : team.thirdPartyId
			};
		} else {
			return {
				...state,
				isLoading: team.thirdPartyId > -1,
				isTeamSquadLoading: team.thirdPartyId > -1,
				thirdPartyProviderAwayTeamId:
					team.thirdPartyId === state.thirdPartyProviderHomeTeamId ? team.thirdPartyId - 1 : team.thirdPartyId
			};
		}
	}),
	on(StoreGameReportListActions.selectedCustomTeamSuccess, (state, { playersInTeam, side }): State => {
		if (side === 'home') {
			return {
				...state,
				playersInTeam: { away: state.playersInTeam?.away, home: playersInTeam },
				isLoading: false,
				isTeamSquadLoading: false
			};
		} else {
			return {
				...state,
				playersInTeam: { home: state.playersInTeam?.home, away: playersInTeam },
				isLoading: false,
				isTeamSquadLoading: false
			};
		}
	}),
	on(StoreGameReportListActions.deleteSavedGameReport, (state, { index, reportId, teamId }): State => {
		const { sideGameReports, otherSideGameReports } = getSidesGameReports(
			state.gameReports,
			state.isScoutingAdmin,
			state.customer.id,
			teamId
		);
		return {
			...state,
			gameReports: [
				...otherSideGameReports,
				...sortByName(sideGameReports, 'displayName').filter((_, i) => i !== index)
			],
			gameReportsToDeleteIds: [...state.gameReportsToDeleteIds, reportId]
		};
	}),
	on(StoreGameReportListActions.deleteTempGameReport, (state, { index, teamId }): State => {
		const { sideGameReports, otherSideGameReports } = getSidesGameReports(
			state.gameReports,
			state.isScoutingAdmin,
			state.customer.id,
			teamId
		);
		return {
			...state,
			gameReports: [
				...otherSideGameReports,
				...sortByName(sideGameReports, 'displayName').filter((_, i) => i !== index)
			]
		};
	}),
	on(StoreGameReportListActions.deleteReportsSuccess, (state): State => {
		return {
			...state,
			gameReportsToDeleteIds: [],
			success: 'alert.recordDeleted'
		};
	}),
	on(StoreGameReportListActions.deleteReportsFailure, (state, { error }): State => ({ ...state, error })),
	on(StoreGameReportListActions.updatedGameReport, (state, { payload: report, teamId, index, authorId }): State => {
		const { sideGameReports, otherSideGameReports } = getSidesGameReports(
			state.gameReports,
			state.isScoutingAdmin,
			state.customer.id,
			teamId
		);
		return {
			...state,
			gameReports: [
				...otherSideGameReports,
				...sortByName(sideGameReports, 'displayName').map((gameReport, gameReportIndex) => {
					if (index === gameReportIndex) {
						return {
							...gameReport,
							...report,
							...getReportHistory(gameReport.history, authorId)
						};
					}
					return gameReport;
				})
			]
		};
	}),
	on(
		StoreGameReportListActions.updatedGameReportData,
		(state, { sectionId, teamId, index, payload: template, authorId }): State => {
			const { sideGameReports, otherSideGameReports } = getSidesGameReports(
				state.gameReports,
				state.isScoutingAdmin,
				state.customer.id,
				teamId
			);
			return {
				...state,
				gameReports: [
					...otherSideGameReports,
					...sortByName(sideGameReports, 'displayName').map((gameReport, gameReportIndex) => {
						if (index === gameReportIndex) {
							return {
								...gameReport,
								reportData: {
									...gameReport['reportData'],
									[sectionId]: { ...gameReport['reportData']?.[sectionId], ...template }
								},
								...getReportHistory(gameReport.history, authorId)
							};
						}
						return gameReport;
					})
				]
			};
		}
	),
	on(StoreGameReportListActions.genericError, (state, { error }): State => ({ ...state, error })),
	on(
		StoreGameReportListActions.resetStoreGameReportList,
		(state): State => ({
			...initialState,
			settings: state.settings,
			existingScoutingPlayers: state.existingScoutingPlayers,
			clubId: state.clubId,
			teamId: state.teamId,
			customer: state.customer,
			customers: state.customers,
			isScoutingAdmin: state.isScoutingAdmin
		})
	),
	on(StoreGameReportListActions.gameReportClickedEditButton, (state): State => ({ ...state, stateBackup: state })),
	on(StoreGameReportListActions.gameReportClickedDiscardButton, (state): State => state.stateBackup),
	on(
		StoreGameReportListActions.saveReports,
		(state, { game }): State => ({
			...state,
			gameId: game.id,
			denormalizedScoutingGameFields: <DenormalizedScoutingGameFields>{
				start: game.start,
				assignedTo: game.assignedTo,
				homeTeam: game.homeTeam,
				awayTeam: game.awayTeam,
				history: game.history,
				title: game.title,
				thirdPartyProviderCompetitionId: game?.thirdPartyProviderCompetitionId,
				thirdPartyProvider: game?.thirdPartyProvider as ProviderType
			},
			isLoading: false
		})
	),
	on(StoreGameReportListActions.saveReportsAccepted, (state, { updatedPlayers }): State => {
		const updatePlayersThirdPartyIds = updatedPlayers.map(({ wyscoutId, instatId }) => instatId || wyscoutId);
		return {
			...state,
			playersToSetAsObserved: state.playersToSetAsObserved.filter(
				(thirdPartyId: number) => !updatePlayersThirdPartyIds.includes(thirdPartyId)
			),
			scoutingPlayersInReport: state.scoutingPlayersInReport.map((player: PlayerScouting) => {
				if (updatePlayersThirdPartyIds.includes(player?.wyscoutId || player?.instatId)) {
					return {
						...player,
						observed: true
					};
				}
				return player;
			}),
			gameReports: state.gameReports.map(gameReport => {
				const newPlayerScoutingFoundId = updatePlayersThirdPartyIds.find(
					(thirdPartyId: number) => thirdPartyId === gameReport.thirdPartyProviderId
				);
				if (newPlayerScoutingFoundId) {
					return {
						...gameReport,
						playerScoutingId: newPlayerScoutingFoundId
					};
				}
				return gameReport;
			})
		};
	}),
	on(
		StoreGameReportListActions.saveReportsFailure,
		(state, { error }): State => ({ ...state, isLoading: false, error })
	),
	on(
		StoreGameReportListActions.saveReportsSuccess,
		(state, { reports }): State => ({
			...state,
			isLoading: false,
			gameReports: reports,
			success: 'alert.recordUpdated'
		})
	),
	on(StoreGameReportListActions.switchCaseAlwaysCreateProfile, (state, { playerIds }): State => {
		return {
			...state,
			playersToSetAsObserved: playerIds,
			isLoading: true,
			confirmPlayerCreationVisibility: false
		};
	}),
	on(
		StoreGameReportListActions.shownConfirmPlayerCreationDialog,
		(state): State => ({ ...state, confirmPlayerCreationVisibility: true })
	),
	on(
		StoreGameReportListActions.discardConfirmationDialogClicked,
		(state): State => ({ ...state, confirmPlayerCreationVisibility: false })
	),
	on(
		StoreGameReportListActions.saveConfirmationDialogClicked,
		(state): State => ({ ...state, isLoading: true, confirmPlayerCreationVisibility: false })
	),
	on(StoreGameReportListActions.editPlayersCreationList, (state, { playerId, removed }): State => {
		const index = removed ? state.playersToSetAsObserved.findIndex(id => id === playerId) : -1;
		return {
			...state,
			playersToSetAsObserved: removed
				? [...state.playersToSetAsObserved.slice(0, index), ...state.playersToSetAsObserved.slice(index + 1)]
				: [...state.playersToSetAsObserved, playerId]
		};
	}),
	on(
		StoreGameReportListActions.editAllPlayersCreationList,
		(state, { playerIds }): State => ({
			...state,
			playersToSetAsObserved: playerIds
		})
	),
	on(
		StoreGameReportListActions.selectTeamForNonCategorizedPlayer,
		(state, { thirdPartyProviderPlayerId, teamId }): State => {
			return {
				...state,
				gameReports: state.gameReports.map(gameReport => {
					if (gameReport.thirdPartyProviderId === thirdPartyProviderPlayerId) {
						return {
							...gameReport,
							thirdPartyProviderTeamId: teamId
						};
					}
					return gameReport;
				})
			};
		}
	),
	on(StoreGameReportListActions.destroyStoreGameReports, (): State => initialState)
);

export const areSamePlayers = (player1: PlayerScouting, player2: PlayerScouting): boolean => {
	return <boolean>(
		((player1.wyscoutId && player1.wyscoutId === player2.wyscoutId) ||
			(player1.instatId && player1.instatId === player2.instatId) ||
			(player1.id && player1.id === player2.id) ||
			(player1.displayName && player1.displayName === player2.displayName))
	);
};

function getReportHistory(reportHistory: any[], authorId: string): { history: { updatedAt: Date; author: string }[] } {
	const tempHistory = cloneDeep(reportHistory || []);
	tempHistory.unshift({
		updatedAt: moment().toDate(),
		author: authorId
	});
	return {
		history: tempHistory
	};
}

function getSidesGameReports(
	gameReports: ScoutingGameReportWithPlayer[],
	isScoutingAdmin: boolean,
	customerId: string,
	teamId: number
): { otherSideGameReports: ScoutingGameReportWithPlayer[]; sideGameReports: ScoutingGameReportWithPlayer[] } {
	const otherSideGameReports = gameReports.filter(
		({ thirdPartyProviderTeamId }) => thirdPartyProviderTeamId !== teamId
	);
	const sideGameReports = gameReports.filter(
		({ thirdPartyProviderTeamId, scoutId }) =>
			thirdPartyProviderTeamId === teamId && (isScoutingAdmin || !customerId || scoutId === customerId)
	);
	return { otherSideGameReports, sideGameReports };
}
