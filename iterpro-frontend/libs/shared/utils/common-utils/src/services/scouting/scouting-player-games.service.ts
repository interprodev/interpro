import { Injectable } from '@angular/core';
import {
	ClubApi,
	CustomerApi, CustomerTeamSettings,
	GameReportColumn,
	LoopBackAuth,
	PlayerScouting,
	ScoutingGame,
	ScoutingGameApi,
	ScoutingGameReport
} from '@iterpro/shared/data-access/sdk';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { getId } from '../../utils/functions/utils.functions';
import { getTeamSettings, userHasPermission } from '../../utils/functions/user/user.functions';

@Injectable({
	providedIn: 'root'
})
export class ScoutingGamesService {
	constructor(
		private authService: LoopBackAuth,
		private clubApi: ClubApi,
		private customerApi: CustomerApi,
		private scoutingGamesApi: ScoutingGameApi
	) {}

	getEmptyNew(date?: Date): ScoutingGame {
		if (!date) {
			date = new Date();
		}
		if (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0) {
			date.setHours(15, 0, 0);
		}
		const { id, currentTeamId, clubId } = this.authService.getCurrentUserData();
		return new ScoutingGame({
			author: id,
			title: '',
			start: date,
			completed: false,
			sent: false,
			history: [],
			assignedTo: [],
			_attachments: [],
			teamId: currentTeamId,
			clubId
		});
	}

	getScouts() {
		this.customerApi.find();
	}

	getAllGames(): Observable<ScoutingGame[]> {
		const { clubId } = this.authService.getCurrentUserData();
		return this.scoutingGamesApi.find({ where: { clubId } });
	}

	getGamesBetween(start: Date, end: Date, players: PlayerScouting[] = []): Observable<ScoutingGame[]> {
		const { id, currentTeamId, clubId } = this.authService.getCurrentUserData();
		return this.clubApi
			.getScoutingEventsForCalendar(clubId, [start, end], { currentTeamId, id })
			.pipe(map((games: ScoutingGame[]) => this.filterByGameReport(games, currentTeamId, players)));
	}

	delete(game: ScoutingGame) {
		return this.scoutingGamesApi.deleteById(getId(game));
	}

	create(game: ScoutingGame) {
		return this.scoutingGamesApi.create(game);
	}

	patch(game: ScoutingGame) {
		const { id, _id, ...input } = game as any;
		return this.scoutingGamesApi.patchAttributes(_id || id, input);
	}

	hasScoutingAdminPermissions(permission: string): boolean {
		const { teamSettings, currentTeamId } = this.authService.getCurrentUserData();
		const teamSetting = getTeamSettings(teamSettings, currentTeamId) as CustomerTeamSettings;
		return teamSettings ? userHasPermission(teamSetting, permission) : false;
	}

	getFrozenColumns(columns: GameReportColumn[]) {
		return columns.filter(column => !!column.frozen);
	}

	getScrollableColumns(columns: GameReportColumn[]) {
		return columns.filter(column => !!column.frozen);
	}

	getAdditionalInfo(event: ScoutingGame): Observable<ScoutingGame> {
		return this.scoutingGamesApi.findById(event.id, {
			fields: { _playerMatchStats: false }
		});
	}
	getCompletedGame(eventId: string): Observable<ScoutingGame> {
		return this.scoutingGamesApi.findById(eventId, {
			fields: { _playerMatchStats: false }
		});
	}
	getMissingData(eventId: string): Observable<ScoutingGame> {
		return this.scoutingGamesApi.findById(eventId, {
			fields: {
				title: false,
				start: false,
				startTime: false,
				endTime: false,
				location: false,
				assignedTo: false,
				author: false,
				homeTeam: false,
				awayTeam: false,
				_playerMatchStats: false
			}
		});
	}

	private filterByGameReport(games: ScoutingGame[], currentTeamId: string, players: PlayerScouting[]) {
		const playersObservedUntil = players.reduce(
			(accumulator, player) => {
				(accumulator.playerIds as string[]).push(getId(player) as string);
				(accumulator.playerIds as string[]).push((player.observerTeams || {})[currentTeamId]);
				return accumulator;
			},
			{ playerIds: [], observerTeams: [] }
		);
		return games.filter(
			({ teamId, gameReports, start }) =>
				teamId === currentTeamId || this.hadGameReports(gameReports, playersObservedUntil, start)
		);
	}

	private hadGameReports(
		gameReports: ScoutingGameReport[] = [],
		{ playerIds = [], observerTeams = [] },
		start: Date
	): boolean {
		const found = gameReports.find(({ playerScoutingId }) => (playerIds as string[]).includes(playerScoutingId));
		const index = found ? (playerIds as string[]).indexOf(found.playerScoutingId) : -1;
		return (
			index > -1 &&
			(!observerTeams[index] || moment(start).startOf('day').isBefore(moment(observerTeams[index]).startOf('day')))
		);
	}
}
