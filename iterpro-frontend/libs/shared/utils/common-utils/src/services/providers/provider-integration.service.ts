import { Injectable, Injector } from '@angular/core';
import {
	AvailableProviderIdField,
	CompetitionGame,
	CompetitionInfo,
	Event,
	IProviderRecordFieldService,
	InstatApi,
	ParsedInStatPlayer,
	Player,
	PlayerScouting,
	ProviderType,
	Team,
	TeamSeason,
	ThirdPartyProviderApi,
	ThirdPartyProviderApis,
	UtilsApi,
	WyscoutApi
} from '@iterpro/shared/data-access/sdk';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { Observable, of } from 'rxjs';
import { isNotEmpty } from '../../utils/functions/utils.functions';
import { CompetitionsConstantsService } from '../competitions/competitions.service';
import { ProviderTypeService } from './provider-type.service';

export interface ThirdPartyMatchBase {
	matchInfo: any;
	team1: number;
	team2: number;
	gameweek: number;
	side: 'home' | 'away';
	crest: string;
	label: string;
	result: string;
	played: string;
	winner: number;
}

export interface WyScoutMatch extends ThirdPartyMatchBase {
	wyId: number;
	instId?: number;
}

export interface InstatMatch extends ThirdPartyMatchBase {
	instId: number;
	wyId?: number;
}

export type ThirdPartyMatch = WyScoutMatch | InstatMatch;

/**
 * Wrapper service for all the third party related logic.
 * Uses wyscoutApi/inStatApi for the backend endpoints.
 **/
@Injectable({
	providedIn: 'root'
})
export class ProviderIntegrationService extends EtlBaseInjectable {
	private readonly apiConfig: ThirdPartyProviderApis = {
		InStat: this.instatApi,
		Wyscout: this.wyscoutApi
	};

	private currentProviderApi!: ProviderType;

	constructor(
		private competitionsService: CompetitionsConstantsService,
		private wyscoutApi: WyscoutApi,
		private instatApi: InstatApi,
		private providerTypeService: ProviderTypeService,
		private utils: UtilsApi,
		injector: Injector
	) {
		super(injector);
	}

	initTeamObserver(teamObserver: Observable<Team>) {
		teamObserver.subscribe({ next: team => this.updateTeam(team) });
	}

	private updateTeam(team: Team) {
		this.currentProviderApi = team.club.b2cScouting ? 'Wyscout' : this.providerTypeService.getProviderType(team);
	}

	// make only IProviderRecordFieldService methods public (at least at typescript level)
	get fields() {
		return this.etlPlayerService as IProviderRecordFieldService;
	}

	get provider(): ProviderType {
		return this.currentProviderApi;
	}

	withTeamApi(team: Team): ThirdPartyProviderApi {
		return this.withProviderApi(this.providerTypeService.getProviderType(team));
	}

	withProviderApi(provider: ProviderType): ThirdPartyProviderApi {
		return provider === 'InStat' ? this.apiConfig.InStat : this.apiConfig.Wyscout;
	}

	getPlayerCareerTransfers(player: Player | PlayerScouting) {
		const provider = this.providerTypeService.getProviderTypeUsed(player);

		const providerId: AvailableProviderIdField = provider === 'InStat' ? 'instatId' : 'wyscoutId';

		if (player[providerId]) {
			return this.currentApi.careerTransfers(player[providerId]);
		}

		return of({
			transfers: [],
			career: []
		});
	}

	searchTeam(query: string, byId: boolean) {
		return this.currentApi.searchTeam(query.toString(), byId);
	}

	dashboard(teamId: string, team: Team, competition: number, season: number) {
		const providerId = this.etlPlayerService.getProviderIdField();
		return this.currentApi.dashboard(teamId, (team as any)[providerId as string], competition, season);
	}

	getSeasonThirdPartyNationalLeague(season: TeamSeason) {
		const nationalLeagueField = this.etlPlayerService.getProviderNationalLeagueField();
		return season && nationalLeagueField && season[nationalLeagueField];
	}

	getCurrentSeasonMatches(playerId: number, dayStart: Date, dayEnd: Date) {
		return this.currentApi.getCurrentSeasonMatches(playerId, dayStart, dayEnd);
	}

	getPlayerNextGames(playerId: number, dayStart: Date, dayEnd: Date) {
		// TODO missing implementation for instat
		return (this.currentApi as any).getPlayerNextGames(playerId, dayStart, dayEnd);
	}

	getThirdPartyTeamId(team: Team) {
		const providerId = this.etlPlayerService.getProviderIdField();
		return team && team[providerId as AvailableProviderIdField];
	}

	getThirdPartyEventId(event: Event) {
		const providerId = this.etlPlayerService.getProviderIdField();
		return event && event[providerId as AvailableProviderIdField];
	}

	getPlayerThirdPartyId(player: ParsedInStatPlayer) {
		const providerId = this.etlPlayerService.getProviderShortIdField();
		return (player as any)[providerId as AvailableProviderIdField];
	}

	getPlayerAdditionalInfo(incompletePlayers: any[]) {
		const providerId = this.etlPlayerService.getProviderShortIdField();
		return this.currentApi.playerSearchAdditionalInfo(
			incompletePlayers.map(({ [providerId as AvailableProviderIdField]: thirdPartyId }) => thirdPartyId)
		);
	}

	getTeamsFromCompetition({ competition, season }: CompetitionInfo, { id }: Team) {
		return this.currentProviderApi === 'InStat'
			? (this.currentApi as InstatApi).instatCompetitionTeams(competition, season)
			: (this.currentApi as WyscoutApi).wyscoutCompetitionTeams(competition, id);
	}

	teamSearch(query: string, competitionIds: number[] = []) {
		if (!this.currentApi) return of([]);
		return this.currentApi.teamSearch(query, competitionIds);
	}

	getTeamWithImage(teamId: string) {
		return this.currentApi.getTeamWithImage(teamId);
	}

	seasonsForCompetitions(
		{ teamId }: Pick<TeamSeason, 'teamId'>,
		selectedThirdPartyCompetitions: string[],
		provider: ProviderType,
		date?: Date | number[]
	) {
		const isInStat = provider === 'InStat';
		return isInStat
			? of([{ seasons: [], passepartout: true }])
			: this.currentApi.seasonsForCompetitions(
					teamId,
					selectedThirdPartyCompetitions.filter(
						competition => isInStat || this.competitionsService.getCompetitionFromJson(competition)
					),
					date
			  );
	}

	filterByStandingsTeamFilter(dashboard: any, team: Team, teamSeason: TeamSeason) {
		const standingFieldFilter = this.etlPlayerService.getProviderStandingTeamsFilterField();
		if (isNotEmpty((team as any)[standingFieldFilter as string])) {
			dashboard.leaderboard.teams = dashboard.leaderboard.teams.filter((team: any) =>
				(teamSeason as any)[standingFieldFilter as string].includes(team.teamId)
			);
		}
		return dashboard;
	}

	dashboardSingleTeamStat(matchFromList: Partial<ThirdPartyMatch>) {
		const providerId = this.etlPlayerService.getProviderShortIdField();
		return this.currentApi.dashboardSingleTeamStat(
			(matchFromList as any)[providerId as string],
			matchFromList.team1,
			matchFromList.team2
		);
	}

	singleTeamStat(matchId: number) {
		return this.currentApi.singleTeamStat(matchId);
	}

	matchesForSeason(
		competitionId: number,
		seasonIds: number[] | any,
		provider: ProviderType,
		date: Date = new Date()
	): Observable<CompetitionGame[]> {
		return provider === 'InStat'
			? (this.withProviderApi(provider) as InstatApi).matchesForSeason(-1, competitionId, date)
			: (this.withProviderApi(provider) as WyscoutApi).matchesForSeason(seasonIds[0], date);
	}

	singleTeamStatWithPlayers(matchId: number) {
		return this.currentApi.singleTeamStatWithPlayers(matchId);
	}

	matchesForTeam(teamId: number, date: Date = new Date()) {
		return this.currentProviderApi === 'InStat'
			? (this.currentApi as InstatApi).getMatchesForTeam(teamId, date)
			: of([]); // not implemented
	}

	gamePlayerStats(matchId: string, players: any[], substitutions: any) {
		return this.currentApi.gamePlayerStats(matchId, players, substitutions);
	}
	squadSeasonPlayers(squadsIds: number[], seasonId: number) {
		return this.currentApi.squadSeasonPlayers(squadsIds, seasonId);
	}
	playerImage(thirdPartyIds: number[]) {
		return this.currentApi.playerImage(thirdPartyIds);
	}
	getSecondaryTeamInfo(teamId: number, syncedPlayers: number[]) {
		return this.currentApi.getSecondaryTeamInfo(teamId, syncedPlayers);
	}
	private get currentApi(): ThirdPartyProviderApi {
		return (this.apiConfig as any)[this.currentProviderApi];
	}

	getStandingsLeaderboard({ competition, season }: CompetitionInfo): Observable<any> {
		return this.currentProviderApi === 'InStat'
			? (this.currentApi as InstatApi).getStandingsLeaderboard(competition, season)
			: (this.currentApi as WyscoutApi).getStandingsLeaderboard(season);
	}

	getStandingsMatchList(team: Team, { competition, season }: CompetitionInfo): Observable<any> {
		const providerId = this.etlPlayerService.getProviderIdField();
		return this.currentProviderApi === 'InStat'
			? (this.currentApi as InstatApi).getStandingsMatchList((team as any)[providerId as string], competition, season)
			: (this.currentApi as WyscoutApi).getStandingsMatchList((team as any)[providerId as string], season);
	}

	getStandingsMatchStats(match: ThirdPartyMatch | Event, fromEventViewer?: boolean): Observable<any> {
		const providerId = fromEventViewer
			? this.etlPlayerService.getProviderIdField()
			: this.etlPlayerService.getProviderShortIdField();
		return match ? this.currentApi.getStandingsMatchStats((match as any)[providerId as string]) : of([]);
	}

	getStandingsMatchStatsById(thirdPartyMatchId: number): Observable<any> {
		return this.currentApi.getStandingsMatchStats(thirdPartyMatchId);
	}

	resync() {
		return this.utils.invalidateCache(this.currentProviderApi === 'InStat' ? 'Instat' : 'Wyscout');
	}
}
