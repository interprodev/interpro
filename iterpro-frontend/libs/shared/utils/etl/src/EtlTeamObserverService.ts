import { Injectable } from '@angular/core';
import { Team } from '@iterpro/shared/data-access/sdk';
import { Observable, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})
export class EtlTeamObserverService {
	private team$!: Observable<Team>;
	private initialized = false;
	initialized$: Subject<void> = new Subject<void>();

	initTeam(observable: Observable<Team>): void {
		if (!this.initialized) {
			this.initialized = true;
			this.team$ = observable;
			this.initialized$.next();
		}
	}

	getTeam(): Observable<Team> {
		return this.team$;
	}

	listenToTeam(): Observable<Team> {
		return this.initialized ? this.getTeam() : this.initialized$.pipe(switchMap(() => this.getTeam()));
	}
}
