import { Component, effect, inject, untracked } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SettingsStore } from '../../+state/settings.store';
import {
	BlockUiInterceptorService,
	ErrorService,
	getActiveTeams,
	PlayerReportTemplateApiService,
	sortByName
} from '@iterpro/shared/utils/common-utils';
import { Store } from '@ngrx/store';
import { AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { ClubApi, JsonSchema, Team } from '@iterpro/shared/data-access/sdk';
import { forkJoin, of } from 'rxjs';
import { flatten } from 'lodash';
import { J } from '@fullcalendar/core/internal-common';

@Component({
	standalone: true,
	imports: [RouterModule],
	selector: 'iterpro-teams',
	template: ` <router-outlet></router-outlet> `
})
export class TeamsComponent {
	readonly #errorService = inject(ErrorService);
	readonly #clubApi = inject(ClubApi);
	readonly #authStore = inject(Store<AuthState>);
	readonly #currentTeamId$ = this.#authStore.select(AuthSelectors.selectCurrentTeamId).pipe(takeUntilDestroyed());
	readonly settingsStore = inject(SettingsStore);
	readonly #blockUiInterceptorService = inject(BlockUiInterceptorService);
	readonly #playerReportTemplateApiService = inject(PlayerReportTemplateApiService);
	#currentCustomerId: string;
	constructor() {
		effect(() => {
			if (this.settingsStore.currentCustomer() && this.settingsStore.currentCustomer().id !== this.#currentCustomerId) {
				this.#currentCustomerId = this.settingsStore.currentCustomer().id;
				this.initAll();
			}
		});
	}

	private initAll() {
		this.#currentTeamId$
			.pipe(
				distinctUntilChanged(),
				filter((currentTeamId: string) => !!currentTeamId),
				switchMap(currentTeamId => {
					untracked(() => this.settingsStore.setCurrentTeamId(currentTeamId));
					const availableTeamIds = getActiveTeams(this.settingsStore.currentCustomer().teamSettings);
					const teamObs$ = this.#blockUiInterceptorService.disableOnce(
						this.#clubApi.getTeams(this.settingsStore.clubId(), {
							where: { id: { inq: availableTeamIds } },
							include: ['teamSeasons', 'tests']
						})
					);
					const gameReportTemplatesObs$ = (availableTeamIds || []).map(teamId =>
						this.#playerReportTemplateApiService
							.getAllTeamTemplates('game', teamId)
							.pipe(map(result => ({ type: 'game', result })))
					);

					const trainingReportTemplatesObs$ = (availableTeamIds || []).map(teamId =>
						this.#playerReportTemplateApiService
							.getAllTeamTemplates('training', teamId)
							.pipe(map(result => ({ type: 'training', result })))
					);
					return forkJoin([teamObs$, ...gameReportTemplatesObs$, ...trainingReportTemplatesObs$]);
				})
			)
			.subscribe({
				next: ([teams, ...templates]: [Team[], ...{ type: string; result: JsonSchema[] }[]]) => {
					const gameReportTemplates = templates.filter(t => t.type === 'game').map(t => t.result);
					const trainingReportTemplates = templates.filter(t => t.type === 'training').map(t => t.result);
					this.settingsStore.setTeamList(sortByName(teams, 'name'));
					this.settingsStore.setTeamPlayerGameReportTemplates(flatten(gameReportTemplates));
					this.settingsStore.setTeamTrainingReportTemplates(flatten(trainingReportTemplates));
				},
				error: error => this.#errorService.handleError(error)
			});
	}
}
