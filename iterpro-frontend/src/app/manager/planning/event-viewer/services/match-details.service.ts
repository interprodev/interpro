import { Injectable, inject } from '@angular/core';
import { Event, Team, TeamSeason } from '@iterpro/shared/data-access/sdk';
import { ProviderIntegrationService, ThirdPartyMatch } from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment';
import { of } from 'rxjs';
import { first, map } from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})
export class MatchDetailsService {
	readonly #providerIntegrationService = inject(ProviderIntegrationService);

	getDashboardFromEvent(event: Event, team: Team) {
		const { subformat, teamSeasonId } = event;
		const season: TeamSeason = team.teamSeasons.find(teamSeason => teamSeason.id === teamSeasonId);
		if (season && subformat) {
			const comp = season.competitionInfo.find(({ competition }) => competition === subformat);
			// This should not get the standings of a competition without specifying a season.
			if (comp && comp.competition && comp.season) {
				return this.getDashboard(season, team, comp);
			}
		}
		return of({ dashboard: undefined, matchList: undefined });
	}

	getDashboard(teamSeason: TeamSeason, team: Team, { competition, season }) {
		return this.#providerIntegrationService.dashboard(teamSeason.teamId, team, competition, season).pipe(
			first(),
			map(dashboard => {
				dashboard = this.#providerIntegrationService.filterByStandingsTeamFilter(dashboard, team, teamSeason);
				const providerTeamId: number = this.#providerIntegrationService.getThirdPartyTeamId(team);
				const matchList: ThirdPartyMatch[] = this.wrapList(dashboard, providerTeamId);
				return { dashboard, matchList };
			})
		);
	}

	loadMatchStats(thirdPartyData: any, matchFromList: ThirdPartyMatch) {
		if (matchFromList) {
			return this.#providerIntegrationService.dashboardSingleTeamStat(matchFromList).pipe(
				first(),
				map(res => {
					const match = thirdPartyData.matches.find(
						thirdPartyMatch =>
							(matchFromList.instId && thirdPartyMatch.instId === matchFromList.instId) ||
							thirdPartyMatch.matchId === matchFromList.wyId
					);
					return this.wrapDetails(match, res.teamStats, thirdPartyData);
				})
			);
		}
		return of(undefined);
	}

	singleTeamStat(matchId: number) {
		return this.#providerIntegrationService.singleTeamStat(matchId);
	}

	private wrapList(data, providerId: number): ThirdPartyMatch[] {
		const providerIdField = this.#providerIntegrationService.fields.getProviderShortIdField();
		const list: ThirdPartyMatch[] = data.matches.map(match => {
			const gameweek = match.gameweek;
			const side = match.matchInfo.teamsData[providerId].side;
			const opponentId = match.team1 === providerId ? match.team2 : match.team1;
			const opponent = data.teams.find(team => team.instId === opponentId || team.wyId === opponentId);
			const crest = opponent ? opponent.imageDataURL : null;
			const label = opponent ? opponent.name : null;
			const myScore = moment().isBefore(moment(match.dateutc), 'second')
				? ''
				: match.matchInfo.teamsData[providerId].score;
			const opponentScore = moment().isBefore(moment(match.dateutc), 'second')
				? ''
				: match.matchInfo.teamsData[opponentId].score;
			const result = side === 'home' ? myScore + ' - ' + opponentScore : opponentScore + ' - ' + myScore;
			return {
				matchInfo: match.matchInfo,
				team1: match.team1,
				team2: match.team2,
				gameweek,
				[providerIdField]: match.matchInfo[providerIdField],
				side,
				crest,
				label,
				result,
				played: match.matchInfo.status,
				winner: match.matchInfo.winner === providerId ? 1 : match.matchInfo.winner
			};
		});
		return list.sort((a, b) => a.gameweek - b.gameweek);
	}

	private wrapDetails(match, stats, thirdPartyData) {
		const selected: any = {};
		let homeTeam: number;
		let awayTeam: number;

		if (match.matchInfo.teamsData[match.team1].side === 'home') {
			homeTeam = match.team1;
			awayTeam = match.team2;
		} else {
			homeTeam = match.team2;
			awayTeam = match.team1;
		}

		selected['home'] = this.setTeam(homeTeam, match, stats, thirdPartyData);
		selected['away'] = this.setTeam(awayTeam, match, stats, thirdPartyData);
		selected['match'] = match;

		return selected;
	}

	private setTeam(teamId: number, match, stats: any, thirdPartyData: any) {
		const result =
			thirdPartyData.teams && thirdPartyData.teams.length > 0
				? thirdPartyData.teams.find(team => team.instId === teamId || team.wyId === teamId)
				: null;
		if (!!result) {
			result['teamData'] = match.matchInfo.teamsData[teamId];
			result['teamStats'] = stats.find(stat => !!stat && stat.teamId === teamId);
		}
		return result;
	}
}
