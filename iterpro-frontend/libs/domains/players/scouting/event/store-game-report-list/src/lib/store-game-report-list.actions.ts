import {
	AddGameReportActionModel,
	BaseReportActionModel,
	DeleteSavedGameReportActionModel,
	ScoutingTeamSide,
	UpdateGameReportActionModel,
	UpdateGameReportDataActionModel
} from '@iterpro/players/scouting/event/sand-box';
import {
	PlayerScouting,
	PlayerToStartObserveInfo,
	ProviderType,
	Schema,
	ScoutingGame, ScoutingGameEssentialCustomer, ScoutingGameEssentialSettings,
	ScoutingGameReportWithPlayer,
	SearchResultTeam,
	ThirdPartyClubGame,
	ThirdPartyTeamSquad,
	ThirdPartyTeamSquadHomeAway
} from '@iterpro/shared/data-access/sdk';
import { createAction, props } from '@ngrx/store';

export const initStoreGameReportLists = createAction(
	'[Scouting Event - StoreGameReportList] Init Store StoreGameReportLists',
	props<{
		settings: ScoutingGameEssentialSettings;
		existingScoutingPlayers: PlayerScouting[];
		clubId: string;
		teamId: string;
		customer: ScoutingGameEssentialCustomer;
		customers: ScoutingGameEssentialCustomer[];
		isScoutingAdmin: boolean;
	}>()
);

export const loadStoreGameReportLists = createAction(
	'[Scouting Event - StoreGameReportList] Load StoreGameReportLists',
	props<{ gameId: string }>()
);

export const predisposePlayersReports = createAction(
	'[Scouting Event - StoreGameReportList] Predispone Players Reports',
	props<{ playerIds: number[] }>()
);

export const loadStoreGameReportListsSuccess = createAction(
	'[Scouting Event - StoreGameReportList] Load StoreGameReportLists Success',
	props<{ gameReports: ScoutingGameReportWithPlayer[]; playersInReport: PlayerScouting[] }>()
);

export const loadStoreGameReportListsFailure = createAction(
	'[Scouting Event - StoreGameReportList] Load StoreGameReportLists Failure',
	props<{ error: any }>()
);

export const loadGameReportTemplatesSuccess = createAction(
	'[Scouting Event - StoreGameReportList] Load GameReportTemplate Success',
	props<{ templates: Schema[] }>()
);

export const loadGameReportTemplatesFailure = createAction(
	'[Scouting Event - StoreGameReportList] Load GameReportTemplate Failure',
	props<{ error: any }>()
);

export const loadTeamSquads = createAction(
	'[Scouting Event - StoreGameReportList] Load Players In Teams',
	props<{
		thirdPartyProviderMatchId: number;
		thirdPartyProviderHomeTeamId: number;
		thirdPartyProviderAwayTeamId: number;
		homeTeamName: string;
		awayTeamName: string;
		thirdPartyProvider: ProviderType;
	}>()
);

export const loadTeamSquadsSuccess = createAction(
	'[Scouting Event - StoreGameReportList] Loaded Players In Teams Success',
	props<{ playersInTeam: ThirdPartyTeamSquadHomeAway }>()
);

export const loadTeamSquadsFailure = createAction(
	'[Scouting Event - StoreGameReportList] Loaded Players In Teams Failure',
	props<{ error: any }>()
);

export const loadFormation = createAction(
	'[Scouting Event - StoreGameReportList] Load Team Formation',
	props<{ formation: ThirdPartyClubGame }>()
);

export const loadGameStartDate = createAction(
	'[Scouting Event - StoreGameReportList] Load Game StartDate',
	props<{ startDate: Date }>()
);

export const addGameReportClicked = createAction(
	'[Scouting Event - StoreGameReportList] Add Game Report Clicked',
	props<AddGameReportActionModel>()
);
export const addGameReportAccepted = createAction(
	'[Scouting Event - StoreGameReportList] Add Game Reports Accepted',
	props<AddGameReportActionModel>()
);
export const addGameReportsSuccess = createAction(
	'[Scouting Event - StoreGameReportList] Add Game Reports Success',
	props<{
		gameReports: ScoutingGameReportWithPlayer[];
		newPlayerScouting: PlayerScouting[];
		playersWithError: PlayerToStartObserveInfo[];
	}>()
);

export const addNewPlayerScoutingSuccess = createAction(
	'[Scouting Event - StoreGameReportList] Add New Player Scouting Success',
	props<{ newPlayerScouting: PlayerScouting[] }>()
);

export const deleteSavedGameReport = createAction(
	'[Scouting Event - StoreGameReportList] Delete Saved Game Report Clicked',
	props<DeleteSavedGameReportActionModel>()
);

export const deleteTempGameReport = createAction(
	'[Scouting Event - StoreGameReportList] Delete Temp Game Report Clicked',
	props<BaseReportActionModel>()
);

export const updatedGameReport = createAction(
	'[Scouting Event - StoreGameReportList] Update Game Report',
	props<UpdateGameReportActionModel>()
);

export const updatedGameReportData = createAction(
	'[Scouting Event - StoreGameReportList] Update Game Report Data',
	props<UpdateGameReportDataActionModel>()
);

export const genericError = createAction(
	'[Scouting Event - StoreGameReportList] Error StoreGameReportList',
	props<{ error: any }>()
);

export const selectedCustomTeam = createAction(
	'[Scouting Event - StoreGameReportList] Select Custom Team',
	props<{ team: SearchResultTeam; side: ScoutingTeamSide }>()
);
export const selectedCustomTeamSuccess = createAction(
	'[Scouting Event - StoreGameReportList] Select Custom Team Success',
	props<{ playersInTeam: ThirdPartyTeamSquad; side: 'home' | 'away' }>()
);

export const resetStoreGameReportList = createAction(
	'[Scouting Event - StoreGameReportList] Reset StoreGameReportList'
);

export const switchCaseAlwaysCreateProfile = createAction(
	'[Scouting Event - StoreGameReportList] Always create profile setting',
	props<{ playerIds: number[] }>()
);

export const shownConfirmPlayerCreationDialog = createAction(
	'[Scouting Event - StoreGameReportList] Confirmation Dialog Opened'
);
export const saveConfirmationDialogClicked = createAction(
	'[Scouting Event - StoreGameReportList] Confirmation Dialog Saved'
);
export const discardConfirmationDialogClicked = createAction(
	'[Scouting Event - StoreGameReportList] Confirmation Dialog Discarded'
);

export const saveReports = createAction(
	'[Scouting Event - StoreGameReportList] Save Reports',
	props<{ game: ScoutingGame }>()
);

export const saveReportsAccepted = createAction(
	'[Scouting Event - StoreGameReportList] Save Reports Accepted',
	props<{ updatedPlayers: PlayerScouting[] }>()
);

export const saveReportsSuccess = createAction(
	'[Scouting Event - StoreGameReportList] Save Reports Success',
	props<{ reports: ScoutingGameReportWithPlayer[] }>()
);

export const deleteReportsSuccess = createAction('[Scouting Event - StoreGameReportList] Delete Reports Success');

export const deleteReportsFailure = createAction(
	'[Scouting Event - StoreGameReportList] Delete Reports Failed',
	props<{ error: any }>()
);

export const saveReportsFailure = createAction(
	'[Scouting Event - StoreGameReportList] Save Reports Failed',
	props<{ error: any }>()
);

export const editPlayersCreationList = createAction(
	'[Scouting Event - StoreGameReportList] Creation list modified',
	props<{ playerId: number; removed: boolean }>()
);
export const editAllPlayersCreationList = createAction(
	'[Scouting Event - StoreGameReportList] All creation list modified',
	props<{ playerIds: number[] }>()
);

export const selectTeamForNonCategorizedPlayer = createAction(
	'[Scouting Event - StoreGameReportList] Team selected for not categorized player',
	props<{ thirdPartyProviderPlayerId: number; teamId: number }>()
);

export const gameReportClickedEditButton = createAction('[Scouting Event - StoreGameReportList] Edit Button Clicked');
export const gameReportClickedDiscardButton = createAction(
	'[Scouting Event - StoreGameReportList] Discard Button Clicked'
);

export const destroyStoreGameReports = createAction(
	'[Scouting Event - StoreGameReportList] Destroy StoreGameReportList'
);
