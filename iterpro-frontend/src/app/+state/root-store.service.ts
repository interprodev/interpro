import { Injectable, inject } from '@angular/core';
import { AuthSelectors } from '@iterpro/shared/data-access/auth';
import { AlertService, Severity } from '@iterpro/shared/utils/common-utils';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs/operators';
import * as RootStoreActions from './root-store.actions';
import * as RootStoreSelectors from './root-store.selectors';
import { RootStoreState } from './root-store.state';

export interface StoreConfig {
	watchTeam: boolean;
	notifyErrors: boolean;
	notifyMessages: boolean;
}

const defaultStoreConfig: StoreConfig = { watchTeam: true, notifyErrors: true, notifyMessages: true };

@Injectable({
	providedIn: 'root'
})
export class RootStoreService {
	readonly #store$ = inject(Store<RootStoreState>);
	readonly #alertService = inject(AlertService);

	init(config: Partial<StoreConfig> = {}) {
		config = { ...defaultStoreConfig, ...config };
		let key: string;
		for (key in config) {
			if (config[key]) {
				this[key]();
			}
		}
	}
	watchTeam() {
		this.#store$
			.select(AuthSelectors.selectTeam)
			.pipe(filter(team => !!team))
			.subscribe(team => this.#store$.dispatch(RootStoreActions.changeTeam({ team })));
	}
	notifyErrors() {
		this.#store$.select(RootStoreSelectors.selectError).subscribe(error => {
			if (error) {
				this.#alertService.notify('error', 'error', error.message, false);
			}
		});
	}
	notifyMessages() {
		this.#store$.select(RootStoreSelectors.selectMessage).subscribe(message => {
			if (message) {
				this.#alertService.notify(message.severity as Severity, message.summary, message.detail, false);
			}
		});
	}
}
