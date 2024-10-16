import { Component, effect, inject, untracked } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthActions, AuthState } from '@iterpro/shared/data-access/auth';
import {
	CustomerTeamSettings,
	CustomerTeamSettingsApi,
	JsonSchema,
	Team,
	TeamApi
} from '@iterpro/shared/data-access/sdk';
import {
	ActionButtonsComponent,
	FormFeedbackComponent,
	CustomReportTemplateEditorComponent,
	IconButtonComponent,
	SkeletonGridComponent
} from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AlertService,
	BlockUiInterceptorService,
	CanComponentDeactivate,
	ErrorService,
	LANDING_PAGES,
	getTeamSettings,
	PlayerReportTemplateApiService
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SelectItem, SharedModule } from 'primeng/api';
import { first, forkJoin } from 'rxjs';
import { CustomerTeam, SettingsStore } from '../../../+state/settings.store';
import { SettingsHeaderComponent } from '../../../components/settings-header/settings-header.component';
import { SettingsTeamsDropdownComponent } from '../settings-teams-dropdown/settings-teams-dropdown.component';
import { teamPreferenceGeneralForm, teamPreferenceUserForm } from './models/settings-team-general.form';
import {
	TeamPreferenceGeneral,
	TeamPreferenceGeneralForm,
	TeamPreferenceUser,
	TeamPreferenceUserForm
} from './models/settings-team-general.type';
import { cloneDeep } from 'lodash';

@UntilDestroy()
@Component({
	standalone: true,
	selector: 'iterpro-teams-general',
	templateUrl: './settings-teams-general.component.html',
	imports: [
		ActionButtonsComponent,
		FormFeedbackComponent,
		FormsModule,
		ReactiveFormsModule,
		SharedModule,
		TranslateModule,
		SkeletonGridComponent,
		PrimeNgModule,
		SettingsHeaderComponent,
		SettingsTeamsDropdownComponent,
		CustomReportTemplateEditorComponent,
		IconButtonComponent
	]
})
export class SettingsTeamsGeneralComponent implements CanComponentDeactivate {
	// Services
	readonly #errorService = inject(ErrorService);
	readonly #teamApi = inject(TeamApi);
	readonly #customerTeamSettingsApi = inject(CustomerTeamSettingsApi);
	readonly #translateService = inject(TranslateService);
	readonly #alertService = inject(AlertService);
	readonly #fb = inject(FormBuilder);
	readonly #authStore = inject(Store<AuthState>);
	readonly settingsStore = inject(SettingsStore);
	readonly #blockUiInterceptorService = inject(BlockUiInterceptorService);
	// Variables
	readonly generalForm = this.#fb.nonNullable.group<TeamPreferenceGeneralForm>(teamPreferenceGeneralForm);
	readonly userForm = this.#fb.nonNullable.group<TeamPreferenceUserForm>(teamPreferenceUserForm);
	readonly #playerReportTemplateApiService = inject(PlayerReportTemplateApiService);
	saveClicked = false;
	teamLandingPages: SelectItem[];
	userLandingPages: SelectItem[];
	genders: SelectItem[];
	#selectedTeam: Team;
	isLoading = true;
	editMode = false;
	#currentCustomer: CustomerTeam;
	gameTemplatesOptions: SelectItem[] = [];
	trainingTemplatesOptions: SelectItem[] = [];
	showTemplateEditor = false;
	templateToEdit: JsonSchema = null;
	templateToEditType: 'game' | 'training';
	constructor() {
		effect(() => {
			if (
				this.settingsStore.selectedTeam() &&
				this.#selectedTeam?.id !== this.settingsStore.selectedTeam()?.id &&
				this.settingsStore.currentCustomer()
			) {
				this.isLoading = true;
				this.#selectedTeam = this.settingsStore.selectedTeam();
				this.#currentCustomer = this.settingsStore.currentCustomer();
				this.loadTemplates();
				this.loadLandingPages();
				this.loadGenders();
				this.loadForm();
				this.loadUserForm();
				setTimeout(() => (this.isLoading = false), 300);
			}
		});
	}

	canDeactivate(): boolean {
		return !this.generalForm.dirty && !this.userForm.dirty;
	}

	private loadTemplates() {
		this.gameTemplatesOptions = this.toReportOptions(this.settingsStore.selectedTeamGameReportTemplates());
		this.trainingTemplatesOptions = this.toReportOptions(this.settingsStore.selectedTeamTrainingReportTemplates());
	}

	private toReportOptions(templates: JsonSchema[]): SelectItem[] {
		return templates.map(({ _key, version, title }) => ({
			label: `${title} (v.${version})`,
			value: { id: _key, version }
		}));
	}

	edit(): void {
		this.editMode = true;
		this.generalForm.enable();
		this.userForm.enable();
	}

	discard(): void {
		this.saveClicked = false;
		this.editMode = false;
		this.markFormsAsPristine();
		this.loadForm();
		this.loadUserForm();
	}

	private loadForm(): void {
		untracked(() =>
			this.generalForm.patchValue({
				name: this.#selectedTeam.name,
				gender: this.#selectedTeam.gender,
				landingPage: this.#selectedTeam.landingPage,
				activeGameReportTemplate: {
					id: this.#selectedTeam?.gameReportSettings?.activeGameReportTemplateId,
					version: this.#selectedTeam?.gameReportSettings?.activeGameReportTemplateVersion
				},
				activeTrainingReportTemplate: {
					id: this.#selectedTeam?.trainingReportSettings?.activeTrainingReportTemplateId,
					version: this.#selectedTeam?.trainingReportSettings?.activeTrainingReportTemplateVersion
				}
			})
		);
		this.editMode ? this.generalForm.enable() : this.generalForm.disable();
	}

	private loadUserForm(): void {
		const teamSettings: CustomerTeamSettings = getTeamSettings(
			this.#currentCustomer.teamSettings,
			this.#selectedTeam.id
		);
		untracked(() => this.userForm.patchValue({ landingPage: teamSettings?.landingPage }));
		this.editMode ? this.userForm.enable() : this.userForm.disable();
	}

	private loadLandingPages() {
		this.teamLandingPages = LANDING_PAGES.filter(
			item => !item?.teamModules || item.teamModules.every(module => this.#selectedTeam.enabledModules.includes(module))
		);
		this.userLandingPages = LANDING_PAGES.filter(
			item => !item?.teamModules || item.teamModules.every(module => this.#selectedTeam.enabledModules.includes(module))
		).filter(item => !item?.userPermission || this.settingsStore.userHasPermission(item.userPermission));
	}

	private loadGenders() {
		const genders = [
			{ label: 'female', value: 'female' },
			{ label: 'male', value: 'male' }
		];
		this.genders = genders.map(gender => ({
			label: this.#translateService.instant(gender.label),
			value: gender.value
		}));
	}

	private disableForms() {
		this.generalForm.disable();
		this.userForm.disable();
	}

	private markFormsAsPristine() {
		this.generalForm.markAsPristine();
		this.userForm.markAsPristine();
	}

	save(): void {
		this.saveClicked = true;
		if (!this.generalForm.valid || !this.userForm.valid)
			return this.#alertService.notify('warn', 'Settings', 'alert.formNotValid', false);
		this.editMode = false;
		this.disableForms();
		this.markFormsAsPristine();
		const generalFormValue: TeamPreferenceGeneral = {
			...this.generalForm.getRawValue(),
			gameReportSettings: {
				activeGameReportTemplateId: this.generalForm.value.activeGameReportTemplate?.id,
				activeGameReportTemplateVersion: this.generalForm.value.activeGameReportTemplate?.version
			},
			trainingReportSettings: {
				activeTrainingReportTemplateId: this.generalForm.value.activeTrainingReportTemplate?.id,
				activeTrainingReportTemplateVersion: this.generalForm.value.activeTrainingReportTemplate?.version
			}
		};
		const userFormValue: TeamPreferenceUser = this.userForm.getRawValue();
		const teamSettings: CustomerTeamSettings = getTeamSettings(
			this.#currentCustomer.teamSettings,
			this.#selectedTeam.id
		);
		const obs$ = [
			this.#teamApi.patchAttributes(this.settingsStore.selectedTeamId(), generalFormValue),
			this.#customerTeamSettingsApi.patchAttributes(teamSettings.id, userFormValue)
		];
		this.#blockUiInterceptorService
			.disableOnce(forkJoin(obs$))
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.saveClicked = false;
					this.syncStore(generalFormValue, userFormValue, teamSettings.id);
					this.#alertService.notify('success', 'club.settings.generalSettings', 'alert.settingsUpdated', false);
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	onOpenCustomTemplate(type: 'game' | 'training', isNew?: boolean, newFromTemplate?: boolean) {
		this.templateToEditType = type;
		if (isNew && !newFromTemplate) {
			this.templateToEdit = null;
		} else {
			const templates =
				type === 'training'
					? this.settingsStore.teamTrainingReportTemplates()
					: this.settingsStore.teamPlayerGameReportTemplates();
			const field = type === 'training' ? 'activeTrainingReportTemplate' : 'activeGameReportTemplate';
			const selectedTemplate = templates.find(
				({ _key, version }) =>
					_key === this.generalForm.value[field]?.id && version === this.generalForm.value[field]?.version
			);
			if (selectedTemplate && newFromTemplate) {
				const duplicatedTemplate = cloneDeep(selectedTemplate);
				duplicatedTemplate._key = undefined;
				duplicatedTemplate.title += ' Duplicated';
				duplicatedTemplate.version = undefined;
				this.templateToEdit = duplicatedTemplate;
			} else {
				this.templateToEdit = selectedTemplate;
			}
		}
		this.showTemplateEditor = true;
	}

	onSaveCustomTemplate(type: 'game' | 'training', template: JsonSchema) {
		this.onCloseCustomTemplate();
		this.isLoading = true;
		this.#blockUiInterceptorService
			.disableOnce(
				this.#playerReportTemplateApiService.saveTemplate(
					type,
					{
						...template,
						teamId: this.#selectedTeam.id
					},
					this.#selectedTeam.id
				)
			)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (updatedTemplate: JsonSchema) => {
					if (type === 'training') {
						this.generalForm.patchValue({
							activeTrainingReportTemplate: { id: updatedTemplate._key, version: updatedTemplate.version }
						});
					} else {
						this.generalForm.patchValue({
							activeGameReportTemplate: { id: updatedTemplate._key, version: updatedTemplate.version }
						});
					}
					const updatedTemplates: JsonSchema[] = [
						...this.settingsStore.teamPlayerGameReportTemplates(),
						updatedTemplate
					];
					if (type === 'training') {
						this.settingsStore.setTeamTrainingReportTemplates(updatedTemplates);
					} else {
						this.settingsStore.setTeamPlayerGameReportTemplates(updatedTemplates);
					}
					const generalFormValue: TeamPreferenceGeneral = {
						...this.generalForm.getRawValue(),
						gameReportSettings: {
							activeGameReportTemplateId: this.generalForm.value.activeGameReportTemplate?.id,
							activeGameReportTemplateVersion: this.generalForm.value.activeGameReportTemplate?.version
						},
						trainingReportSettings: {
							activeTrainingReportTemplateId: this.generalForm.value.activeTrainingReportTemplate?.id,
							activeTrainingReportTemplateVersion: this.generalForm.value.activeTrainingReportTemplate?.version
						}
					};
					const userFormValue: TeamPreferenceUser = this.userForm.getRawValue();
					const teamSettings: CustomerTeamSettings = getTeamSettings(
						this.#currentCustomer.teamSettings,
						this.#selectedTeam.id
					);
					this.syncStore(generalFormValue, userFormValue, teamSettings.id);
					this.loadTemplates();
					this.generalForm.markAsDirty();
					this.isLoading = false;
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	onCloseCustomTemplate() {
		this.showTemplateEditor = false;
		this.templateToEdit = null;
	}

	private syncStore(
		generalFormValue: TeamPreferenceGeneral,
		userFormValue: TeamPreferenceUser,
		teamSettingsId: string
	) {
		this.settingsStore.updateTeamById(this.settingsStore.selectedTeamId(), generalFormValue);
		this.#authStore.dispatch(
			AuthActions.performPatchTeam({
				teamId: this.settingsStore.selectedTeamId(),
				team: { ...this.#selectedTeam, ...generalFormValue }
			})
		);
		this.settingsStore.updateClubCustomerSettingById(this.#currentCustomer.id, this.#selectedTeam.id, userFormValue);
		this.#authStore.dispatch(
			AuthActions.performPatchCustomer({
				customer: {
					teamSettings: this.#currentCustomer.teamSettings.map(teamSetting =>
						teamSetting.id === teamSettingsId ? { ...teamSetting, ...userFormValue } : teamSetting
					)
				}
			})
		);
	}
}
