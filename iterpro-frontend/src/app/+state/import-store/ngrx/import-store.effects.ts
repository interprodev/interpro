import { Injectable } from '@angular/core';
import { AuthSelectors } from '@iterpro/shared/data-access/auth';
import { EventApi, Match, MatchApi, Player, TeamApi } from '@iterpro/shared/data-access/sdk';
import { getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Update } from '@ngrx/entity';
import { Action, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { RootStoreState } from '../../root-store.state';
import {
	ConfigurationProblem,
	PlayerStatsDetail,
	SessionMessage,
	SessionPlayerDetail,
	TeamStatsDetail,
	UploadableSession,
	UploadedSessionResult
} from '../interfaces/import-store.interfaces';
import { ImportStoreService } from '../services/import-store.service';
import * as ImportStoreActions from './import-store.actions';
import { ImportStore } from './import-store.model';
import * as ImportStoreSelectors from './import-store.selectors';

// TODO: refactor to minimize complexity

const gpsProviderIds = ['gpexeId', 'statsportId', 'catapultId', 'sonraId', 'fieldwizId', 'wimuId'];

@Injectable()
export class ImportStoreEffects {
	constructor(
		private actions$: Actions,
		private store$: Store<RootStoreState>,
		private importStoreService: ImportStoreService,
		private teamApi: TeamApi,
		private eventApi: EventApi,
		private matchApi: MatchApi,
		private translate: TranslateService
	) {}

	initProviderEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(ImportStoreActions.initProvider),
			withLatestFrom(this.store$.select(AuthSelectors.selectTeam)),
			switchMap(([{ provider }, team]) =>
				this.teamApi.findById(team.id, { include: ['players'] }).pipe(
					map(({ players }: { players: Player[] }) => {
						const messages: SessionMessage[] = [];
						let configurationProblem: ConfigurationProblem = ConfigurationProblem.NO;
						const synced =
							provider === 'gps' || provider === 'teamStats' || provider === 'playersStats'
								? true
								: !!players.find(player => gpsProviderIds.some(id => player[id]));

						if (!synced) {
							messages.push({
								severity: 'warn',
								summary: this.translate.instant('warning'),
								detail: this.translate.instant('alert.noGpsFound')
							});
							configurationProblem += ConfigurationProblem.GPS;
						}

						const teamSeasons = team.teamSeasons;
						const insideSeason = teamSeasons
							? teamSeasons.some(season =>
									moment().isBetween(moment(season.offseason), moment(season.inseasonEnd), 'day', '[]')
							  )
							: false;
						if (!insideSeason) {
							messages.push({
								severity: 'warn',
								summary: this.translate.instant('warning'),
								detail: this.translate.instant('alert.noSeasonsFound')
							});
							configurationProblem += ConfigurationProblem.SEASON;
						}
						return ImportStoreActions.teamConfigurationChecked({ configurationProblem, messages });
					})
				)
			)
		)
	);

	loadDrillsEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(ImportStoreActions.initializeTable),
			withLatestFrom(this.store$.select(AuthSelectors.selectCurrentTeamId)),
			switchMap(([action, currentTeamId]) =>
				this.teamApi
					.getDrills(currentTeamId, {
						order: 'name ASC'
					})
					.pipe(
						map(drills => ImportStoreActions.loadAvailableDrills({ drills })),
						catchError(error => of(ImportStoreActions.loadAvailableDrillsError({ error })))
					)
			)
		)
	);

	errorEffect$: Observable<void> = createEffect(
		() =>
			this.actions$.pipe(
				ofType(ImportStoreActions.loadAvailableDrillsError, ImportStoreActions.importSessionError),
				// eslint-disable-next-line no-console
				map(({ error }) => console.error(error))
			),
		{ dispatch: false, resubscribeOnError: false }
	);

	noImportedSessionFound$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(ImportStoreActions.noImportedSessionFound),
			map(() =>
				ImportStoreActions.updateMessages({
					messages: [
						{
							severity: 'warn',
							summary: this.translate.instant('warning'),
							detail: this.translate.instant('alert.noGPSImportSessionsFound')
						}
					]
				})
			)
		)
	);

	startSessionImportEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(ImportStoreActions.startSessionImport),
			withLatestFrom(
				this.store$.select(ImportStoreSelectors.selectAvailableSplitAssociations),
				this.store$.select(ImportStoreSelectors.selectAllImportedSessionSets),
				this.store$.select(ImportStoreSelectors.selectProvider)
			),
			map(([action, splitAssociations, importedSessions, provider]) => {
				const importStores: Array<Update<ImportStore>> = [];
				let sessionPlayers: SessionPlayerDetail[];
				importedSessions.forEach(importedSession => {
					sessionPlayers = [];
					importedSession.sessionPlayers.forEach(sessionPlayer => {
						const splitName = sessionPlayer.sessionPlayerObj.splitName;
						const association = splitAssociations.find(split => split.splitName === splitName);
						const newSessionPlayer = {
							...sessionPlayer
						};
						if (association) {
							newSessionPlayer.sessionPlayerObj = {
								...sessionPlayer.sessionPlayerObj,
								drillId: association.newDrill ? undefined : association.drillId,
								drillToConvert: association.toConvert,
								mainSession: association.mainSession
							};
						}
						sessionPlayers.push(newSessionPlayer);
					});
					if (sessionPlayers.length > 0) {
						importStores.push({
							id: importedSession.id,
							changes: { sessionPlayers }
						});
					}
				});

				return provider === 'gps'
					? ImportStoreActions.importGpsSession({ importStores: importStores })
					: ImportStoreActions.importProviderSession({ importStores: importStores });
			})
		)
	);

	importGpsSessionEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(ImportStoreActions.importGpsSession),
			withLatestFrom(
				this.store$.select(ImportStoreSelectors.selectAllImportedSessionSets),
				this.store$.select(AuthSelectors.selectCustomer),
				this.store$.select(AuthSelectors.selectCurrentTeamId)
			),
			switchMap(([action, importedSessionSets, customer, currentTeamId]) => {
				const uploadableSession: UploadableSession[] =
					this.importStoreService.buildSessionImportFromCsv(importedSessionSets);
				const { firstName, lastName } = customer;
				const loggedUsername = `${firstName} ${lastName}`;

				return this.eventApi.importGPSEvent(uploadableSession, currentTeamId, loggedUsername, customer.id).pipe(
					map((results: UploadedSessionResult) => {
						const messages: SessionMessage[] = results.confirmMessage.map((detail, index) => ({
							severity: 'success',
							summary: '',
							detail: `Session ${moment(results.sessEvents[index].start).format(
								`${getMomentFormatFromStorage()} HH:mm`
							)} imported correctly. ${detail}`,
							link: results.sessEvents[index],
							type: 'gps'
						}));

						return ImportStoreActions.endSessionImport({ messages });
					}),
					catchError(error => of(ImportStoreActions.importSessionError({ error })))
				);
			})
		)
	);

	importProviderSessionEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(ImportStoreActions.importProviderSession),
			withLatestFrom(
				this.store$.select(ImportStoreSelectors.selectAllImportedSessionSets),
				this.store$.select(ImportStoreSelectors.selectCurrentTeamSplitSession),
				this.store$.select(ImportStoreSelectors.selectCurrentTeamGameSplitSession),
				this.store$.select(AuthSelectors.selectCustomer),
				this.store$.select(AuthSelectors.selectCurrentTeamId)
			),
			switchMap(
				([
					action,
					importedSessionSets,
					currentTeamSplitSession,
					currentTeamGameSplitSession,
					customer,
					currentTeamId
				]) => {
					const uploadableSession: UploadableSession[] = this.importStoreService.buildSessionImportFromProvider(
						importedSessionSets,
						currentTeamSplitSession,
						currentTeamGameSplitSession
					);
					// TODO: remove duplication of code
					const { firstName, lastName } = customer;
					const loggedUsername = `${firstName} ${lastName}`;
					return this.eventApi.importGPSEvent(uploadableSession, currentTeamId, loggedUsername, customer.id).pipe(
						map((results: UploadedSessionResult) => {
							const messages: SessionMessage[] = [];

							results.errors.forEach(warn => {
								if (warn) {
									messages.push({
										severity: 'warn',
										summary: this.translate.instant('warning'),
										detail: warn
									});
								}
							});
							results.confirmMessage.forEach((detail, index) => {
								if (detail) {
									messages.push({
										severity: 'success',
										summary: '',
										detail,
										link: results.sessEvents[index],
										type: 'gps'
									});
								}
							});

							return ImportStoreActions.endSessionImport({ messages });
						}),
						catchError(error => of(ImportStoreActions.importSessionError({ error })))
					);
				}
			)
		)
	);

	startStatsImportEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(ImportStoreActions.startStatsImport),
			withLatestFrom(this.store$.select(ImportStoreSelectors.selectAllImportedSessionSets)),
			map(([{ provider }, importedSessions]) => {
				const importStores: Array<Update<ImportStore>> = [];
				let teamStats: TeamStatsDetail;
				let playersStats: PlayerStatsDetail[];
				importedSessions.forEach(importedSession => {
					if (provider === 'playersStats') {
						playersStats = [];
						importedSession.playersStats.forEach(stat => {
							playersStats.push({
								...stat
							});
						});
						if (playersStats.length > 0) {
							importStores.push({
								id: importedSession.id,
								changes: { playersStats }
							});
						}
					}
					if (provider === 'teamStats') {
						teamStats = importedSession.teamStats;
						if (teamStats) {
							importStores.push({
								id: importedSession.id,
								changes: { teamStats }
							});
						}
					}
				});

				return provider === 'playersStats'
					? ImportStoreActions.importPlayersStats({ importStores: importStores })
					: ImportStoreActions.importTeamStats({ importStores: importStores });
			})
		)
	);

	importPlayersStatsEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(ImportStoreActions.importPlayersStats),
			withLatestFrom(
				this.store$.select(ImportStoreSelectors.selectAllImportedSessionSets),
				this.store$.select(AuthSelectors.selectCustomer)
			),
			switchMap(([action, importedSessionSets, customer]) => {
				const { firstName, lastName } = customer;
				const loggedUsername = `${firstName} ${lastName}`;
				const matches$ = importedSessionSets.map(session => {
					const match = (<Match[]>session.matches).find(({ id }) => id === session.matchId);
					const enabledStats = session.playersStats
						.filter(({ enabled }) => enabled)
						.map(({ playerStat }) => playerStat);
					return this.matchApi.importPlayerStatsFromCSV(match.id, enabledStats, loggedUsername);
				});

				return forkJoin(matches$).pipe(
					map((results: any[]) => {
						const messages: SessionMessage[] = results.map(({ match, event }, index) => ({
							severity: 'success',
							summary: '',
							detail: `Session ${moment(match.date).format(
								`${getMomentFormatFromStorage()} hh:mm`
							)} imported correctly.`,
							link: event,
							type: 'stats'
						}));

						return ImportStoreActions.endSessionImport({ messages });
					}),
					catchError(error => of(ImportStoreActions.importSessionError({ error })))
				);
			})
		)
	);

	importTeamStatsEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(ImportStoreActions.importTeamStats),
			withLatestFrom(
				this.store$.select(ImportStoreSelectors.selectAllImportedSessionSets),
				this.store$.select(AuthSelectors.selectCustomer)
			),
			switchMap(([action, importedSessionSets, customer]) => {
				const { firstName, lastName } = customer;
				const loggedUsername = `${firstName} ${lastName}`;
				const matches$ = importedSessionSets.map(session => {
					const match = (<Match[]>session.matches).find(({ id }) => id === session.matchId);
					return this.matchApi.importTeamStatsFromCSV(match.id, session.teamStats, loggedUsername);
				});

				return forkJoin(matches$).pipe(
					map((results: any[]) => {
						const messages: SessionMessage[] = results.map(({ match, event }, index) => ({
							severity: 'success',
							summary: '',
							detail: `Session ${moment(match.date).format(
								`${getMomentFormatFromStorage()} hh:mm`
							)} imported correctly.`,
							link: event,
							type: 'stats'
						}));

						return ImportStoreActions.endSessionImport({ messages });
					}),
					catchError(error => of(ImportStoreActions.importSessionError({ error })))
				);
			})
		)
	);
}
