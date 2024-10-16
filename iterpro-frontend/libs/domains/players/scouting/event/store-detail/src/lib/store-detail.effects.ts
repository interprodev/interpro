import { Injectable } from '@angular/core';
import {
	CompetitionGame,
	InstatTeamJson,
	LoopBackAuth,
	PlayerReportHistory,
	ProviderType,
	ScoutingGame,
	ThirdPartyGameDetail
} from '@iterpro/shared/data-access/sdk';
import { ProviderTypeService, ScoutingEventService, getId, isValidDate } from '@iterpro/shared/utils/common-utils';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { ConfirmationService } from 'primeng/api';
import { forkJoin, of } from 'rxjs';
import { catchError, defaultIfEmpty, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import * as StoreDetailActions from './store-detail.actions';
import { State as DetailState } from './store-detail.reducer';
import { selectGame, selectHasMissingFields, selectRemovedAttachmentURLs } from './store-detail.selectors';

@Injectable()
export class StoreDetailEffects {
	constructor(
		private actions$: Actions,
		private auth: LoopBackAuth,
		private translate: TranslateService,
		private service: ScoutingEventService,
		private detailStore$: Store<DetailState>,
		private confirmationService: ConfirmationService,
		private providerTypeService: ProviderTypeService
	) {}

	loadCompetitionGames$ = createEffect(() =>
		this.actions$.pipe(
			ofType(StoreDetailActions.loadCompetitionGames),
			withLatestFrom(this.detailStore$.select(selectGame)),
			filter(([, game]) => game.thirdPartyProviderCompetitionId > 0),
			switchMap(([{ start }, game]) =>
				!isValidDate(start)
					? of(StoreDetailActions.loadCompetitionGamesFailure({ warning: 'Date is not valid' }))
					: this.service
							.getSeasonsForCompetitions(
								this.auth.getCurrentUserData().currentTeamId,
								game.thirdPartyProviderCompetitionId,
								game.thirdPartyProvider as ProviderType,
								game.start
							)
							.pipe(
								map(([{ seasons }]) =>
									seasons.filter(({ startDate, endDate }) =>
										moment(start).isBetween(
											moment(startDate, 'YYYY-MM-DD'),
											moment(endDate, 'YYYY-MM-DD'),
											'days',
											'[]'
										)
									)
								),
								switchMap((seasons: any[]) =>
									this.service.getMatchesForSeason(
										game.thirdPartyProviderCompetitionId,
										seasons.map(({ wyId, id }) => wyId || id),
										game.thirdPartyProvider as ProviderType,
										start
									)
								),
								map((competitionGames: CompetitionGame[]) =>
									StoreDetailActions.loadCompetitionGamesSuccess({ competitionGames })
								),
								catchError(error => of(StoreDetailActions.loadCompetitionGamesFailure({ error })))
							)
			)
		)
	);

	onSelectCompetition$ = createEffect(() =>
		this.actions$.pipe(
			ofType(StoreDetailActions.selectCompetition, StoreDetailActions.competitionEmptyMatchList),
			filter(({ competitionId }) => !isNaN(competitionId) && competitionId > 0),
			withLatestFrom(this.detailStore$.select(selectGame)),
			switchMap(([{ competitionId }, game]) =>
				this.service
					.getSeasonsForCompetitions(
						this.auth.getCurrentUserData().currentTeamId,
						competitionId,
						game.thirdPartyProvider as ProviderType,
						game.start
					)
					.pipe(
						map(([{ seasons, passepartout }]) => {
							const activeSeasons = seasons.filter(({ startDate, endDate }) =>
								moment(game.start).isBetween(moment(startDate), moment(endDate), 'days', '[]')
							);
							return passepartout || activeSeasons.length > 0
								? StoreDetailActions.foundSeasonCompetition({
										seasonThirdPartyIds: activeSeasons.map(({ wyId, id }) => wyId || id)
									})
								: StoreDetailActions.genericErrorScoutingEventStores({
										error:
											'No seasons have been found for this competition at the selected date. Use "Custom Game" instead or change the date of the event'
									});
						})
					)
			)
		)
	);

	onSelectedTeamWithoutCompetition$ = createEffect(() =>
		this.actions$.pipe(
			ofType(StoreDetailActions.selectedTeamWithoutCompetition),
			withLatestFrom(this.detailStore$.select(selectGame)),
			switchMap(([{ thirdPartyId }, game]) => this.service.getMatchesForTeam(thirdPartyId, game.start)),
			map((competitionGames: CompetitionGame[]) =>
				StoreDetailActions.loadCompetitionGamesSuccess({
					competitionGames
				})
			),
			catchError(error => of(StoreDetailActions.loadCompetitionGamesFailure({ error })))
		)
	);

	onSelectOtherTeamsCompetition$ = createEffect(() =>
		this.actions$.pipe(
			ofType(StoreDetailActions.selectCompetition, StoreDetailActions.competitionEmptyMatchList),
			filter(({ competitionId }) => Array.isArray(competitionId)),
			map(({ competitionId }) => {
				const teams = competitionId as unknown as InstatTeamJson[];
				return StoreDetailActions.selectedOtherTeamsCompetition({
					teams
				});
			})
		)
	);

	onSeasonCompetitionFound$ = createEffect(() =>
		this.actions$.pipe(
			ofType(StoreDetailActions.foundSeasonCompetition),
			withLatestFrom(this.detailStore$.select(selectGame)),
			switchMap(([{ seasonThirdPartyIds }, game]) =>
				this.service.getMatchesForSeason(
					game.thirdPartyProviderCompetitionId,
					seasonThirdPartyIds,
					game.thirdPartyProvider as ProviderType,
					game.start
				)
			),
			map((competitionGames: CompetitionGame[]) =>
				StoreDetailActions.loadCompetitionGamesSuccess({ competitionGames })
			),
			catchError(error => of(StoreDetailActions.loadCompetitionGamesFailure({ error })))
		)
	);

	onSelectGameFromCompetition$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(StoreDetailActions.selectGameFromCompetition),
			filter(({ matchId }) => matchId > 0),
			switchMap(({ matchId }) =>
				this.service.getThirdPartyGameDetail(matchId).pipe(
					map((gameDetail: ThirdPartyGameDetail) =>
						StoreDetailActions.selectGameFromCompetitionSuccess({
							gameDetail,
							matchId,
							matchThirdPartyProvider: this.providerTypeService.getProviderTypeUsed(gameDetail)
						})
					),
					catchError(error => of(StoreDetailActions.genericErrorScoutingEventStores({ error })))
				)
			)
		);
	});

	onSendEmailClicked$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(StoreDetailActions.sendEmailClicked),
				withLatestFrom(this.detailStore$.select(selectGame)),
				map(([, game]) => {
					if (!game.sent) {
						this.detailStore$.dispatch(StoreDetailActions.sendEmail());
					} else {
						this.confirmationService.confirm({
							message: this.translate.instant('scouting.event.sendAnotherEmail'),
							header: this.translate.instant('confirm.title'),
							icon: 'fa fa-question-circle',
							accept: () => void this.detailStore$.dispatch(StoreDetailActions.sendEmail())
						});
					}
				})
			),
		{ dispatch: false }
	);

	onSendEmail$ = createEffect(() =>
		this.actions$.pipe(
			ofType(StoreDetailActions.sendEmail),
			withLatestFrom(this.detailStore$.select(selectGame)),
			switchMap(([, game]) =>
				this.service.upsert(game).pipe(
					switchMap(updatedGame => this.service.sendEmail(getId(updatedGame) as string, updatedGame.assignedTo)),
					map(() => StoreDetailActions.sendEmailSuccess()),
					catchError(error => of(StoreDetailActions.sendEmailFailure({ error })))
				)
			)
		)
	);

	onClickSave$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(StoreDetailActions.saveClicked),
			withLatestFrom(
				this.detailStore$.select(selectHasMissingFields),
				this.detailStore$.select(selectGame),
				this.detailStore$.select(selectRemovedAttachmentURLs)
			),
			switchMap(([, hasMissingFields, game, attachments]) =>
				hasMissingFields
					? of(StoreDetailActions.saveFailure({ warning: 'alert.missingFields' }))
					: forkJoin([attachments.map(url => this.service.deleteAttachment(game.clubId, url))]).pipe(
							defaultIfEmpty(null),
							switchMap(() => this.service.upsert(this.updateScoutingGameHistory(game))),
							map(updatedGame => StoreDetailActions.saveSuccess({ game: updatedGame })),
							catchError(error => of(StoreDetailActions.saveFailure({ error })))
						)
			)
		);
	});

	updateScoutingGameHistory(game: ScoutingGame): ScoutingGame {
		const history: PlayerReportHistory[] = [
			...(game.history || []),
			{
				updatedAt: moment().toDate(),
				author: this.auth.getCurrentUserId()
			}
		];
		const title = game.title.length > 0 ? game.title : `${game.homeTeam} - ${game.awayTeam}`;

		return {
			...game,
			timezone: game?.timezone ? game.timezone : moment(game.start, 'MMMM DD, YYYY at hh:mm:ss A Z').format('ZZ'),
			title,
			history
		};
	}
}
