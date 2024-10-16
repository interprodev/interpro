import {
	CompetitionGame,
	InstatTeamJson,
	ScoutingGame,
	ScoutingGameEssentialCustomer,
	TeamGender,
	ThirdPartyGameDetail
} from '@iterpro/shared/data-access/sdk';
import { getGameDurationString, getId, isValidDate } from '@iterpro/shared/utils/common-utils';
import { createReducer, on } from '@ngrx/store';
import * as moment from 'moment/moment';
import * as StoreDetailActions from './store-detail.actions';

export const storeDetailFeatureKey = 'scoutingEvent_storeDetail';
export interface State {
	isLoading: boolean;
	error?: any;
	success?: string;
	warning?: string;
	game?: ScoutingGame;
	gameBackup?: ScoutingGame;
	customer?: ScoutingGameEssentialCustomer;
	customers: ScoutingGameEssentialCustomer[];
	teamGender?: TeamGender;
	isAdminOrUniqueScout: boolean;
	isLeftPanelMaximized: boolean;
	isOnEdit: boolean;
	hasScoutingGamePermission: boolean;
	isScoutingAdmin: boolean;
	thirdPartyCompetitionGames: CompetitionGame[];
	teamsWithoutCompetitions: InstatTeamJson[];
	attachmentDialogVisibility: boolean;
	homeTeamCrest?: string; // these crest duplication (crest is always in lineup) is for custom game selection
	awayTeamCrest?: string;
}

export const initialState: State = {
	isLoading: false,
	error: undefined,
	success: undefined,
	warning: undefined,
	game: undefined,
	gameBackup: undefined,
	isLeftPanelMaximized: true,
	customer: undefined,
	customers: [],
	teamGender: undefined,
	isAdminOrUniqueScout: false,
	isOnEdit: false,
	hasScoutingGamePermission: false,
	isScoutingAdmin: false,
	thirdPartyCompetitionGames: [],
	teamsWithoutCompetitions: [],
	attachmentDialogVisibility: false,
	homeTeamCrest: undefined,
	awayTeamCrest: undefined
};

export const reducer = createReducer(
	initialState,
	on(StoreDetailActions.toggledLeftPanelMaximize, state => ({
		...state,
		isLeftPanelMaximized: !state.isLeftPanelMaximized
	})),
	on(StoreDetailActions.loadStoreDetails, (state, { scoutingGame }) => ({
		...state,
		game: wrapGame(scoutingGame.game),
		customer: scoutingGame.customer,
		customers: scoutingGame.customers,
		isScoutingAdmin: scoutingGame.isScoutingAdmin,
		hasScoutingGamePermission: scoutingGame.hasScoutingGamePermission,
		isAdminOrUniqueScout: scoutingGame.isAdminOrUniqueScout,
		teamGender: scoutingGame.teamGender,
		...checkIfEditable(scoutingGame.game)
	})),
	on(StoreDetailActions.updatedGameModel, (state, { game }): State => {
		if (game.startTime) {
			const hoursMinutes = getTimeHoursMinutes(game.startTime);
			const start = moment(state.game?.start).set(hoursMinutes).toDate();
			return {
				...state,
				game: { ...state.game, ...game, start } as any
			};
		} else {
			return {
				...state,
				game: { ...state.game, ...game } as any
			};
		}
	}),
	on(StoreDetailActions.loadCompetitionGames, (state, { start }): State => {
		const hoursMinutes = state.game ? getTimeHoursMinutes(state.game.startTime) : { hour: 0, minute: 0 };
		return {
			...state,
			isLoading: state.game.thirdPartyProviderCompetitionId > 0,
			game: {
				...state.game,
				start: isValidDate(start) ? moment(start).set(hoursMinutes).toDate() : null
			} as any,
			gameBackup: state.game,
			thirdPartyCompetitionGames: []
		};
	}),
	on(StoreDetailActions.loadCompetitionGamesSuccess, (state, { competitionGames }): State => {
		if (!state.game?.thirdPartyProviderMatchId) {
			return {
				...state,
				isLoading: false,
				thirdPartyCompetitionGames: competitionGames
			};
		}
		const gameDetail = competitionGames.find(({ matchId }) => matchId === state.game.thirdPartyProviderMatchId)?.match;
		return {
			...state,
			isLoading: false,
			thirdPartyCompetitionGames: competitionGames,
			game: mapGameDetailToGame(
				gameDetail,
				state.game?.thirdPartyProviderMatchId,
				state.game?.thirdPartyProvider,
				state.game
			),
			gameBackup: state.game
		};
	}),
	on(
		StoreDetailActions.loadCompetitionGamesFailure,
		(state, { error, warning }): State => ({ ...state, isLoading: false, error, warning })
	),
	on(
		StoreDetailActions.clickedEditButton,
		(state): State => ({
			...state,
			isOnEdit: true,
			gameBackup: state.game,
			isLoading: false
		})
	),
	on(
		StoreDetailActions.clickedDiscardButton,
		(state): State => ({
			...state,
			isOnEdit: false,
			game: state.gameBackup,
			gameBackup: undefined
		})
	),
	on(StoreDetailActions.selectedCustomTeam, (state, { team, side, crest }): State => {
		if (side === 'home') {
			return {
				...state,
				game: {
					...state.game,
					homeTeam: team.name,
					thirdPartyProviderHomeTeamId:
						team.thirdPartyId === -1 && state.game.thirdPartyProviderHomeTeamId
							? state.game.thirdPartyProviderHomeTeamId
							: team.thirdPartyId > -1
								? team.thirdPartyId
								: -1
				},
				homeTeamCrest: crest
			};
		}
		return {
			...state,
			game: {
				...state.game,
				awayTeam: team.name,
				thirdPartyProviderAwayTeamId:
					team.thirdPartyId === -1 && state.game.thirdPartyProviderAwayTeamId
						? state.game.thirdPartyProviderAwayTeamId
						: team.thirdPartyId > -1
							? team.thirdPartyId
							: -2,
				timezone: moment(state.game.start, 'MMMM DD, YYYY at hh:mm:ss A Z').format('ZZ') // for sending via email the local time
			},
			awayTeamCrest: crest
		};
	}),
	on(StoreDetailActions.selectGameFromCompetition, (state, { matchId }): State => {
		if (matchId > 0) {
			return {
				...state,
				game: { ...state.game, thirdPartyProviderMatchId: matchId },
				isLoading: true,
				homeTeamCrest: undefined,
				awayTeamCrest: undefined
			};
		}
		return {
			...state,
			isLoading: false,
			game: {
				...state.game,
				thirdPartyProviderMatchId: matchId,
				title: undefined,
				result: undefined,
				homeTeam: undefined,
				awayTeam: undefined,
				thirdPartyProviderHomeTeamId: undefined,
				thirdPartyProviderAwayTeamId: undefined
			} as any,
			homeTeamCrest: undefined,
			awayTeamCrest: undefined
		};
	}),
	on(
		StoreDetailActions.selectCompetition,
		(state, { competitionId }): State => ({
			...state,
			teamsWithoutCompetitions: [],
			game: updateScoutingGame({ ...state.game, thirdPartyProviderCompetitionId: competitionId }),
			homeTeamCrest: undefined,
			awayTeamCrest: undefined,
			thirdPartyCompetitionGames: []
		})
	),
	on(
		StoreDetailActions.selectGameFromCompetitionSuccess,
		(state, { gameDetail, matchId, matchThirdPartyProvider }): State => ({
			...state,
			isLoading: false,
			game: mapGameDetailToGame(gameDetail, matchId, matchThirdPartyProvider, state.game),
			gameBackup: state.game
		})
	),
	on(
		StoreDetailActions.setReportInformation,
		(state, { templateId, templateVersion }): State => ({
			...state,
			game: { ...state.game, gameReportsTemplateId: templateId, gameReportsTemplateVersion: templateVersion }
		})
	),
	on(
		StoreDetailActions.selectedOtherTeamsCompetition,
		(state, { teams }): State => ({ ...state, teamsWithoutCompetitions: teams })
	),
	on(StoreDetailActions.sendEmail, (state): State => ({ ...state, isLoading: true })),
	on(StoreDetailActions.sendEmail, (state): State => ({ ...state, isLoading: true })),
	on(
		StoreDetailActions.sendEmailSuccess,
		(state): State => ({
			...state,
			game: { ...state.game, sent: true },
			success: 'permissions.alert.email.sent',
			isLoading: false
		})
	),
	on(
		StoreDetailActions.sendEmailFailure,
		(state, { error }): State => ({ ...state, game: { ...state.game, sent: false }, error, isLoading: false })
	),
	on(
		StoreDetailActions.attachmentDialogShowButtonClicked,
		(state): State => ({ ...state, attachmentDialogVisibility: true })
	),
	on(
		StoreDetailActions.attachmentDialogSaveButtonClicked,
		(state, { game }): State => ({ ...state, attachmentDialogVisibility: false, game })
	),
	on(
		StoreDetailActions.attachmentDialogDiscardButtonClicked,
		(state): State => ({ ...state, attachmentDialogVisibility: false })
	),
	on(
		StoreDetailActions.allReportsMarkAsCompleted,
		(state, { allCompleted }): State => ({
			...state,
			game: {
				...state.game,
				completed: allCompleted
			}
		})
	),
	on(StoreDetailActions.setAssignedToGameDetail, (state, { scoutIds }): State => {
		if (!state.isScoutingAdmin && state.game?.assignedTo?.length > 1) return state;
		// if I'm not scouting admin and the current than one scout assigned, I can't change the assignedTo of the eventDetail
		// So it will allow only in creation mode by a non admin user, for an Admin user, always
		return {
			...state,
			game: {
				...state.game,
				assignedTo: scoutIds
			}
		};
	}),
	on(
		StoreDetailActions.saveClicked,
		(state): State => ({
			...state,
			error: undefined,
			warning: undefined,
			success: undefined,
			isLoading: true
		})
	),
	on(
		StoreDetailActions.saveFailure,
		(state, { error, warning }): State => ({ ...state, isLoading: false, error, warning })
	),
	on(
		StoreDetailActions.saveSuccess,
		(state, { game }): State => ({
			...state,
			isLoading: false,
			gameBackup: undefined,
			isOnEdit: false,
			game,
			success: 'alert.recordUpdated'
		})
	),
	on(StoreDetailActions.destroyStoreDetail, (): State => initialState)
);

function getTimeHoursMinutes(startTime: string): { hour: number; minute: number } {
	const time = moment(startTime || '00:00', 'HH:mm a');
	const hour = time.get('hour');
	const minute = time.get('minute');
	return { hour, minute };
}

function checkIfEditable(game: ScoutingGame): Partial<State> {
	const isOnEdit = !getId(game);
	return isOnEdit ? { isOnEdit, gameBackup: game } : { isOnEdit };
}

function updateScoutingGame(game: ScoutingGame): ScoutingGame {
	const updatedInfo: Partial<ScoutingGame> =
		game && game.thirdPartyProviderCompetitionId < 0
			? {
					thirdPartyProviderMatchId: -1
				}
			: {
					thirdPartyProviderMatchId: null,
					homeTeam: null,
					awayTeam: null,
					thirdPartyProviderHomeTeamId: null,
					thirdPartyProviderAwayTeamId: null
				};
	return <ScoutingGame>{ ...game, ...updatedInfo };
}

function getTeamName(matchLabel: string): { clubGameHomeTeam: string; clubGameAwayTeam: string } {
	const labelArray = matchLabel.split(',');
	const teamNames = labelArray.length > 0 ? labelArray[0].split(' - ').map(teamName => teamName.trim()) : [];
	const clubGameHomeTeam = teamNames.length > 0 ? teamNames[0] : 'NA';
	const clubGameAwayTeam = teamNames.length > 1 ? teamNames[1] : 'NA';
	return { clubGameHomeTeam, clubGameAwayTeam };
}

function getMatchResult(matchLabel: string): string {
	const labelArray = matchLabel.split(',');
	return labelArray.length > 1 ? labelArray[1].trim() : '';
}

function wrapGame(game: ScoutingGame): ScoutingGame {
	const duration = getGameDurationString(game.startTime, game.endTime);
	return {
		...game,
		startTime: moment(game.start).format('HH:mm'),
		endTime: moment(game.start)
			.add(duration || 90, 'minutes')
			.format('HH:mm')
	};
}

export function mapGameDetailToGame(
	gameDetail: ThirdPartyGameDetail,
	matchId: number,
	matchThirdPartyProvider: string,
	game: ScoutingGame
): ScoutingGame {
	const teamIds = Object.keys(gameDetail.teamsData);
	const thirdPartyProviderHomeTeamId = Number(
		teamIds.find(id => gameDetail.teamsData[id].side === 'home') || game.homeTeam
	);
	const thirdPartyProviderAwayTeamId = Number(
		teamIds.find(id => gameDetail.teamsData[id].side === 'away') || game.awayTeam
	);
	/*
		Set locale to en to avoid issues with moment parsing the date
		The issue occurs because the date string September 14, 2024 at 3:00:00 PM GMT+2 is in English, and when you change the locale to Italian (it),
		moment.js expects the date string to be in Italian. Since the string is still in English, moment.js can't parse it correctly and returns Invalid Date.
	g*/
	moment.locale('en');
	return {
		id: getId(game),
		title: gameDetail.label.split(',')[0],
		start: moment(gameDetail.date, 'MMMM DD, YYYY at hh:mm:ss A Z').toDate(),
		timezone: moment(gameDetail.date, 'MMMM DD, YYYY at hh:mm:ss A Z').format('ZZ'), // for sending via email the local time
		startTime: moment(gameDetail.dateutc).format('HH:mm'),
		endTime: moment(moment.utc(gameDetail.dateutc)).add(90, 'minutes').format('HH:mm'),
		thirdPartyProviderCompetitionId: gameDetail.competitionId,
		thirdPartyProviderMatchId: matchId,
		awayTeam: getTeamName(gameDetail.label).clubGameAwayTeam,
		homeTeam: getTeamName(gameDetail.label).clubGameHomeTeam,
		result: getMatchResult(gameDetail.label),
		location: game.location || gameDetail.venue,
		thirdPartyProviderHomeTeamId,
		thirdPartyProviderAwayTeamId,
		thirdPartyProvider: matchThirdPartyProvider,
		author: game.author,
		history: game.history,
		teamId: game.teamId,
		gameReportsTemplateId: game.gameReportsTemplateId,
		gameReportsTemplateVersion: game.gameReportsTemplateVersion,
		_attachments: game?._attachments,
		attachments: [],
		_playerMatchStats: [],
		assignedTo: game.assignedTo,
		clubId: game.clubId,
		completed: game?.completed,
		gameReports: [],
		playerMatchStats: [],
		sent: game?.sent,
		notes: game.notes,
		club: undefined as any,
		team: undefined as any
	};
}
