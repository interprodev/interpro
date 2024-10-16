import { ScoutingTeamSide } from '@iterpro/players/scouting/event/sand-box';
import {
	CompetitionGame,
	InstatTeamJson,
	ScoutingGame,
	ScoutingGameInit,
	SearchResultTeam,
	ThirdPartyGameDetail
} from '@iterpro/shared/data-access/sdk';
import { createAction, props } from '@ngrx/store';

export const loadStoreDetails = createAction(
	'[Scouting Event - StoreDetail] Load StoreDetails',
	props<{ scoutingGame: ScoutingGameInit }>()
);

/*export const loadStoreDetailsSuccess = createAction('[Scouting Event - StoreDetail] Load StoreDetails Success', props<{ gameDetail: ThirdPartyGameDetail; toMigrate: boolean }>());*/
export const loadStoreDetailsFailure = createAction(
	'[Scouting Event - StoreDetail] Load StoreDetails Failure',
	props<{ error: any }>()
);

export const toggledLeftPanelMaximize = createAction('[Scouting Event - StoreDetail] Toggle Left Panel Maximizer');
export const clickedDiscardButton = createAction('[Scouting Event - StoreDetail] Discard Button Clicked');
export const clickedEditButton = createAction('[Scouting Event - StoreDetail] Edit Button Clicked');
export const sendEmailClicked = createAction('[Scouting Event - StoreDetail] Send Email Clicked');
export const sendEmail = createAction('[Scouting Event - StoreDetail] Send Email');
export const sendEmailSuccess = createAction('[Scouting Event - StoreDetail] Email Sent Success');
export const sendEmailFailure = createAction(
	'[Scouting Event - StoreDetail] Email Sent Failure',
	props<{ error: any }>()
);

export const loadCompetitionGames = createAction(
	'[Scouting Event - StoreDetail] Load Competition Games',
	props<{ start: Date }>()
);

export const loadCompetitionGamesSuccess = createAction(
	'[Scouting Event - StoreDetail] Load Competition Games Success',
	props<{ competitionGames: CompetitionGame[] }>()
);

export const loadCompetitionGamesFailure = createAction(
	'[Scouting Event - StoreDetail] Load Competition Games Failure',
	props<{ error?: any, warning?: string }>()
);

export const selectCompetition = createAction(
	'[Scouting Event - StoreDetail] Competition Selected',
	props<{ competitionId: number }>()
);

export const selectedTeamWithoutCompetition = createAction(
	'[Scouting Event - StoreDetail] Selected Team Without Competitions',
	props<{ thirdPartyId: number }>()
);

export const competitionEmptyMatchList = createAction(
	'[Scouting Event - StoreDetail] Competition Empty Match List',
	props<{ competitionId: number }>()
);

export const foundSeasonCompetition = createAction(
	'[Scouting Event - StoreDetail] Third Party Season Competition Id Found',
	props<{ seasonThirdPartyIds: number[] }>()
);

export const genericErrorScoutingEventStores = createAction(
	'[Scouting Event - StoreDetail] Error ScoutingEventStores',
	props<{ error: any }>()
);

export const selectGameFromCompetition = createAction(
	'[Scouting Event - StoreDetail] Select Game From Competition',
	props<{ matchId: number }>()
);

export const selectGameFromCompetitionSuccess = createAction(
	'[Scouting Event - StoreDetail] Select Game From Competition Success',
	props<{ gameDetail: ThirdPartyGameDetail; matchId: number; matchThirdPartyProvider: string }>()
);

export const selectedOtherTeamsCompetition = createAction(
	'[Scouting Event - StoreDetail] Selected Other Teams Competitions',
	props<{ teams: InstatTeamJson[] }>()
);

export const attachmentDialogShowButtonClicked = createAction(
	'[Scouting Event - StoreDetail] Attachment Dialog Button Clicked'
);

export const attachmentDialogSaveButtonClicked = createAction(
	'[Scouting Event - StoreDetail] Save Attachment Dialog Button Clicked',
	props<{ game: ScoutingGame }>()
);

export const attachmentDialogDiscardButtonClicked = createAction(
	'[Scouting Event - StoreDetail] Discard Attachment Dialog Button Clicked'
);

export const updatedGameModel = createAction(
	'[Scouting Event - StoreDetail] Update Game Model',
	props<{ game: Partial<ScoutingGame> }>()
);

export const selectedCustomTeam = createAction(
	'[Scouting Event - StoreDetail] Select Custom Team',
	props<{ team: SearchResultTeam; side: ScoutingTeamSide; crest: string }>()
);

export const saveClicked = createAction('[Scouting Event - StoreDetail] Save Clicked');
export const saveSuccess = createAction('[Scouting Event - StoreDetail] Save Success', props<{ game: ScoutingGame }>());
export const setReportInformation = createAction(
	'[Scouting Event - StoreDetail] Set Report Information',
	props<{ templateId: string; templateVersion: number }>()
);

export const saveFailure = createAction('[Scouting Event - StoreDetail] Save Failed', props<{ error?: any, warning?: string }>());

export const allReportsMarkAsCompleted = createAction(
	'[Scouting Event - StoreDetail] All Reports Marked As Completed',
	props<{ allCompleted: boolean }>()
);
export const setAssignedToGameDetail = createAction(
	'[Scouting Event - StoreDetail] Set Assigned To Game Detail',
	props<{ scoutIds: string[] }>()
);

export const destroyStoreDetail = createAction('[Scouting Event - StoreDetail] Destroy StoreDetail');
