import { Injectable } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Club,
	ComparePlayersStatsApi,
	LoopBackAuth,
	ProfilePlayersApi,
	TeamApi,
	TeamSeasonApi
} from '@iterpro/shared/data-access/sdk';
import { RobustnessService, isNotEmpty } from '@iterpro/shared/utils/common-utils';
import { forkJoin } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class ComparePlayersService {
	constructor(
		private authService: LoopBackAuth,
		private teamApi: TeamApi,
		private currentTeamService: CurrentTeamService,
		private teamSeasonApi: TeamSeasonApi,
		private profilePlayersService: ProfilePlayersApi,
		private comparePlayersStatsService: ComparePlayersStatsApi,
		private robustnessService: RobustnessService
	) {}

	getCustomer() {
		return this.authService.getCurrentUserData();
	}

	loadPeriod(teamId, playerIds, from, to, metrics, metricsTactical, mainGameName, durationFieldPlayerStats, seasonId) {
		const obs = [
			this.findStats(teamId, playerIds[0], from, to, metrics, metricsTactical, mainGameName, durationFieldPlayerStats),
			this.findPlayerStatistics(seasonId, playerIds[0], from, to, durationFieldPlayerStats)
			// this.findPlayerGameStatistics(seasonId, playerIds[0], from, to, durationFieldPlayerStats)
		];

		return forkJoin(obs);
	}

	fetchTeamSeasons(activeTeams) {
		return this.teamSeasonApi.find({
			where: { teamId: { inq: activeTeams } },
			order: 'offseason DESC'
		});
	}

	fetchTeams(activeTeams) {
		return forkJoin(activeTeams.map(id => this.teamApi.getPlayerForCompare(id)));
	}

	getCurrentClub(): Club {
		return this.currentTeamService.getCurrentTeam().club;
	}

	fetchSeasons(team) {
		return team.teamSeasons;
	}

	fetchPlayers(team) {
		return team.players;
	}

	fetchStatsData(player?, team?, season?, metrics?, metricsTactical?, durationFieldPlayerStats?) {
		return this.loadPeriod(
			team.id,
			[player.id],
			season.offseason,
			season.inseasonEnd,
			metrics,
			metricsTactical,
			team.mainGameName,
			durationFieldPlayerStats,
			season.id
		);
	}

	fetchPerformance(events, player, team) {
		let sessions = [];
		let fil;
		const filtered = events.filter(({ format }) => format === 'training' || format === 'game');
		filtered.forEach(event => {
			if (isNotEmpty(event._sessionPlayers)) {
				fil = event._sessionPlayers.filter(({ mainSession, playerId }) => playerId === player.id && mainSession);
				sessions = [...sessions, ...fil];
			}
		});

		return sessions;
	}

	fetchTactical(events, player) {
		let tactics = [];
		let fil;
		const filtered = events.filter(({ format }) => format === 'game');
		filtered.forEach(event => {
			if (isNotEmpty(event.match._playerStats)) {
				fil = event.match._playerStats.filter(({ playerId }) => playerId === player.id);
				tactics = [...tactics, ...fil];
			}
		});

		return tactics;
	}

	fetchEvents(results) {
		const events = results[0].events;
		const trainings = events.filter(x => !x.matchId);
		const matches = events.filter(x => x.matchId);
		const injuries = results[1];
		const countGames = results[0].countGames;
		const countTrainings = results[0].countTrainings;

		return {
			events,
			trainings,
			matches,
			injuries,
			countGames,
			countTrainings
		};
	}

	getRobustness(robustnessResults, playerId) {
		const playerRobustness = robustnessResults[playerId];
		const stats = {
			'player.robustness.apps': Number(playerRobustness.apps),
			'player.robustness.availability': Number(playerRobustness.availability),
			'player.robustness.playing_time': Number(playerRobustness.playingTime),
			'player.robustness.performance_reliability': Number(playerRobustness.performanceReliability),
			'player.robustness.robustness': Number(playerRobustness.robustness),
			'player.robustness.game_missed': Number(playerRobustness.gameMissed),
			'player.robustness.training_missed': Number(playerRobustness.sessionsMissed),
			'player.robustness.game_rate': Number(playerRobustness.gameRate),
			'player.robustness.n_injuries': Number(playerRobustness.injuriesNumber),
			'player.robustness.reinjury_rate': Number(playerRobustness.reinjuryRate),
			'player.robustness.days_absence': Number(playerRobustness.daysAbsence),
			'player.robustness.injury_severity': Number(playerRobustness.injurySeverity)
		};

		return { ...stats };
	}

	findStats(teamId, playerId, from, to, metrics, metricsTactical, mainGameName, durationFieldPlayerStats) {
		return this.comparePlayersStatsService.comparePlayerStats(
			teamId,
			playerId,
			from,
			to,
			metrics,
			metricsTactical,
			durationFieldPlayerStats
		);
	}

	findPlayerStatistics(seasonId, playerId, from, to, durationFieldPlayerStats) {
		return this.robustnessService.profileRobustness(seasonId, [playerId], from, to, durationFieldPlayerStats, 2);
	}

	findPlayerGameStatistics(seasonId, playerId, from, to, durationFieldPlayerStats) {
		return this.profilePlayersService.profileGameStats(seasonId, [playerId], from, to, durationFieldPlayerStats);
	}
}
