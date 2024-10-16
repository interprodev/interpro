import { Injectable } from '@angular/core';
import {
	AvailableProviderIdField, DenormalizedScoutingGameFields,
	JsonSchema,
	LoopBackAuth,
	PlayerScouting,
	PlayerToStartObserveInfo,
	ScoutingGameReport,
	ScoutingGameReportWithPlayer,
	ThirdPartyClubGameTeam,
	ThirdPartyTeamSquad
} from '@iterpro/shared/data-access/sdk';
import {
	BlockUiInterceptorService,
	ScoutingGameReportTemplateApiService,
	ProviderIntegrationService,
	ProviderTypeService,
	SchemaConversionService,
	ScoutingEventService,
	getOptionsByType,
	mapThirdPartyPlayerToPlayerScouting,
	standardTemplate
} from '@iterpro/shared/utils/common-utils';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { unionWith, uniqWith } from 'lodash';
import { SelectItem } from 'primeng/api';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, defaultIfEmpty, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import * as StoreGameReportListActions from './store-game-report-list.actions';
import { State as GameReportListState, areSamePlayers } from './store-game-report-list.reducer';
import {
	selectActiveTemplateSettings,
	selectAwayTeamId,
	selectClubId,
	selectCurrentScout,
	selectDenormalizedGameFields,
	selectFieldsToEditReport,
	selectFormation,
	selectGameReportsAwayBasic,
	selectGameReportsHomeBasic,
	selectGameReportsPlayersForCreationList,
	selectHomeScoutsOptions,
	selectHomeTeamId,
	selectIsScoutingAdmin,
	selectPlayersInTeam,
	selectPlayersToSetAsObserved,
	selectReports,
	selectReportsRemovedAttachmentURLs,
	selectReportsToDeleteIds,
	selectScoutingPlayersInGameReport,
	selectSettings
} from './store-game-report-list.selectors';

@Injectable()
export class StoreGameReportListEffects {
	loadStoreGameReportLists$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(StoreGameReportListActions.loadStoreGameReportLists),
			withLatestFrom(
				this.gameReportListStore$.select(selectCurrentScout),
				this.gameReportListStore$.select(selectIsScoutingAdmin)
			),
			switchMap(([{ gameId }, currentScout, isScoutingAdmin]) =>
				this.blockUiInterceptorService
					.disableOnce(this.service.getGameReports(gameId, currentScout.id, isScoutingAdmin))
					.pipe(
						map(({ gameReports, playersInReport }) =>
							StoreGameReportListActions.loadStoreGameReportListsSuccess({
								gameReports,
								playersInReport
							})
						),
						catchError(error => of(StoreGameReportListActions.loadStoreGameReportListsFailure({ error })))
					)
			)
		);
	});

	loadGameReportTemplates$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(StoreGameReportListActions.loadStoreGameReportListsSuccess),
			withLatestFrom(this.gameReportListStore$.select(selectClubId)),
			switchMap(([{ gameReports }, clubId]) => {
				const uniqueTemplateIds = uniqWith(
					gameReports
						.filter(
							({ templateId, templateVersion }) =>
								templateId !== standardTemplate.id && templateVersion !== standardTemplate.version
						)
						.map(({ templateId, templateVersion }) => ({ templateId, templateVersion })),
					(itemA, itemB) => itemA.templateId === itemB.templateId && itemA.templateVersion === itemB.templateVersion
				);
				const obs$ = (uniqueTemplateIds || []).map(template =>
					this.gameReportTemplateApiService.getTemplateSpecificVersion(
						clubId,
						template.templateId,
						template.templateVersion
					)
				);
				return forkJoin(obs$).pipe(
					defaultIfEmpty([]),
					map((templateResults: JsonSchema[]) => {
						const activeGameReportTemplates = (templateResults || []).map((templateResult: JsonSchema) => {
							const item = this.schemaConversionService.convertToFormStructure(templateResult);
							item.sections.forEach(
								section =>
									(section.properties = this.schemaConversionService
										.getOrderedProperties(section.properties, section?.metadata?.order)
										.map(prop => ({
											...prop,
											options: getOptionsByType(prop)
										})))
							);
							return item;
						});
						return StoreGameReportListActions.loadGameReportTemplatesSuccess({
							templates: activeGameReportTemplates
						});
					}),
					catchError(error => of(StoreGameReportListActions.loadGameReportTemplatesFailure({ error })))
				);
			})
		);
	});

	loadTeamSquads$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(StoreGameReportListActions.loadTeamSquads),
			switchMap(
				({
					thirdPartyProviderHomeTeamId,
					thirdPartyProviderAwayTeamId,
					thirdPartyProviderMatchId,
					thirdPartyProvider
				}) => {
					const isOfficialMatch =
						thirdPartyProviderHomeTeamId > -1 && thirdPartyProviderAwayTeamId > -1 && thirdPartyProviderMatchId > -1;
					const teamsThirdPartyIds = [thirdPartyProviderHomeTeamId, thirdPartyProviderAwayTeamId].filter(Boolean);
					return !isOfficialMatch || teamsThirdPartyIds.length === 0
						? of(
								StoreGameReportListActions.loadTeamSquadsSuccess({
									playersInTeam: { home: undefined, away: undefined }
								})
						  )
						: this.blockUiInterceptorService
								.disableOnce(this.service.getTeamSquads(teamsThirdPartyIds.map(Number), 0, thirdPartyProvider))
								.pipe(
									map((playersInTeam: ThirdPartyTeamSquad[]) =>
										StoreGameReportListActions.loadTeamSquadsSuccess({
											playersInTeam: { home: playersInTeam[0], away: playersInTeam[1] }
										})
									),
									catchError(error =>
										of(
											StoreGameReportListActions.loadTeamSquadsFailure({
												error
											})
										)
									)
								);
				}
			)
		);
	});

	onClickAddGameReport$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(StoreGameReportListActions.addGameReportClicked),
				withLatestFrom(
					this.gameReportListStore$.select(selectGameReportsHomeBasic),
					this.gameReportListStore$.select(selectGameReportsAwayBasic),
					this.gameReportListStore$.select(selectHomeScoutsOptions)
				),
				map(([payload, gameReportsHome, gameReportsAway, scoutsOptions]) => {
					const gameReports = payload.side === 'home' ? gameReportsHome : gameReportsAway;
					const { scoutIds } = payload;
					const filteredScoutIds = scoutIds.filter(scoutId => {
						const assignedScout: SelectItem & { assignedPlayersIds: string[] } = scoutsOptions.find(
							({ value }) => value === scoutId
						);
						const alreadyExistingCoupleReport = gameReports.find(
							report =>
								report.scoutId === assignedScout?.value &&
								payload.players.find(({ thirdPartyId }) => thirdPartyId === report.thirdPartyProviderId)
						);
						return !alreadyExistingCoupleReport;
					});
					const alreadyAssignedPlayersFound = payload?.scoutIds.length !== filteredScoutIds.length;
					const filteredPayload = {
						...payload,
						scoutIds: filteredScoutIds,
						alreadyAssignedPlayersFound,
						players: alreadyAssignedPlayersFound && filteredScoutIds.length === 0 ? [] : payload.players
					};
					this.gameReportListStore$.dispatch(StoreGameReportListActions.addGameReportAccepted(filteredPayload));
				})
			),
		{ dispatch: false }
	);

	// Dagli id dei giocatori selezionati
	// Scarico la lista di quelli presenti sul DB (passando quelli sezionati)
	// Per ognuno di quelli selezionati creo un game report, aggiugendo l'oggetto playerScouting,
	// Questo oggetto si ottiene confrontando quelli presenti sul DB per providerId, o per ID
	// Se non è presente in questa maniera, creo un oggetto playerScouting cercando nei membri della squadra/formazioni

	onAddGameReports$ = createEffect(() =>
		this.actions$.pipe(
			ofType(StoreGameReportListActions.addGameReportAccepted),
			withLatestFrom(
				this.gameReportListStore$.select(selectHomeTeamId),
				this.gameReportListStore$.select(selectAwayTeamId),
				this.gameReportListStore$.select(selectPlayersInTeam),
				this.gameReportListStore$.select(selectFormation),
				this.gameReportListStore$.select(selectCurrentScout),
				this.gameReportListStore$.select(selectIsScoutingAdmin)
			),
			switchMap(
				([
					{ players, teamName, side, scoutIds },
					homeTeamId,
					awayTeamId,
					playersInTeam,
					formation,
					currentScout,
					isScoutingAdmin
				]) => {
					const providerIdProperty = this.thirdPartyProviderApi.fields.getProviderIdField();
					return this.service
						.getPlayerScoutingByThirdPartyId(
							this.auth.getCurrentUserData().clubId,
							players.map(player =>
								player?.thirdPartyId
									? player.thirdPartyId
									: player[providerIdProperty]
									? player[providerIdProperty]
									: player.id
							)
						)
						.pipe(
							map((dbPlayers: PlayerScouting[]) => {
								const authorId = this.auth.getCurrentUserId();
								const newPlayerScoutings: PlayerScouting[] = [];
								const playersWithError: PlayerToStartObserveInfo[] = [];
								const thirdPartyProviderTeamId = side === 'home' ? homeTeamId : awayTeamId;
								const sideFormation = formation ? (side === 'home' ? formation.home : formation.away) : undefined;
								const sidePlayersInTeam = side === 'home' ? playersInTeam.home?.players : playersInTeam.away?.players;
								const gameReportsAdded: ScoutingGameReportWithPlayer[] = [];
								players.forEach((selectedPlayer: PlayerToStartObserveInfo) => {
									const { id, thirdPartyId } = selectedPlayer;
									const playerScouting = this.getPlayerScouting(
										thirdPartyId,
										id,
										dbPlayers,
										sideFormation,
										sidePlayersInTeam,
										thirdPartyId,
										teamName
									);
									if (!playerScouting) {
										playersWithError.push(selectedPlayer);
										return undefined;
									}
									newPlayerScoutings.push(playerScouting);
									const item = <ScoutingGameReportWithPlayer>{
										displayName: playerScouting?.displayName,
										level: 'game.level.low',
										thirdPartyProviderTeamId,
										thirdPartyProviderId: thirdPartyId,
										teamName,
										authorId,
										completed: false,
										history: [],
										playerScoutingId: playerScouting?.id,
										playerScouting,
										position: playerScouting.position,
										birthDate: playerScouting.birthDate,
										nationality: playerScouting.nationality,
										tempObserved: playerScouting.observed,
										_videos: [],
										_documents: [],
									};
									if (scoutIds && scoutIds.length > 0) {
										scoutIds.forEach(scoutId => {
											gameReportsAdded.push({ ...item, scoutId });
										});
									} else {
										gameReportsAdded.push({ ...item, scoutId: isScoutingAdmin ? null : currentScout.id });
									}
								});
								return StoreGameReportListActions.addGameReportsSuccess({
									gameReports: gameReportsAdded.filter(a => a),
									newPlayerScouting: newPlayerScoutings,
									playersWithError: playersWithError
								});
							})
						);
				}
			)
		)
	);

	onAddGameReportsSuccess$ = createEffect(() =>
		this.actions$.pipe(
			ofType(StoreGameReportListActions.addGameReportsSuccess),
			filter(({ newPlayerScouting }) => newPlayerScouting.length > 0),
			switchMap(({ newPlayerScouting }) =>
				this.service.getPlayerImage(newPlayerScouting).pipe(
					map(newPlayerScoutingWithImage =>
						StoreGameReportListActions.addNewPlayerScoutingSuccess({
							newPlayerScouting: newPlayerScoutingWithImage
						})
					),
					catchError(error =>
						of(
							StoreGameReportListActions.genericError({
								error
							})
						)
					)
				)
			)
		)
	);

	onSelectCustomTeam$ = createEffect(() =>
		this.actions$.pipe(
			ofType(StoreGameReportListActions.selectedCustomTeam),
			filter(({ team, side }) => team.thirdPartyId > 0),
			switchMap(({ team, side }) => {
				return this.blockUiInterceptorService
					.disableOnce(
						this.service.getTeamSquads(
							[team.thirdPartyId],
							0, // TODO VEDERE SE SERVE !!gameDetail && gameDetail.seasonId > 0 ? Number(gameDetail.seasonId) : 0
							team.thirdPartyProvider
						)
					)
					.pipe(
						map((playersInTeam: ThirdPartyTeamSquad[]) =>
							StoreGameReportListActions.selectedCustomTeamSuccess({
								playersInTeam: playersInTeam[0],
								side: side
							})
						),
						catchError(error =>
							of(
								StoreGameReportListActions.genericError({
									error
								})
							)
						)
					);
			})
		)
	);

	onSaveGameReports$ = createEffect(() =>
		this.actions$.pipe(
			ofType(StoreGameReportListActions.saveReports),
			filter(({ game }) => game != null),
			withLatestFrom(
				this.gameReportListStore$.select(selectReports),
				this.gameReportListStore$.select(selectSettings),
				this.gameReportListStore$.select(selectGameReportsPlayersForCreationList)
			),
			filter(([, reports]) => reports.length > 0),
			map(([, , settings, players]) => {
				switch (settings.profileCreation) {
					case 'ask':
						return players?.length > 0
							? StoreGameReportListActions.shownConfirmPlayerCreationDialog()
							: StoreGameReportListActions.saveConfirmationDialogClicked();
					case 'never':
						return StoreGameReportListActions.saveConfirmationDialogClicked();
					case 'always':
					default:
						return StoreGameReportListActions.switchCaseAlwaysCreateProfile({
							playerIds: players.map(({ value }) => value as number)
						});
				}
			})
		)
	);

	onClickSaveConfirmationDialog$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(
				StoreGameReportListActions.saveConfirmationDialogClicked,
				StoreGameReportListActions.switchCaseAlwaysCreateProfile
			),
			withLatestFrom(
				this.gameReportListStore$.select(selectClubId),
				this.gameReportListStore$.select(selectReportsRemovedAttachmentURLs),
				this.gameReportListStore$.select(selectScoutingPlayersInGameReport),
				this.gameReportListStore$.select(selectPlayersToSetAsObserved)
			),
			switchMap(([, clubId, attachments, playersInReport, toSetAsObserved]) =>
				forkJoin([attachments.map(url => this.service.deleteAttachment(clubId, url))]).pipe(
					defaultIfEmpty(null),
					switchMap(() => this.service.getScoutingFromDB(playersInReport.filter(({ id }) => !id))),
					switchMap((newPlayerScoutings: PlayerScouting[]) => {
						const allPlayers = unionWith(newPlayerScoutings, playersInReport, areSamePlayers);
						return this.service.updatePlayerScouting(allPlayers, toSetAsObserved);
					}),
					switchMap((updatedPlayers: PlayerScouting[]) =>
						of(StoreGameReportListActions.saveReportsAccepted({ updatedPlayers }))
					)
				)
			)
		);
	});

	deleteReports = createEffect(() => {
		return this.actions$.pipe(
			ofType(StoreGameReportListActions.saveReportsAccepted),
			withLatestFrom(this.gameReportListStore$.select(selectReportsToDeleteIds)),
			filter(([, reportsToDeleteIds]) => reportsToDeleteIds.length > 0),
			switchMap(([, reportsToDeleteIds]) => {
				const ids$: Array<Observable<string>> = reportsToDeleteIds.map(id => this.service.deleteGameReport(id));
				return forkJoin<Observable<string>[]>(ids$).pipe(
					map((result: any[]) => StoreGameReportListActions.deleteReportsSuccess()),
					catchError(error => of(StoreGameReportListActions.deleteReportsFailure({ error })))
				);
			})
		);
	});

	saveReports = createEffect(() => {
		return this.actions$.pipe(
			ofType(StoreGameReportListActions.saveReportsAccepted),
			withLatestFrom(
				this.gameReportListStore$.select(selectFieldsToEditReport),
				this.gameReportListStore$.select(selectReports),
				this.gameReportListStore$.select(selectActiveTemplateSettings),
				this.gameReportListStore$.select(selectDenormalizedGameFields)
			),
			switchMap(
				([
					{ updatedPlayers },
					{ gameId, activeTeamId },
					reports,
					{ templateId, templateVersion },
					denormalizedGameFields
				]) => {
					const teamId = activeTeamId;
					const updatedReports = this.updateGameReportsWithPlayerAndAdditionalInfo(
						reports,
						updatedPlayers,
						denormalizedGameFields
					);
					const obs$: Array<Observable<ScoutingGameReportWithPlayer>> = updatedReports.map(
						(report: ScoutingGameReportWithPlayer) => {
							const reportWithTemplate = {
								...report,
								templateId: report?.templateId ? report.templateId : templateId,
								templateVersion: report?.templateVersion ? report.templateVersion : templateVersion
							};
							if (report?.playerScouting) delete reportWithTemplate.playerScouting;
							if (report?.template) delete reportWithTemplate.template;
							return report.id
								? this.service.updateGameReport(report.id, { ...reportWithTemplate, teamId })
								: this.service.createGameReport({ ...reportWithTemplate, scoutingGameId: gameId, teamId });
						}
					);
					return forkJoin<Observable<ScoutingGameReportWithPlayer>[]>(obs$).pipe(
						map((result: any) => StoreGameReportListActions.saveReportsSuccess({ reports: result })),
						catchError(error => of(StoreGameReportListActions.saveReportsFailure({ error })))
					);
				}
			)
		);
	});

	private getPlayerScouting(
		playerProviderId: number,
		playerId: string,
		dbPlayers: PlayerScouting[],
		sideFormation: ThirdPartyClubGameTeam,
		sidePlayersInTeam: any[],
		thirdPartyId: number,
		teamName: string
	): PlayerScouting {
		const { clubId, currentTeamId } = this.auth.getCurrentUserData();
		let playerScouting =
			dbPlayers &&
			dbPlayers.find(player => {
				const { id } = player;
				const usedProvider = this.providerTypeService.getProviderTypeUsed(player);
				const providerKey = usedProvider === 'Wyscout' ? 'wyscoutId' : 'instatId';
				return (player[providerKey] && player[providerKey] === playerProviderId) || (id && id === playerId);
			});
		if (!playerScouting) {
			const candidates = this.getCandidates(sideFormation, sidePlayersInTeam);
			const found = candidates?.find(
				({ wyscoutId, instatId, wyId, instId }) =>
					instatId === thirdPartyId || wyscoutId === thirdPartyId || instId === thirdPartyId || wyId === thirdPartyId
			);
			playerScouting = mapThirdPartyPlayerToPlayerScouting(found, clubId, currentTeamId, teamName) as PlayerScouting;
		}

		return playerScouting as PlayerScouting;
	}

	private getCandidates(sideFormation: ThirdPartyClubGameTeam, sidePlayersInTeam: any[]): any[] {
		return sideFormation ? sideFormation.players.map(a => a.playerStats.player) : sidePlayersInTeam;
	}

	private updateGameReportsWithPlayerAndAdditionalInfo(
		reports: ScoutingGameReportWithPlayer[],
		updatedPlayers: PlayerScouting[],
		denormalizedGameFields: DenormalizedScoutingGameFields
	): ScoutingGameReportWithPlayer[] {
		const updated: ScoutingGameReportWithPlayer[] = reports.map((reportItem: ScoutingGameReportWithPlayer) => {
			const playerScoutingId = this.getPlayerScoutingId(reportItem, updatedPlayers);
			return {
				...reportItem,
				playerScoutingId,
				denormalizedScoutingGameFields: denormalizedGameFields,
				tempObserved: updatedPlayers.find(({ id }) => id === playerScoutingId) ? true : reportItem.tempObserved
			};
		});
		return updated;
	}

	private getPlayerScoutingId(report: ScoutingGameReport, insertedScoutingPlayers: PlayerScouting[]): string {
		const providerIdField = this.thirdPartyProviderApi.fields.getProviderIdField() as AvailableProviderIdField;
		const newScoutingPlayer = insertedScoutingPlayers.find(player => {
			return (
				(player[providerIdField] && player[providerIdField] === report.thirdPartyProviderId) ||
				(player.id && player.id === report.playerScoutingId)
			);
		});
		return newScoutingPlayer ? newScoutingPlayer.id : report.playerScoutingId;
	}

	constructor(
		private actions$: Actions,
		private auth: LoopBackAuth,
		private service: ScoutingEventService,
		private providerTypeService: ProviderTypeService,
		private gameReportListStore$: Store<GameReportListState>,
		private schemaConversionService: SchemaConversionService,
		private thirdPartyProviderApi: ProviderIntegrationService,
		private blockUiInterceptorService: BlockUiInterceptorService,
		private gameReportTemplateApiService: ScoutingGameReportTemplateApiService
	) {}
}
