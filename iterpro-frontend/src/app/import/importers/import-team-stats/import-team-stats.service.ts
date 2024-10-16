import { Injectable, inject } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { Match, TeamApi } from '@iterpro/shared/data-access/sdk';
import { getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import { sortBy } from 'lodash';
import * as moment from 'moment';
import { RawTeamStats } from 'src/app/+state/import-store/interfaces/import-store.interfaces';
import { ImportStore } from 'src/app/+state/import-store/ngrx/import-store.model';

@Injectable({
	providedIn: 'root'
})
export class ImportTeamStatsService {
	readonly #teamApiService = inject(TeamApi);
	readonly #currentTeamService = inject(CurrentTeamService);

	async buildSessionForTable(teamStatsToImport: RawTeamStats): Promise<ImportStore> {
		const currentTeamId = this.#currentTeamService.getCurrentTeam().id;
		const todayServer = moment().startOf('day').toDate().toJSON();

		const matches$ = await (this.#teamApiService
			.getMatch(currentTeamId, { where: { date: { lte: todayServer } } })
			.toPromise() as Promise<Match[]>);
		const matches = sortBy(matches$, 'date').reverse();

		const dtSessImport: ImportStore = new ImportStore();
		dtSessImport.sessionName = teamStatsToImport.teamStats.gameName || 'Session 1';
		dtSessImport.sessionObj = teamStatsToImport;
		dtSessImport.matches = matches.map((match: Match) => ({
			...match,
			title: `${match.opponent} ${moment(match.date).format(getMomentFormatFromStorage())}`,
			importLabel: `${match.opponent !== '?' ? match.opponent : 'Match'} - ${moment(match.date).format(
				'DD/MM/YYYY HH:mm'
			)}`
		}));
		dtSessImport.enabled = true;
		dtSessImport.teamStats = {
			id: null,
			enabled: true,
			teamStats: teamStatsToImport.teamStats
		};
		dtSessImport.gameImport = true;
		dtSessImport.csvFile = teamStatsToImport.csvFile;
		return dtSessImport;
	}
}
