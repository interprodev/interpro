import { Component, effect, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthActions, AuthState } from '@iterpro/shared/data-access/auth';
import { Player, Team, TeamApi, TeamSeasonApi, ThirdpartyApi } from '@iterpro/shared/data-access/sdk';
import {
	ActionButtonsComponent,
	SkeletonAccordionComponent,
	SkeletonTableComponent
} from '@iterpro/shared/ui/components';
import {
	AlertService,
	BlockUiInterceptorService,
	CanComponentDeactivate,
	ErrorService,
	isNotArchived,
	sortByName
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { AccordionModule } from 'primeng/accordion';
import { MenuItem, SelectItem } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { TabMenuModule } from 'primeng/tabmenu';
import { TabViewModule } from 'primeng/tabview';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { CustomerTeam, SettingsStore } from '../../../+state/settings.store';
import { SettingsHeaderComponent } from '../../../components/settings-header/settings-header.component';
import { SettingsTeamsDropdownComponent } from '../settings-teams-dropdown/settings-teams-dropdown.component';
import { TeamIntegrationApiPlayerMappingComponent } from './team-integrations-api/components/team-integration-api-player-mapping/team-integration-api-player-mapping.component';
import { toIntegrationsApiForm } from './team-integrations-api/models/integrations-api.form';
import {
	IntegrationApiForm,
	IntegrationApiPlayer,
	UpdateThirdPartyPlayerPayload
} from './team-integrations-api/models/integrations-api.type';
import { TeamHasProviderPipe } from './team-integrations-api/pipes/team-has-provider.pipe';
import { TeamIntegrationGamePlayerMappingComponent } from './team-integrations-third-parties/components/team-integration-game-player-mapping/team-integration-game-player-mapping.component';
import { TeamIntegrationGameTeamMappingComponent } from './team-integrations-third-parties/components/team-integration-game-team-mapping/team-integration-game-team-mapping.component';
import { TeamIntegrationGeneralComponent } from './team-integrations-third-parties/components/team-integration-general/team-integration-general.component';
import { TeamIntegrationGpsMappingComponent } from './team-integrations-third-parties/components/team-integration-gps-mapping/team-integration-gps-mapping.component';
import { toTeamIntegrationsForm } from './team-integrations-third-parties/models/integrations-third-parties.form';
import {
	IntegrationGeneral,
	TeamIntegration,
	TeamIntegrationsThirdPartiesForm
} from './team-integrations-third-parties/models/integrations-third-parties.type';

@UntilDestroy()
@Component({
	standalone: true,
	selector: 'iterpro-teams-integrations',
	imports: [
		ActionButtonsComponent,
		TranslateModule,
		ReactiveFormsModule,
		SkeletonAccordionComponent,
		SkeletonTableComponent,
		AccordionModule,
		TabViewModule,
		SkeletonModule,
		TeamIntegrationGeneralComponent,
		TeamIntegrationGpsMappingComponent,
		TeamIntegrationGameTeamMappingComponent,
		TeamIntegrationGamePlayerMappingComponent,
		TeamIntegrationApiPlayerMappingComponent,
		TeamHasProviderPipe,
		TooltipModule,
		SettingsHeaderComponent,
		SettingsTeamsDropdownComponent,
		TabMenuModule
	],
	templateUrl: './settings-teams-integrations.component.html'
})
export class SettingsTeamsIntegrationsComponent implements CanComponentDeactivate {
	// Services
	readonly #alertService = inject(AlertService);
	readonly #errorService = inject(ErrorService);
	readonly #fb = inject(FormBuilder);
	readonly #teamApi = inject(TeamApi);
	readonly #authStore = inject(Store<AuthState>);
	readonly #teamSeasonApi = inject(TeamSeasonApi);
	readonly #thirdPartyApi = inject(ThirdpartyApi);
	readonly #blockUiInterceptorService = inject(BlockUiInterceptorService);
	readonly #settingsStore = inject(SettingsStore);
	// Variables
	thirdPartiesForm: FormGroup<TeamIntegrationsThirdPartiesForm>;
	editMode = false;
	isLoading = true;
	saveClicked = false;
	selectedTeam: TeamIntegration;
	currentCustomer: CustomerTeam;
	dateFormatsOptions: SelectItem[] = [
		{ label: 'Microsoft Time', value: 0 },
		{ label: 'Microsoft Time Float', value: 4 },
		{ label: 'DDMMYYYY', value: 2 },
		{ label: 'DDMMYY', value: 3 },
		{ label: 'HHMMSS', value: 5 },
		{ label: 'DDMMYYYY HHMMSS', value: 7 },
		{ label: 'UNIX TIMESTAMP', value: 1 },
		{ label: 'YYYYMMDD HHMMSS', value: 6 },
		{ label: 'MMDDYYYY', value: 8 }
	];
	durationFormatsOptions: SelectItem[] = [
		{ label: 'Seconds', value: 0 },
		{ label: 'Minutes', value: 2 },
		{ label: 'Minutes Float', value: 3 },
		{ label: 'HHMMSS', value: 1 },
		{ label: 'MMSS', value: 4 },
		{ label: 'Excel Decimal Seconds', value: 5 }
	];
	apiForm: FormGroup<IntegrationApiForm>;
	seasonPlayers: IntegrationApiPlayer[];
	#selectedSeasonId: string;
	menuItems: MenuItem[] = [
		{ id: 'thirdPartiesForm', label: 'preferences.device', command: () => (this.activeMenu = this.menuItems[0]) },
		{ id: 'apiForm', label: 'preferences.api', command: () => (this.activeMenu = this.menuItems[1]) }
	];
	activeMenu: MenuItem = this.menuItems[0];
	constructor() {
		effect(() => {
			if (this.#settingsStore.selectedTeam() && this.selectedTeam?.id !== this.#settingsStore.selectedTeam().id) {
				this.isLoading = true;
				this.selectedTeam = this.#settingsStore.selectedTeam();
				this.currentCustomer = this.#settingsStore.currentCustomer();
				this.loadTeamIntegrationsForm();
				this.#selectedSeasonId = this.#settingsStore.selectedTeamSeason()?.id;
				this.loadPlayers(this.#selectedSeasonId);
			}
		});
	}

	canDeactivate(): boolean {
		return !this.thirdPartiesForm.dirty && !this.apiForm.dirty;
	}

	private loadTeamIntegrationsForm(): void {
		this.thirdPartiesForm = this.#fb.nonNullable.group(toTeamIntegrationsForm(this.selectedTeam));
	}

	private loadTeamIntegrationsApiForm(): void {
		this.apiForm = this.#fb.nonNullable.group(toIntegrationsApiForm(this.seasonPlayers));
	}

	private disabledForms() {
		this.thirdPartiesForm.disable();
		this.apiForm?.disable();
	}

	private enableForms() {
		this.thirdPartiesForm.enable();
		this.apiForm.enable();
	}

	private markFormsAsPristine() {
		this.thirdPartiesForm.markAsPristine();
		this.apiForm.markAsPristine();
	}

	edit() {
		this.editMode = true;
		this.enableForms();
	}

	discard(): void {
		this.saveClicked = false;
		this.loadTeamIntegrationsForm();
		this.loadTeamIntegrationsApiForm();
		this.markFormsAsPristine();
		this.editMode = false;
		this.disabledForms();
	}

	save() {
		this.saveClicked = true;
		if (!this.thirdPartiesForm.valid || !this.apiForm.valid)
			return this.#alertService.notify('warn', 'Settings', 'alert.formNotValid', false);
		this.editMode = false;
		this.disabledForms();
		const thirdPartiesPayload: Partial<Team> = this.getThirdPartiesPayload();
		const thirdPartiesObs$ = this.#teamApi.patchAttributes(this.#settingsStore.selectedTeamId(), thirdPartiesPayload);
		const obs$ = [thirdPartiesObs$];
		if (this.apiForm.dirty) {
			const apiPlayerMappingPayload: UpdateThirdPartyPlayerPayload[] = this.getApiPlayerMappingPayload();
			const apiPlayerMappingObs$ = this.#thirdPartyApi.updateThirdpartyPlayerIds(apiPlayerMappingPayload);
			obs$.push(apiPlayerMappingObs$, this.#teamSeasonApi.patchAttributes(this.#selectedSeasonId, { resync: true }));
		}
		this.markFormsAsPristine();
		this.#blockUiInterceptorService
			.disableOnce(forkJoin(obs$))
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.saveClicked = false;
					this.#settingsStore.updateTeamById(this.#settingsStore.selectedTeamId(), thirdPartiesPayload);
					this.#authStore.dispatch(
						AuthActions.performPatchTeam({
							teamId: this.#settingsStore.selectedTeamId(),
							team: { ...(this.selectedTeam as Team), ...thirdPartiesPayload }
						})
					);
					this.#alertService.notify('success', 'settings.teams.integrations', 'alert.settingsUpdated', false);
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	//region Team Third Parties Mapping
	private getThirdPartiesPayload(): Partial<Team> {
		const formValue = this.thirdPartiesForm.value;
		return {
			...(formValue.general as IntegrationGeneral),
			_gpsProviderMapping: {
				...formValue.gpsMapping.primarySettings,
				_gpsMetricsMapping: formValue.gpsMapping.defaultMetrics,
				rawMetrics: formValue.gpsMapping.rawMetrics
			},
			_teamProviderMapping: {
				...formValue.gameTeamMapping.primarySettings,
				rawMetrics: formValue.gameTeamMapping.rawMetrics
			},
			_playerProviderMapping: {
				...formValue.gamePlayerMapping.primarySettings,
				rawMetrics: formValue.gamePlayerMapping.rawMetrics
			},
			mappingPreset: formValue.gpsMapping.primarySettings.mappingPreset,
			mappingPresetTeam: formValue.gameTeamMapping.primarySettings.mappingPresetTeam,
			mappingPresetPlayer: formValue.gamePlayerMapping.primarySettings.mappingPresetPlayer,
			thirdPartyCredentials: {
				...this.selectedTeam.thirdPartyCredentials,
				...formValue.gpsMapping.security
			},
			device: this.selectedTeam.device,
			providerTeam: this.selectedTeam.providerTeam,
			providerPlayer: this.selectedTeam.providerPlayer
		};
	}
	//endregion

	//region Api Player Mapping
	private loadPlayers(teamSeasonId?: string) {
		if (!teamSeasonId) {
			this.seasonPlayers = [];
			this.loadTeamIntegrationsApiForm();
			this.isLoading = false;
			return;
		}
		const players$ = this.#teamSeasonApi.getPlayers(teamSeasonId, {
			fields: [
				'id',
				'downloadUrl',
				'displayName',
				'instatId',
				'wyscoutId',
				'gpexeId',
				'statsportId',
				'catapultId',
				'fieldwizId',
				'sonraId',
				'statsportId',
				'wimuId',
				'wyscoutSecondaryTeamId',
				'instatSecondaryTeamId',
				'_thresholds',
				'archived',
				'archivedDate',
				'gender',
				'weight',
				'height',
				'birthDate'
			]
		});
		this.#blockUiInterceptorService
			.disableOnce(players$)
			.pipe(
				first(),
				untilDestroyed(this),
				map((players: IntegrationApiPlayer[]) => {
					const activePlayers = players.filter(player => isNotArchived(player as Player, new Date()));
					return sortByName(activePlayers, 'displayName');
				})
			)
			.subscribe({
				next: (players: IntegrationApiPlayer[]) => {
					this.seasonPlayers = players;
					this.loadTeamIntegrationsApiForm();
					this.isLoading = false;
				},
				error: error => this.#errorService.handleError(error)
			});
	}

	private getApiPlayerMappingPayload(): UpdateThirdPartyPlayerPayload[] {
		return this.apiForm.getRawValue().playersMapping;
	}
	//endregion
}
