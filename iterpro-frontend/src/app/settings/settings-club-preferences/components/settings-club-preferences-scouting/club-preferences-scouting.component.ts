import { Component, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AuthActions, AuthSelectors, AuthState, SelectableTeam } from '@iterpro/shared/data-access/auth';
import { Club, ClubApi, JsonSchema, ScoutingSettings, Team } from '@iterpro/shared/data-access/sdk';
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
	ScoutingGameReportTemplateApiService,
	standardTemplate
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { cloneDeep } from 'lodash';
import { SelectItem } from 'primeng/api';
import { combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, first, switchMap } from 'rxjs/operators';
import { SettingsHeaderComponent } from '../../../components/settings-header/settings-header.component';
import { clubPreferenceScoutingForm } from './models/settings-club-scouting.form';
import { ClubPreferenceScouting, ClubPreferenceScoutingForm } from './models/settings-club-scouting.type';

@UntilDestroy()
@Component({
	standalone: true,
	selector: 'iterpro-club-preferences-scouting',
	templateUrl: './club-preferences-scouting.component.html',
	imports: [
		ActionButtonsComponent,
		ReactiveFormsModule,
		PrimeNgModule,
		FormFeedbackComponent,
		TranslateModule,
		IconButtonComponent,
		CustomReportTemplateEditorComponent,
		SkeletonGridComponent,
		SettingsHeaderComponent
	]
})
export class SettingsClubPreferencesScoutingComponent implements CanComponentDeactivate, OnInit {
	// Services
	readonly #clubApi = inject(ClubApi);
	readonly #errorService = inject(ErrorService);
	readonly #alertService = inject(AlertService);
	readonly #translateService = inject(TranslateService);
	readonly #gameReportTemplateApiService = inject(ScoutingGameReportTemplateApiService);
	readonly #authStore = inject(Store<AuthState>);
	readonly #fb = inject(FormBuilder);
	readonly #currentTeam$ = this.#authStore.select(AuthSelectors.selectCurrentTeam).pipe(takeUntilDestroyed());
	readonly club$ = this.#authStore.select(AuthSelectors.selectClub).pipe(takeUntilDestroyed());
	readonly scoutingForm = this.#fb.nonNullable.group<ClubPreferenceScoutingForm>(clubPreferenceScoutingForm);
	readonly #blockUiInterceptorService = inject(BlockUiInterceptorService);
	// Variables
	#club: Club;
	saveClicked = false;
	scoutingSettings: ClubPreferenceScouting;
	allTemplates: JsonSchema[] = [];
	profileCreationOptions: SelectItem[];
	templatesOptions: SelectItem[] = [];
	showTemplateEditor = false;
	templateToEdit: JsonSchema = null;
	editMode = false;
	isLoading = true;
	#currentTeam: SelectableTeam;
	ngOnInit() {
		this.isLoading = true;
		combineLatest(this.club$, this.#currentTeam$)
			.pipe(
				distinctUntilChanged(),
				filter(([club, currentTeam]: [Club, Team]) => !!club && !!currentTeam),
				switchMap(([club, currentTeam]: [Club, Team]) => {
					this.#club = club;
					this.#currentTeam = currentTeam;
					return this.#gameReportTemplateApiService.getAllClubTemplates(club.id);
				})
			)
			.subscribe({
				next: templates => {
					this.allTemplates = templates;
					this.loadProfileCreationOptions();
					this.loadTemplates();
					this.scoutingSettings = this.#club.scoutingSettings;
					this.loadForm();
					this.isLoading = false;
				}
			});
	}

	canDeactivate(): boolean {
		return !this.scoutingForm.dirty;
	}

	private loadForm(): void {
		this.scoutingForm.patchValue({
			profileCreation: this.scoutingSettings.profileCreation,
			activeGameReportTemplate: {
				id: this.scoutingSettings.activeGameReportTemplateId,
				version: this.scoutingSettings.activeGameReportTemplateVersion
			}
		});
		this.editMode ? this.scoutingForm.enable() : this.scoutingForm.disable();
	}

	private loadProfileCreationOptions(): void {
		const values = ['always', 'never', 'ask'];
		this.profileCreationOptions = values.map(value => ({
			label: this.#translateService.instant(`club.settings.scouting.profileCreation.${value}`),
			value
		}));
	}

	private loadTemplates() {
		this.templatesOptions = [
			{
				label: standardTemplate.title,
				value: {
					id: null,
					version: null
				}
			},
			...this.allTemplates.map(({ _key, version, title }) => ({
				label: `${title} (v.${version})`,
				value: { id: _key, version }
			}))
		];
	}
	edit(): void {
		this.editMode = true;
		this.scoutingForm.enable();
	}

	discard(): void {
		this.saveClicked = false;
		this.editMode = false;
		this.scoutingForm.markAsPristine();
		this.loadForm();
	}

	save(): void {
		this.saveClicked = true;
		if (!this.scoutingForm.valid) return this.#alertService.notify('warn', 'Settings', 'alert.formNotValid', false);
		this.editMode = false;
		this.scoutingForm.disable();
		this.scoutingForm.markAsPristine();
		const formValue = this.scoutingForm.value;
		const scoutingSettingsPayload: ScoutingSettings = {
			...this.#club.scoutingSettings,
			profileCreation: formValue.profileCreation,
			activeGameReportTemplateId: formValue.activeGameReportTemplate?.id,
			activeGameReportTemplateVersion: formValue.activeGameReportTemplate?.version
		};
		this.#blockUiInterceptorService
			.disableOnce(
				this.#clubApi.patchAttributes(this.#club.id, {
					scoutingSettings: scoutingSettingsPayload
				})
			)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.saveClicked = false;
					this.syncAuthStore({
						...scoutingSettingsPayload
					});
					this.#alertService.notify('success', 'home.clubSettings', 'alert.settingsUpdated', false);
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	onOpenCustomTemplate(isNew?: boolean, newFromTemplate?: boolean) {
		if (isNew && !newFromTemplate) {
			this.templateToEdit = null;
		} else {
			const selectedTemplate = this.allTemplates.find(
				({ _key, version }) =>
					_key === this.scoutingForm.value.activeGameReportTemplate?.id &&
					version === this.scoutingForm.value.activeGameReportTemplate?.version
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

	onSaveCustomTemplate(template: JsonSchema) {
		this.onCloseCustomTemplate();
		this.isLoading = true;
		this.#blockUiInterceptorService
			.disableOnce(
				this.#gameReportTemplateApiService.saveTemplate(
					{
						...template,
						clubId: this.#club.id
					},
					this.#club.id
				)
			)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (updatedTemplate: JsonSchema) => {
					this.scoutingForm.patchValue({
						activeGameReportTemplate: { id: updatedTemplate._key, version: updatedTemplate.version }
					});
					this.allTemplates = [...this.allTemplates, updatedTemplate];
					this.syncAuthStore({
						activeGameReportTemplateId: updatedTemplate._key,
						activeGameReportTemplateVersion: updatedTemplate.version
					});
					this.loadTemplates();
					this.scoutingForm.markAsDirty();
					this.isLoading = false;
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	onCloseCustomTemplate() {
		this.showTemplateEditor = false;
		this.templateToEdit = null;
	}

	private syncAuthStore(scoutingSetting: Partial<ScoutingSettings>) {
		this.#authStore.dispatch(
			AuthActions.performPatchTeam({
				teamId: this.#currentTeam.id,
				team: {
					...(this.#currentTeam as Team),
					club: {
						...(this.#club as Club),
						scoutingSettings: {
							...this.#club.scoutingSettings,
							...scoutingSetting
						}
					}
				}
			})
		);
	}
}
