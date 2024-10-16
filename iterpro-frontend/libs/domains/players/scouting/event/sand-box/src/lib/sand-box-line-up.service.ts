import { Injectable } from '@angular/core';
import {
	State as MatchLineUpState,
	selectCompetitionName,
	selectError,
	selectHasProviderStatsAvailable,
	selectIsLineUpLoading, selectFormationNormalized
} from '@iterpro/players/scouting/event/store-line-up';
import { AlertService } from '@iterpro/shared/utils/common-utils';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})
export class SandBoxLineUpService {
	isLineupLoading$ = this.matchLineUpStore$.select(selectIsLineUpLoading);
	formation$ = this.matchLineUpStore$.select(selectFormationNormalized);
	competitionName$ = this.matchLineUpStore$.select(selectCompetitionName);
	error$ = this.matchLineUpStore$.select(selectError);
	hasProviderStatsAvailable$ = this.matchLineUpStore$.select(selectHasProviderStatsAvailable);

	constructor(private alertService: AlertService, private matchLineUpStore$: Store<MatchLineUpState>) {
		this.notifyErrors();
	}

	private notifyErrors() {
		this.error$
			.pipe(filter<any>(Boolean))
			.subscribe({ next: error => this.alertService.notify('error', 'error', error?.message, false) });
	}
}
