import { Injectable } from '@angular/core';
import {
	State as MatchStatsState,
	selectAwayTeamCrest,
	selectAwayTeamData,
	selectError,
	selectHomeTeamCrest,
	selectHomeTeamData,
	selectIsMatchStatsLoading,
	selectParsedStats,
	selectThirdPartyGameStats, selectHomeTeamGender, selectAwayTeamGender
} from '@iterpro/players/scouting/event/store-match-stats';
import { AlertService } from '@iterpro/shared/utils/common-utils';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})
export class SandBoxMatchStatsService {
	error$ = this.matchStatsStore$.select(selectError);
	isMatchStatsLoading$ = this.matchStatsStore$.select(selectIsMatchStatsLoading);
	thirdPartyGameStats$ = this.matchStatsStore$.select(selectThirdPartyGameStats);
	homeTeamData$ = this.matchStatsStore$.select(selectHomeTeamData);
	awayTeamData$ = this.matchStatsStore$.select(selectAwayTeamData);
	parsedStats$ = this.matchStatsStore$.select(selectParsedStats);
	homeTeamCrest$ = this.matchStatsStore$.select(selectHomeTeamCrest);
	awayTeamCrest$ = this.matchStatsStore$.select(selectAwayTeamCrest);
	homeTeamGender$ = this.matchStatsStore$.select(selectHomeTeamGender);
	awayTeamGender$ = this.matchStatsStore$.select(selectAwayTeamGender)
	constructor(private alertService: AlertService, private matchStatsStore$: Store<MatchStatsState>) {
		this.notifyErrors();
	}

	private notifyErrors() {
		this.error$
			.pipe(filter<any>(Boolean))
			.subscribe({ next: error => this.alertService.notify('error', 'error', error?.message, false) });
	}
}
