import { Injectable } from '@angular/core';
import {
	AvailableProviderIdField,
	AzureStorageApi,
	LoopBackAuth,
	PlayerScouting,
	PlayerScoutingApi,
	ProviderType,
	ScoutingGame,
	ScoutingGameApi,
	ScoutingGameReport,
	ScoutingGameReportApi
} from '@iterpro/shared/data-access/sdk';
import { uniqBy } from 'lodash';
import { Observable, forkJoin, of } from 'rxjs';
import { defaultIfEmpty, map, switchMap } from 'rxjs/operators';
import { getId } from '../../utils/functions/utils.functions';
import { BlockUiInterceptorService } from '../block-ui-interceptor.service';
import { ProviderIntegrationService } from '../providers/provider-integration.service';

@Injectable({ providedIn: 'root' })
export class ScoutingEventService {
	isFake = false;
	constructor(
		private auth: LoopBackAuth,
		private azureStorageApi: AzureStorageApi,
		private scoutingGamesApi: ScoutingGameApi,
		private playerScoutingApi: PlayerScoutingApi,
		private scoutingGameReportApi: ScoutingGameReportApi,
		private thirdPartyProviderApi: ProviderIntegrationService,
		private blockUiInterceptorService: BlockUiInterceptorService
	) {}

	getSeasonsForCompetitions(teamId: string, competitionId: number, provider: ProviderType, date: Date) {
		return this.thirdPartyProviderApi.seasonsForCompetitions({ teamId }, [String(competitionId)], provider, date);
	}

	getMatchesForSeason(competitionId: number, seasonIds: number[], provider: ProviderType, date: Date = new Date()) {
		return this.thirdPartyProviderApi.matchesForSeason(competitionId, seasonIds, provider, date);
	}

	getThirdPartyGameDetail(matchId: number, provider?: ProviderType) {
		return provider
			? this.thirdPartyProviderApi.withProviderApi(provider).singleTeamStatWithPlayers(matchId)
			: this.thirdPartyProviderApi.singleTeamStatWithPlayers(matchId);
	}

	getGamePlayerStats(
		matchId: number,
		provider: ProviderType,
		players: number[],
		substitutions: {
			[key: number]: any[];
		}
	) {
		return this.thirdPartyProviderApi.withProviderApi(provider).gamePlayerStats(matchId, players, substitutions);
	}

	dashboardSingleTeamStat(id: number, thirdPartyProviderTeamId1: number, thirdPartyProviderTeamId2: number) {
		return this.thirdPartyProviderApi.dashboardSingleTeamStat({
			wyId: id,
			instId: id,
			team1: thirdPartyProviderTeamId1,
			team2: thirdPartyProviderTeamId2
		});
	}

	getStandingsMatchStats(matchId: number, provider: ProviderType) {
		return this.thirdPartyProviderApi.withProviderApi(provider).getStandingsMatchStats(matchId);
	}

	getMatchesForTeam(teamId: number, date: Date = new Date()) {
		return this.thirdPartyProviderApi.matchesForTeam(teamId, date);
	}

	upsert(game: ScoutingGame) {
		return getId(game) ? this.patch(game) : this.create(game);
	}

	create(game: ScoutingGame) {
		return this.scoutingGamesApi.create(game);
	}

	patch(game: ScoutingGame) {
		const { id, _id, ...input } = game as any;
		return this.scoutingGamesApi.patchAttributes(_id || id, input);
	}

	sendEmail(id: string, assignedTo: string[]) {
		return this.scoutingGamesApi.sendEmail(id, assignedTo);
	}

	getGameReports(scoutingGameId: string, currentScoutId: string, isScoutingAdmin: boolean): Observable<any> {
		const whereCondition = isScoutingAdmin
			? { where: { scoutingGameId } }
			: { where: { scoutingGameId, scoutId: currentScoutId } };
		return this.scoutingGameReportApi.find(whereCondition).pipe(
			switchMap((gameReports: any[]) => {
				if (gameReports.length === 0) return of({ gameReports: [], playersInReport: [] });
				const playersIds = gameReports.map(({ playerScoutingId, thirdPartyProviderId }) => ({
					playerScoutingId,
					thirdPartyProviderId
				}));
				const uniquePlayerScoutingIds = uniqBy(
					playersIds.filter(({ playerScoutingId }) => playerScoutingId),
					'playerScoutingId'
				);
				const uniqueThirdPartyProviderIds = uniqBy(
					playersIds.filter(({ playerScoutingId, thirdPartyProviderId }) => !playerScoutingId && thirdPartyProviderId),
					'thirdPartyProviderId'
				);
				return forkJoin(
					[...uniquePlayerScoutingIds, ...uniqueThirdPartyProviderIds].map(
						({ playerScoutingId, thirdPartyProviderId }) =>
							this.blockUiInterceptorService.disableOnce(
								this.getCorrectScoutingObs(playerScoutingId, thirdPartyProviderId)
							)
					)
				).pipe(
					switchMap((playersInReport: PlayerScouting[] | PlayerScouting) => {
						return of({
							gameReports: gameReports.map(report => {
								const element: PlayerScouting = Array.isArray(playersInReport)
									? (playersInReport.find(({ id }) => id === report?.playerScoutingId) as PlayerScouting)
									: playersInReport;
								return {
									...report,
									tempObserved: element?.observed
								};
							}),
							playersInReport: Array.isArray(playersInReport)
								? playersInReport.map(player =>
										Array.isArray(player) ? (Array.isArray(player[0]) ? player[0][0] : player[0]) : player
								  )
								: null
						});
					})
				);
			})
		);
	}

	private getCorrectScoutingObs(playerScoutingId: string, thirdPartyProviderId: number): Observable<any> {
		return playerScoutingId
			? this.playerScoutingApi.findById(playerScoutingId)
			: this.getPlayerScoutingByThirdPartyId(this.auth.getCurrentUserData().clubId, [thirdPartyProviderId]);
	}

	updateGameReport(reportId: string, report: ScoutingGameReport): Observable<any> {
		return this.scoutingGameReportApi.updateAttributes(reportId, report);
	}

	deleteGameReport(reportId: string): Observable<any> {
		return this.scoutingGameReportApi.deleteById(reportId);
	}

	createGameReport(reports: ScoutingGameReport): Observable<any> {
		return this.scoutingGameReportApi.create(reports);
	}

	getTeamSquads(squadsIds: number[], seasonId: number, provider: ProviderType) {
		return this.thirdPartyProviderApi
			.withProviderApi(provider)
			.squadSeasonPlayers(squadsIds.map(Number), Number(seasonId));
	}

	getPlayerScoutingByThirdPartyId(clubId: string, thirdPartyIds: Array<number | string>) {
		const providerIdProperty = this.thirdPartyProviderApi.fields.getProviderIdField() as AvailableProviderIdField;
		return this.playerScoutingApi.find({
			where: {
				clubId,
				or: [{ [providerIdProperty]: { inq: thirdPartyIds } }, { id: { inq: thirdPartyIds } }]
			}
		});
	}

	getPlayerImage(players: PlayerScouting[]) {
		const playersWithoutImage = players.filter(player => !player.downloadUrl);
		if (playersWithoutImage.length === 0) {
			return of(players);
		}
		const playersWithProvider = playersWithoutImage.filter(a => a?.instatId || a?.wyscoutId);
		if (playersWithProvider.length === 0) {
			return of(players);
		}
		const providerIdProperty = this.thirdPartyProviderApi.fields.getProviderIdField() as AvailableProviderIdField;
		return this.thirdPartyProviderApi.playerImage(playersWithProvider.map(player => player[providerIdProperty])).pipe(
			map(images =>
				players.map(player => {
					const image = images.find(({ thirdPartyId }) => thirdPartyId === player[providerIdProperty]);
					return {
						...player,
						downloadUrl: !!image && image?.image ? image.image : player.downloadUrl || null
					};
				})
			)
		);
	}

	deleteAttachment(clubId: string, url: string) {
		return this.azureStorageApi.removeFile(clubId, url);
	}

	getScoutingFromDB(players: PlayerScouting[]): Observable<PlayerScouting[]> {
		const providerIdProperty = this.thirdPartyProviderApi.fields.getProviderIdField() as AvailableProviderIdField;
		const players$: Observable<PlayerScouting>[] = players.map((player: PlayerScouting) =>
			this.playerScoutingApi
				.find({
					where: {
						clubId: player.clubId,
						[providerIdProperty]: player[providerIdProperty]
					}
				})
				.pipe(switchMap(([found]: any[]) => (found ? of(found) : this.playerScoutingApi.create(player))))
		);
		const total: Observable<PlayerScouting[]> = forkJoin(players$).pipe(defaultIfEmpty([]));
		return total;
	}

	updatePlayerScouting(players: PlayerScouting[], toSetAsObserved: number[]) {
		const providerIdProperty = this.thirdPartyProviderApi.fields.getProviderIdField() as AvailableProviderIdField;

		const playersToUpdate = players
			.filter(player => !!player.id && toSetAsObserved.includes(player[providerIdProperty]))
			.map(({ id }) => this.playerScoutingApi.patchAttributes(id, { observed: true }));

		return forkJoin(playersToUpdate).pipe(defaultIfEmpty([]));
	}

	getCurrentSeasonMatches(playerId: number, startDate: Date, endDate: Date) {
		return this.thirdPartyProviderApi.getCurrentSeasonMatches(playerId, startDate, endDate);
	}
}
