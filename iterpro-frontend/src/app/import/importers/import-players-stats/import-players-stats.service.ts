import { Injectable, Injector } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { Match, Player, TeamApi, TeamSeasonApi } from '@iterpro/shared/data-access/sdk';
import { getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import { sortBy } from 'lodash';
import * as momentLib from 'moment';
import { extendMoment } from 'moment-range';
import { PlayerStatsDetail, RawPlayersStats } from 'src/app/+state/import-store/interfaces/import-store.interfaces';
import { ImportStore } from 'src/app/+state/import-store/ngrx/import-store.model';

const moment = extendMoment(momentLib);

@Injectable({
	providedIn: 'root'
})
export class ImportPlayersStatsService {
	private teamApi: TeamApi;
	private currentTeamService: CurrentTeamService;
	private teamSeasonApi: TeamSeasonApi;

	constructor(injector: Injector) {
		this.teamApi = injector.get(TeamApi);
		this.currentTeamService = injector.get(CurrentTeamService);
		this.teamSeasonApi = injector.get(TeamSeasonApi);
	}

	async buildSessionForTable(
		playersStatsToImport: RawPlayersStats[],
		missingPlayers: Array<string[]>
	): Promise<ImportStore[]> {
		const currentTeamId = this.currentTeamService.getCurrentTeam().id;
		const currentSeason = this.currentTeamService.getCurrentSeason();
		const todayServer = moment().toDate().toJSON();

		const matches$ = await (this.teamApi
			.getMatch(currentTeamId, { where: { date: { lte: todayServer } } })
			.toPromise() as Promise<Match[]>);
		const players = await this.teamSeasonApi
			.getPlayers(currentSeason.id, { fields: ['id', 'displayName'] })
			.toPromise();
		const matches = sortBy(matches$, 'date').reverse();

		const datatableModel: ImportStore[] = playersStatsToImport.map((session: RawPlayersStats, index) => {
			const dtSessImport: ImportStore = new ImportStore();
			dtSessImport.sessionName = session.playersStats[0].gameName || 'Session 1';
			dtSessImport.sessionObj = session;
			dtSessImport.matches = matches.map((match: Match) => ({
				...match,
				title: `${match.opponent} ${moment(match.date).format(getMomentFormatFromStorage())}`,
				importLabel: `${match.opponent !== '?' ? match.opponent : 'Match'} - ${moment(match.date).format(
					'DD/MM/YYYY HH:mm'
				)}`
			}));
			dtSessImport.enabled = true;
			dtSessImport.playersStats = [];
			dtSessImport.gameImport = true;
			dtSessImport.csvFile = session.csvFile;
			let playerFound: Player;
			let dtPlayerStats: PlayerStatsDetail;
			for (const sessionData of session.playersStats) {
				playerFound = players.find(
					({ displayName }) => displayName.toLowerCase() === sessionData.playerName.toLowerCase()
				);
				if (playerFound) {
					sessionData.playerId = playerFound.id;
					dtPlayerStats = {
						id: null,
						enabled: true,
						playerName: sessionData.playerName,
						playerId: playerFound.id,
						playerStat: sessionData
					};
					dtSessImport.playersStats.push(dtPlayerStats);
				}
			}
			if (missingPlayers[index] && missingPlayers[index].length) {
				dtSessImport.errors = `The following players have problems matching with the csv sessions: ${missingPlayers[
					index
				].join(', ')}`;
			}
			return dtSessImport;
		});
		return datatableModel;
	}
}
