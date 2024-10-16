import { Injectable } from '@angular/core';
import {
	State as DetailState,
	allReportsMarkAsCompleted,
	destroyStoreDetail,
	loadCompetitionGames,
	saveSuccess,
	selectMatchAndHomeAndAwayId,
	selectProviderInfo,
	selectStartDate,
	setAssignedToGameDetail
} from '@iterpro/players/scouting/event/store-detail';
import {
	State as GameReportListState,
	addGameReportClicked,
	destroyStoreGameReports,
	gameReportClickedDiscardButton,
	gameReportClickedEditButton,
	initStoreGameReportLists,
	loadFormation,
	loadGameStartDate,
	loadStoreGameReportLists,
	loadTeamSquads,
	resetStoreGameReportList,
	saveReports,
	selectAssignedToReports,
	selectIfAllReportsCompleted,
	selectPlayersInTeam
} from '@iterpro/players/scouting/event/store-game-report-list';
import {
	State as MatchLineUpState,
	destroyStoreLineUp,
	loadStoreMatchLineUps,
	resetStoreMatchLineUps,
	selectFormation
} from '@iterpro/players/scouting/event/store-line-up';
import {
	State as MatchStatsState,
	destroyStoreMatchStats,
	loadStoreMatchStats,
	resetStoreMatchStats
} from '@iterpro/players/scouting/event/store-match-stats';
import { SandBoxService } from '@iterpro/shared/data-access/sand-box';
import {
	GameReportSourceSection,
	PlayerScouting,
	PlayerToStartObserveInfo,
	ProviderType,
	ScoutingGame, ScoutingGameEssentialCustomer, ScoutingGameEssentialSettings, ScoutingGameInit,
	ThirdPartyClubGame
} from '@iterpro/shared/data-access/sdk';
import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { SandBoxDetailService } from './sand-box-detail.service';
import { AddGameReportActionModel } from './sand-box-game-report.service';


@Injectable({
	providedIn: 'root'
})
export class ScoutingEventSandBoxBridgeService {
	destroyAllStores$: Subject<boolean> = new Subject<boolean>();

	constructor(
		public sb: SandBoxService,
		public sbDetail: SandBoxDetailService,
		private detailStore$: Store<DetailState>,
		private matchStatsStore$: Store<MatchStatsState>,
		private matchLineUpStore$: Store<MatchLineUpState>,
		private gameReportListStore$: Store<GameReportListState>
	) {
		const matchAndHomeAndAwayIdStream$ = this.sb
			.listenToInput(this.detailStore$.select(selectMatchAndHomeAndAwayId))
			.pipe(
				filter<{
					thirdPartyProviderMatchId: number;
					thirdPartyProviderHomeTeamId: number;
					thirdPartyProviderAwayTeamId: number;
					homeTeamName: string;
					awayTeamName: string;
					thirdPartyProvider: ProviderType;
				}>(
					({ thirdPartyProviderMatchId, thirdPartyProviderHomeTeamId, thirdPartyProviderAwayTeamId }) =>
						Boolean(thirdPartyProviderMatchId) &&
						Boolean(thirdPartyProviderHomeTeamId) &&
						Boolean(thirdPartyProviderAwayTeamId)
				) as any
			);

		matchAndHomeAndAwayIdStream$.subscribe({
			next: payload => gameReportListStore$.dispatch(loadTeamSquads(payload as any)),
			error: (error: Error) => this.sb.handleError(error)
		});

		const thirdPartyProviderMatchIdStream = this.sb.listenToInput(this.detailStore$.select(selectProviderInfo)).pipe(
			filter<{
				provider: ProviderType;
				thirdPartyId: number;
			}>(({ provider, thirdPartyId }) => Boolean(provider) && Boolean(thirdPartyId) && thirdPartyId != -1)
		);

		thirdPartyProviderMatchIdStream.subscribe({
			next: result =>
				matchStatsStore$.dispatch(
					loadStoreMatchStats({
						thirdPartyProviderMatchId: result.thirdPartyId,
						thirdPartyProviderMatch: result.provider
					})
				),
			error: (error: Error) => this.sb.handleError(error)
		});

		thirdPartyProviderMatchIdStream.subscribe({
			next: result =>
				matchLineUpStore$.dispatch(
					loadStoreMatchLineUps({
						thirdPartyProviderMatchId: result.thirdPartyId,
						thirdPartyProviderMatch: result.provider
					})
				),
			error: (error: Error) => this.sb.handleError(error)
		});

		const gameStream$ = this.sb.listenToInput<ScoutingGameInit>(this.sbDetail.game$).pipe(
			filter<ScoutingGameInit>(
				({ settings, existingScoutingPlayers, game, customer, customers, playersToPredisposeReports, sourceSection }) =>
					Boolean(settings) &&
					Boolean(existingScoutingPlayers) &&
					Boolean(game) &&
					Boolean(customer) &&
					Boolean(customers) &&
					Boolean(playersToPredisposeReports) &&
					Boolean(sourceSection)
			)
		);
		gameStream$.subscribe({
			next: ({ settings, existingScoutingPlayers, game, customer, customers, isScoutingAdmin }) =>
				this.gameReportListStore$.dispatch(
					initStoreGameReportLists({
						settings: settings,
						existingScoutingPlayers: existingScoutingPlayers,
						clubId: game.clubId,
						teamId: game.teamId,
						customer,
						customers,
						isScoutingAdmin
					})
				),
			error: (error: Error) => this.sb.handleError(error)
		});

		gameStream$.pipe(filter<{ game: ScoutingGame }>(({ game }) => Boolean(game.id))).subscribe({
			next: ({ game }) => this.gameReportListStore$.dispatch(loadStoreGameReportLists({ gameId: game.id })),
			error: (error: Error) => this.sb.handleError(error)
		});

		const playersInTeam$ = this.gameReportListStore$.select(selectPlayersInTeam);
		combineLatest([gameStream$, matchAndHomeAndAwayIdStream$, playersInTeam$])
			.pipe(
				filter(
					([{ sourceSection, playersToPredisposeReports, game }, match, playersInTeam]) =>
						!game?.id &&
						sourceSection === 'scoutingProfile' &&
						playersToPredisposeReports?.length > 0 &&
						Boolean((match as any).homeTeamName) &&
						Boolean((match as any).awayTeamName) &&
						Boolean(playersInTeam.away) &&
						Boolean(playersInTeam.home)
				)
			)
			.subscribe({
				next: ([{ customer, playersToPredisposeReports }, match, playersInTeam]) => {
					const isHomePlayer = (playersInTeam?.home?.players || []).find(
						player => player.wyId === playersToPredisposeReports[0].thirdPartyId
					)?.currentTeamId;
					const isAwayPlayer = (playersInTeam?.away?.players || []).find(
						player => player.wyId === playersToPredisposeReports[0].thirdPartyId
					)?.currentTeamId;
					if (!isHomePlayer && !isAwayPlayer) {
						return;
					}
					const payload: AddGameReportActionModel = {
						scoutIds: [customer.id],
						players: playersToPredisposeReports,
						teamName: isHomePlayer ? (match as any).homeTeamName : (match as any).awayTeamName,
						side: isHomePlayer ? 'home' : 'away'
					};
					return this.gameReportListStore$.dispatch(addGameReportClicked(payload));
				},
				error: (error: Error) => this.sb.handleError(error)
			});

		gameStream$
			.pipe(
				filter<{ game: ScoutingGame }>(({ game }) => Boolean(game.thirdPartyProviderMatchId) && Boolean(game.start))
			)
			.subscribe({
				next: ({ game }) => this.detailStore$.dispatch(loadCompetitionGames({ start: game.start })),
				error: (error: Error) => this.sb.handleError(error)
			});

		const startDateStream = this.sb
			.listenToInput(this.detailStore$.select(selectStartDate))
			.pipe(filter<{ startDate: Date }>(({ startDate }) => Boolean(startDate)));

		startDateStream.subscribe({
			next: payload => this.gameReportListStore$.dispatch(loadGameStartDate(payload)),
			error: (error: Error) => this.sb.handleError(error)
		});

		const selectCompetitionStream$ = this.sb
			.listenToInput<number>(this.sbDetail.selectCompetition$)
			.pipe(filter<number>(Boolean));

		selectCompetitionStream$.subscribe({
			next: competitionId => this.matchLineUpStore$.dispatch(resetStoreMatchLineUps()),
			error: (error: Error) => this.sb.handleError(error)
		});

		selectCompetitionStream$.subscribe({
			next: competitionId => this.matchLineUpStore$.dispatch(resetStoreMatchStats()),
			error: (error: Error) => this.sb.handleError(error)
		});

		selectCompetitionStream$.subscribe({
			next: competitionId => this.matchLineUpStore$.dispatch(resetStoreGameReportList()),
			error: (error: Error) => this.sb.handleError(error)
		});

		const selectGameFromCompetitionStream$ = this.sb
			.listenToInput<number>(this.sbDetail.selectGameFromCompetition$)
			.pipe(filter<number>(Boolean));

		selectGameFromCompetitionStream$.subscribe({
			next: matchId => this.matchLineUpStore$.dispatch(resetStoreMatchLineUps()),
			error: (error: Error) => this.sb.handleError(error)
		});

		selectGameFromCompetitionStream$.subscribe({
			next: matchId => this.matchLineUpStore$.dispatch(resetStoreMatchStats()),
			error: (error: Error) => this.sb.handleError(error)
		});

		const formationStream = this.sb.listenToInput<ThirdPartyClubGame>(
			this.matchLineUpStore$.select(selectFormation) as Observable<ThirdPartyClubGame>
		);

		formationStream.subscribe({
			next: formation => this.gameReportListStore$.dispatch(loadFormation({ formation })),
			error: (error: Error) => this.sb.handleError(error)
		});

		// this.sb.emitStateChange<ScoutingGameWithDetails>(this.detailStore$.select(selectGameWithDetails), this.saveGameDetail$);

		// this is an example
		// this.sb.listenToAction(loadStoreDetails).subscribe(action => console.info('ngrx action (loadStoreDetails)', action));

		const destroyAllStream = this.sb
			.listenToInput<boolean>(this.sb.listenToInput(this.destroyAllStores$))
			.pipe(filter<boolean>(Boolean));

		destroyAllStream.subscribe({
			next: () => this.detailStore$.dispatch(destroyStoreDetail()),
			error: (error: Error) => this.sb.handleError(error)
		});

		destroyAllStream.subscribe({
			next: () => this.matchLineUpStore$.dispatch(destroyStoreLineUp()),
			error: (error: Error) => this.sb.handleError(error)
		});

		destroyAllStream.subscribe({
			next: () => this.matchStatsStore$.dispatch(destroyStoreMatchStats()),
			error: (error: Error) => this.sb.handleError(error)
		});

		destroyAllStream.subscribe({
			next: () => this.gameReportListStore$.dispatch(destroyStoreGameReports()),
			error: (error: Error) => this.sb.handleError(error)
		});

		this.sb
			.listenToInput<boolean>(this.sbDetail.discardClicked$)
			.pipe(filter<boolean>(Boolean))
			.subscribe({
				next: () => this.gameReportListStore$.dispatch(gameReportClickedDiscardButton()),
				error: (error: Error) => this.sb.handleError(error)
			});

		this.sb
			.listenToInput<boolean>(this.sbDetail.editClicked$)
			.pipe(filter<boolean>(Boolean))
			.subscribe({
				next: () => this.gameReportListStore$.dispatch(gameReportClickedEditButton()),
				error: (error: Error) => this.sb.handleError(error)
			});

		this.sb
			.listenToAction(saveSuccess)
			.subscribe(action => this.gameReportListStore$.dispatch(saveReports({ game: action.game })));

		this.sb.listenToInput<string[]>(this.gameReportListStore$.select(selectAssignedToReports))
			.pipe(distinctUntilChanged())
			.subscribe({
			next: payload => this.detailStore$.dispatch(setAssignedToGameDetail({ scoutIds: payload })),
			error: (error: Error) => this.sb.handleError(error)
		});

		this.sb.listenToInput<boolean>(this.gameReportListStore$.select(selectIfAllReportsCompleted)).subscribe({
			next: payload => this.detailStore$.dispatch(allReportsMarkAsCompleted({ allCompleted: payload })),
			error: (error: Error) => this.sb.handleError(error)
		});
	}
}
