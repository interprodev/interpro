import { Injectable, inject } from '@angular/core';
import { PlayerItem, TeamApi } from '@iterpro/shared/data-access/sdk';
import { Observable, forkJoin } from 'rxjs';
import { SelectItem } from 'primeng/api';

@Injectable({
	providedIn: 'root'
})
export class ApiService {
	readonly #teamApi = inject(TeamApi);

	getPlayersTeam(teamsOptions: SelectItem[], type: 'Player' | 'PlayerScouting'): Observable<PlayerItem[][]> {
		const activeTeamsIds: string[] = teamsOptions.map(({ value }) => value.id);
		const obs$: Observable<PlayerItem[]>[] = activeTeamsIds.map((teamId: string) =>
			this.getPlayerObservable(teamId, type)
		);
		return forkJoin(obs$);
	}

	private getPlayerObservable(teamId: string, type: 'Player' | 'PlayerScouting'): Observable<PlayerItem[]> {
		const filter = {
			include: [
				{
					relation: 'attributes'
				}
			],
			fields: ['id', 'displayName', 'teamId', 'birthDate', 'position']
		};
		return type === 'Player'
			? this.#teamApi.getPlayers(teamId, filter)
			: this.#teamApi.getPlayersScouting(teamId, filter);
	}
}
