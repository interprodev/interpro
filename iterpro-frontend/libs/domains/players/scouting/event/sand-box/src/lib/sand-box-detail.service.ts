import { EventEmitter, Injectable } from '@angular/core';
import {
	State as DetailState,
	attachmentDialogDiscardButtonClicked,
	attachmentDialogSaveButtonClicked,
	attachmentDialogShowButtonClicked,
	clickedDiscardButton,
	clickedEditButton,
	loadCompetitionGames,
	loadStoreDetails,
	saveClicked,
	saveSuccess,
	selectAttachmentDialogVisibility,
	selectAwayTeamCrest,
	selectCanUserEditDetailPanel,
	selectCompetition,
	selectCompetitionId,
	selectCustomersOptions,
	selectError,
	selectGame,
	selectGameDuration,
	selectGameFromCompetition,
	selectGameName,
	selectGamesInCompetition,
	selectGoals,
	selectHasMissingFields,
	selectHomeTeamCrest,
	selectIsCustomTeamEditable,
	selectIsDeletableByAdmin,
	selectIsFutureEvent,
	selectIsLeftPanelMaximized,
	selectIsLoading,
	selectIsOnEdit,
	selectIsScoutingAdmin,
	selectLastAuthor,
	selectProvider,
	selectSuccess,
	selectThirdPartyMatchId,
	selectedCustomTeam,
	sendEmailClicked,
	toggledLeftPanelMaximize,
	updatedGameModel, selectCurrentTeamGender
} from '@iterpro/players/scouting/event/store-detail';
import { SandBoxService } from '@iterpro/shared/data-access/sand-box';
import { ScoutingGame, ScoutingGameInit, SelectCustomTeamActionModel } from '@iterpro/shared/data-access/sdk';
import { AlertService } from '@iterpro/shared/utils/common-utils';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})
export class SandBoxDetailService {
	// output
	saveEmitter$: EventEmitter<ScoutingGame> = new EventEmitter<ScoutingGame>();
	deleteEmitter$: EventEmitter<boolean> = new EventEmitter<boolean>();
	closeEmitter$: EventEmitter<boolean> = new EventEmitter<boolean>();
	// input
	game$ = new Subject<ScoutingGameInit>();
	toggleLeftPanelMaximize$ = new Subject<boolean>();
	discardClicked$ = new Subject<boolean>();
	editClicked$ = new Subject<boolean>();
	changeGameStartDate$ = new Subject<Date>();
	selectCompetition$ = new Subject<number>();
	selectGameFromCompetition$ = new Subject<number>();
	sendEmailClicked$ = new Subject<boolean>();
	attachmentDialogShowButtonClicked = new Subject<boolean>();
	attachmentDialogDiscardButtonClicked = new Subject<boolean>();
	attachmentDialogSaveButtonClicked = new Subject<ScoutingGame>();
	gameModelUpdated = new Subject<Partial<ScoutingGame>>();
	selectCustomTeam$: Subject<SelectCustomTeamActionModel> = new Subject<SelectCustomTeamActionModel>();
	saveClicked$: Subject<boolean> = new Subject<boolean>();
	// to use in components
	error$ = this.detailStore$.select(selectError);
	success$ = this.detailStore$.select(selectSuccess);
	isGameDataLoading$ = this.detailStore$.select(selectIsLoading);
	matchProvider$ = this.detailStore$.select(selectProvider);
	gameData$ = this.detailStore$.select(selectGame);
	homeTeamCrest$ = this.detailStore$.select(selectHomeTeamCrest);
	awayTeamCrest$ = this.detailStore$.select(selectAwayTeamCrest);
	thirdPartyId = this.detailStore$.select(selectThirdPartyMatchId);
	gameName$ = this.detailStore$.select(selectGameName);
	gameDuration$ = this.detailStore$.select(selectGameDuration);
	lastAuthor$ = this.detailStore$.select(selectLastAuthor);
	goals$ = this.detailStore$.select(selectGoals);
	leftPanelMaximize$ = this.detailStore$.select(selectIsLeftPanelMaximized);
	gameCompetitionIds$ = this.detailStore$.select(selectCompetitionId);
	gamesInCompetition$ = this.detailStore$.select(selectGamesInCompetition);
	isScoutingAdmin$ = this.detailStore$.select(selectIsScoutingAdmin);
	isCustomTeamEditable$ = this.detailStore$.select(selectIsCustomTeamEditable);
	customersOptions$ = this.detailStore$.select(selectCustomersOptions);
	attachmentDialogVisibility$ = this.detailStore$.select(selectAttachmentDialogVisibility);
	isOnEdit$ = this.detailStore$.select(selectIsOnEdit);
	isDeletableByAdmin$ = this.detailStore$.select(selectIsDeletableByAdmin);
	hasMissingFields$ = this.detailStore$.select(selectHasMissingFields);
	isFuture$ = this.detailStore$.select(selectIsFutureEvent);
	canUserEditDetailPanel$ = this.detailStore$.select(selectCanUserEditDetailPanel);
	currentTeamGender$ = this.detailStore$.select(selectCurrentTeamGender);
	constructor(public sb: SandBoxService, private alertService: AlertService, public detailStore$: Store<DetailState>) {
		this.notifyErrors();
		this.notifySuccess();
		this.notifyWarnings();
		/* // link a selector to an emitter
    this.sb.emitStateChange<ScoutingGame>(this.detailStore$.select(selectGame), this.save$);*/

		this.sb.listenToAction(saveSuccess).subscribe(action => this.saveEmitter$.emit(action.game));

		this.sb
			.listenToInput<ScoutingGameInit>(this.game$)
			.pipe(filter<ScoutingGameInit>(Boolean))
			.subscribe({
				next: scoutingGame => this.detailStore$.dispatch(loadStoreDetails({ scoutingGame })),
				error: (error: Error) => this.sb.handleError(error)
			});

		this.sb
			.listenToInput<boolean>(this.toggleLeftPanelMaximize$)
			.pipe(filter<boolean>(Boolean))
			.subscribe({
				next: () => this.detailStore$.dispatch(toggledLeftPanelMaximize()),
				error: (error: Error) => this.sb.handleError(error)
			});

		this.sb
			.listenToInput<Date>(this.changeGameStartDate$)
			.subscribe({
				next: date => this.detailStore$.dispatch(loadCompetitionGames({ start: date })),
				error: (error: Error) => this.sb.handleError(error)
			});

		this.sb
			.listenToInput<number>(this.selectCompetition$)
			.pipe(filter<number>(Boolean))
			.subscribe({
				next: competitionId => this.detailStore$.dispatch(selectCompetition({ competitionId: competitionId })),
				error: (error: Error) => this.sb.handleError(error)
			});

		this.sb
			.listenToInput<number>(this.selectGameFromCompetition$)
			.pipe(filter<number>(Boolean))
			.subscribe({
				next: matchId => this.detailStore$.dispatch(selectGameFromCompetition({ matchId: matchId })),
				error: (error: Error) => this.sb.handleError(error)
			});

		this.sb
			.listenToInput<boolean>(this.discardClicked$)
			.pipe(filter<boolean>(Boolean))
			.subscribe({
				next: () => this.detailStore$.dispatch(clickedDiscardButton()),
				error: (error: Error) => this.sb.handleError(error)
			});

		this.sb
			.listenToInput<boolean>(this.editClicked$)
			.pipe(filter<boolean>(Boolean))
			.subscribe({
				next: () => this.detailStore$.dispatch(clickedEditButton()),
				error: (error: Error) => this.sb.handleError(error)
			});

		this.sb
			.listenToInput<boolean>(this.sendEmailClicked$)
			.pipe(filter<boolean>(Boolean))
			.subscribe({
				next: () => this.detailStore$.dispatch(sendEmailClicked()),
				error: (error: Error) => this.sb.handleError(error)
			});

		this.sb
			.listenToInput<boolean>(this.attachmentDialogShowButtonClicked)
			.pipe(filter<boolean>(Boolean))
			.subscribe({
				next: () => this.detailStore$.dispatch(attachmentDialogShowButtonClicked()),
				error: (error: Error) => this.sb.handleError(error)
			});

		this.sb
			.listenToInput<boolean>(this.attachmentDialogDiscardButtonClicked)
			.pipe(filter<boolean>(Boolean))
			.subscribe({
				next: () => this.detailStore$.dispatch(attachmentDialogDiscardButtonClicked()),
				error: (error: Error) => this.sb.handleError(error)
			});

		this.sb
			.listenToInput<ScoutingGame>(this.attachmentDialogSaveButtonClicked) // TODO EFFECT MISSING, depends on players
			.pipe(filter<ScoutingGame>(Boolean))
			.subscribe({
				next: game => this.detailStore$.dispatch(attachmentDialogSaveButtonClicked({ game })),
				error: (error: Error) => this.sb.handleError(error)
			});

		this.sb
			.listenToInput<Partial<ScoutingGame>>(this.gameModelUpdated)
			.pipe(filter<Partial<ScoutingGame>>(Boolean))
			.subscribe({
				next: game => this.detailStore$.dispatch(updatedGameModel({ game })),
				error: (error: Error) => this.sb.handleError(error)
			});

		this.sb
			.listenToInput<SelectCustomTeamActionModel>(this.selectCustomTeam$)
			.pipe(filter<SelectCustomTeamActionModel>(Boolean))
			.subscribe({
				next: payload => this.detailStore$.dispatch(selectedCustomTeam(payload)),
				error: (error: Error) => this.sb.handleError(error)
			});

		this.sb
			.listenToInput<boolean>(this.saveClicked$)
			.pipe(filter<boolean>(Boolean))
			.subscribe({
				next: payload => this.detailStore$.dispatch(saveClicked()),
				error: (error: Error) => this.sb.handleError(error)
			});
	}

	private notifySuccess() {
		this.success$.pipe(filter<any>(Boolean)).subscribe({
			next: successMessage => this.alertService.notify('success', 'Scouting Game', successMessage, false)
		});
	}

	private notifyErrors() {
		this.error$
			.pipe(filter<any>(Boolean))
			.subscribe({ next: error => this.alertService.notify('error', 'error', error?.message, false) });
	}

	private notifyWarnings() {
		this.error$
			.pipe(filter<any>(Boolean))
			.subscribe({ next: warn => this.alertService.notify('warn', 'warning', warn, false) });
	}
}
