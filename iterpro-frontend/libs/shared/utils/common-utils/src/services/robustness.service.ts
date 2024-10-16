import { Injectable, inject } from '@angular/core';
import { ProfilePlayersApi, RobustnessData } from '@iterpro/shared/data-access/sdk';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AlertService } from './alert.service';

@Injectable({
	providedIn: 'root'
})
export class RobustnessService {
	readonly #profilePlayersApi = inject(ProfilePlayersApi);
	readonly #alertService = inject(AlertService);

	profileRobustness(
		seasonId: string,
		playerIds: string[],
		dateFrom: Date,
		dateTo: Date,
		metricMinutes: string,
		individual: number,
		teamId?: string
	): Observable<RobustnessData> {
		return this.#profilePlayersApi
			.profileRobustness(seasonId, playerIds, dateFrom, dateTo, metricMinutes, individual, teamId ? teamId : '')
			.pipe(
				map((res: any) => {
					if (res.missingData) {
						this.#alertService.notify('warn', 'Player Robustness', 'alert.refreshData');
					}
					return res.robustness;
				})
			);
	}
}
