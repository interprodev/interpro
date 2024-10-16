import { EventEmitter, Injectable } from '@angular/core';
import {
	State as GameReportState,
	addGameReportClicked,
	deleteSavedGameReport,
	deleteTempGameReport,
	discardConfirmationDialogClicked,
	editAllPlayersCreationList,
	editPlayersCreationList,
	saveConfirmationDialogClicked,
	saveReportsAccepted,
	selectActiveTemplateSettings,
	selectAwayAvailablePlayers,
	selectAwayScoutsOptions,
	selectConfirmPlayerCreationVisibility,
	selectCurrentScout,
	selectError,
	selectGameReportsAway,
	selectGameReportsHome,
	selectGameReportsPlayersForCreationList,
	selectHomeAvailablePlayers,
	selectHomeScoutsOptions,
	selectIfAllReportsCompleted,
	selectInfo,
	selectIsGameReportNotCategorized,
	selectIsLoading,
	selectIsTeamSquadLoading,
	selectIsTemplatesLoading,
	selectNoReportInGame,
	selectPlayersToSetAsObserved,
	selectReportTemplates,
	selectSuccess,
	selectTeamForNonCategorizedPlayer,
	selectedCustomTeam,
	selectsGameReportsWithPlayersNotCategorized,
	updatedGameReport,
	updatedGameReportData
} from '@iterpro/players/scouting/event/store-game-report-list';
import { SandBoxService } from '@iterpro/shared/data-access/sand-box';
import {
	PlayerScouting,
	PlayerToStartObserveInfo,
	ScoutingGameReportWithPlayer,
	SelectCustomTeamActionModel
} from '@iterpro/shared/data-access/sdk';
import { AlertService } from '@iterpro/shared/utils/common-utils';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})
export class SandBoxGameReportService {
	// Outputs
	playerLensClickedEmitter$: EventEmitter<string> = new EventEmitter<string>();
	newScoutingPlayersEmitter$: EventEmitter<PlayerScouting[]> = new EventEmitter<PlayerScouting[]>();

	updateGameReport: Subject<UpdateGameReportActionModel> = new Subject<UpdateGameReportActionModel>();
	updateGameReportData: Subject<UpdateGameReportDataActionModel> = new Subject<UpdateGameReportDataActionModel>();
	addGameReportClicked: Subject<AddGameReportActionModel> = new Subject<AddGameReportActionModel>();
	selectCustomTeam$: Subject<SelectCustomTeamActionModel> = new Subject<SelectCustomTeamActionModel>();
	deleteSavedGameReport$: Subject<DeleteSavedGameReportActionModel> = new Subject<DeleteSavedGameReportActionModel>();
	deleteTempGameReport$: Subject<BaseReportActionModel> = new Subject<BaseReportActionModel>();
	saveConfirmationDialog$: Subject<boolean> = new Subject<boolean>();
	discardConfirmationDialog$: Subject<boolean> = new Subject<boolean>();
	editPlayersCreationList$: Subject<EditPlayerCreationListAction> = new Subject<EditPlayerCreationListAction>();
	editAllPlayersCreationList$: Subject<EditAllPlayerCreationListAction> =
		new Subject<EditAllPlayerCreationListAction>();
	selectTeamForNonCategorizedPlayer: Subject<SelectTeamForNonCategorizedPlayerAction> =
		new Subject<SelectTeamForNonCategorizedPlayerAction>();
	currentScout$ = this.gameReportListStore$.select(selectCurrentScout);
	gameReportsHome$ = this.gameReportListStore$.select(selectGameReportsHome);
	gameReportsAway$ = this.gameReportListStore$.select(selectGameReportsAway);
	isGameReportNotCategorized = this.gameReportListStore$.select(selectIsGameReportNotCategorized);
	isLoading$ = this.gameReportListStore$.select(selectIsLoading);
	isTeamSquadLoading$ = this.gameReportListStore$.select(selectIsTeamSquadLoading);
	isTemplatesLoading$ = this.gameReportListStore$.select(selectIsTemplatesLoading);
	homeAvailablePlayers$ = this.gameReportListStore$.select(selectHomeAvailablePlayers);
	awayAvailablePlayers$ = this.gameReportListStore$.select(selectAwayAvailablePlayers);
	confirmPlayerCreationVisibility$ = this.gameReportListStore$.select(selectConfirmPlayerCreationVisibility);
	observedPlayersForCreationList$ = this.gameReportListStore$.select(selectGameReportsPlayersForCreationList);
	playersToCreate$ = this.gameReportListStore$.select(selectPlayersToSetAsObserved);
	gameReportsWithPlayersNotCategorized$ = this.gameReportListStore$.select(selectsGameReportsWithPlayersNotCategorized);
	noReportsInGame = this.gameReportListStore$.select(selectNoReportInGame);
	allReportsCompleted$ = this.gameReportListStore$.select(selectIfAllReportsCompleted);
	templateSettings$ = this.gameReportListStore$.select(selectActiveTemplateSettings);
	error$ = this.gameReportListStore$.select(selectError);
	success$ = this.gameReportListStore$.select(selectSuccess);
	info$ = this.gameReportListStore$.select(selectInfo);
	reportTemplates$ = this.gameReportListStore$.select(selectReportTemplates);
	homeScoutOptions$ = this.gameReportListStore$.select(selectHomeScoutsOptions);
	awayScoutOptions$ = this.gameReportListStore$.select(selectAwayScoutsOptions);

	constructor(
		private sb: SandBoxService,
		private alertService: AlertService,
		private gameReportListStore$: Store<GameReportState>
	) {
		this.notifyErrors();
		this.notifySuccess();
		this.notifyInfo();

		this.sb
			.listenToInput<AddGameReportActionModel>(this.addGameReportClicked)
			.pipe(filter<AddGameReportActionModel>(Boolean))
			.subscribe({
				next: payload => this.gameReportListStore$.dispatch(addGameReportClicked(payload)),
				error: (error: Error) => this.sb.handleError(error)
			});

		this.sb
			.listenToInput<SelectCustomTeamActionModel>(this.selectCustomTeam$)
			.pipe(filter<SelectCustomTeamActionModel>(Boolean))
			.subscribe({
				next: payload => this.gameReportListStore$.dispatch(selectedCustomTeam(payload)),
				error: (error: Error) => this.sb.handleError(error)
			});

		this.sb
			.listenToInput<UpdateGameReportActionModel>(this.updateGameReport)
			.pipe(filter<UpdateGameReportActionModel>(Boolean))
			.subscribe({
				next: payload => this.gameReportListStore$.dispatch(updatedGameReport(payload)),
				error: (error: Error) => this.sb.handleError(error)
			});

		this.sb
			.listenToInput<UpdateGameReportDataActionModel>(this.updateGameReportData)
			.pipe(filter<UpdateGameReportDataActionModel>(Boolean))
			.subscribe({
				next: payload => this.gameReportListStore$.dispatch(updatedGameReportData(payload)),
				error: (error: Error) => this.sb.handleError(error)
			});

		this.sb
			.listenToInput<DeleteSavedGameReportActionModel>(this.deleteSavedGameReport$)
			.pipe(filter<DeleteSavedGameReportActionModel>(Boolean))
			.subscribe({
				next: payload => this.gameReportListStore$.dispatch(deleteSavedGameReport(payload)),
				error: (error: Error) => this.sb.handleError(error)
			});

		this.sb
			.listenToInput<BaseReportActionModel>(this.deleteTempGameReport$)
			.pipe(filter<BaseReportActionModel>(Boolean))
			.subscribe({
				next: payload => this.gameReportListStore$.dispatch(deleteTempGameReport(payload)),
				error: (error: Error) => this.sb.handleError(error)
			});

		this.sb.listenToInput<boolean>(this.saveConfirmationDialog$).subscribe({
			next: () => this.gameReportListStore$.dispatch(saveConfirmationDialogClicked()),
			error: (error: Error) => this.sb.handleError(error)
		});

		this.sb.listenToInput<boolean>(this.discardConfirmationDialog$).subscribe({
			next: () => this.gameReportListStore$.dispatch(discardConfirmationDialogClicked())
		});

		this.sb.listenToInput<EditPlayerCreationListAction>(this.editPlayersCreationList$).subscribe({
			next: payload =>
				this.gameReportListStore$.dispatch(
					editPlayersCreationList({ playerId: payload.playerId, removed: payload.removed })
				),
			error: (error: Error) => this.sb.handleError(error)
		});

		this.sb.listenToInput<EditAllPlayerCreationListAction>(this.editAllPlayersCreationList$).subscribe({
			next: payload => this.gameReportListStore$.dispatch(editAllPlayersCreationList({ playerIds: payload.playerIds })),
			error: (error: Error) => this.sb.handleError(error)
		});

		this.sb.listenToInput<SelectTeamForNonCategorizedPlayerAction>(this.selectTeamForNonCategorizedPlayer).subscribe({
			next: payload => this.gameReportListStore$.dispatch(selectTeamForNonCategorizedPlayer(payload)),
			error: (error: Error) => this.sb.handleError(error)
		});

		this.sb
			.listenToAction(saveReportsAccepted)
			.subscribe(action => this.newScoutingPlayersEmitter$.emit(action.updatedPlayers));
	}

	private notifyErrors() {
		this.error$
			.pipe(filter<any>(Boolean))
			.subscribe({ next: error => this.alertService.notify('error', 'error', error?.message, false) });
	}

	private notifySuccess() {
		this.success$.pipe(filter<any>(Boolean)).subscribe({
			next: successMessage => this.alertService.notify('success', 'Scouting Reports', successMessage, false)
		});
	}

	private notifyInfo() {
		this.info$.pipe(filter<any>(Boolean)).subscribe({
			next: infoMessage => this.alertService.notify('info', 'Scouting Reports', infoMessage, false)
		});
	}
}
export type ScoutingTeamSide = 'home' | 'away';

export interface AddGameReportActionModel {
	scoutIds: string[];
	players: PlayerToStartObserveInfo[];
	teamName: string;
	side: ScoutingTeamSide;
	alreadyAssignedPlayersFound?: boolean;
}

export interface BaseReportActionModel {
	teamId: number;
	index: number;
}

export interface DeleteSavedGameReportActionModel extends BaseReportActionModel {
	reportId: string;
}
export interface UpdateGameReportActionModel extends BaseReportActionModel {
	payload: Partial<ScoutingGameReportWithPlayer>;
	reportId?: string;
	authorId: string;
}

export interface UpdateGameReportDataActionModel extends UpdateGameReportActionModel {
	sectionId: string;
}

interface EditPlayerCreationListAction {
	playerId: number;
	removed: boolean;
}

interface EditAllPlayerCreationListAction {
	playerIds: number[];
}

interface SelectTeamForNonCategorizedPlayerAction {
	thirdPartyProviderPlayerId: number;
	teamId: number;
}
