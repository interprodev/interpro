import { Component, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthActions, AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import { IterproUserPermission, PermissionsService } from '@iterpro/shared/data-access/permissions';
import { AzureStorageApi, Club, ClubApi, Team } from '@iterpro/shared/data-access/sdk';
import { CloudUploadComponent, CloudUploadResult } from '@iterpro/shared/feature-components';
import {
	ActionButtonsComponent,
	FormFeedbackComponent,
	IconButtonComponent,
	PictureComponent,
	PlayerFlagComponent,
	SkeletonGridComponent
} from '@iterpro/shared/ui/components';
import { LangToFlagPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AlertService,
	BlockUiInterceptorService,
	CanComponentDeactivate,
	ErrorService,
	LANDING_PAGES,
	NATIONALITIES
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SelectItem, SharedModule } from 'primeng/api';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, first, switchMap } from 'rxjs/operators';
import { SettingsHeaderComponent } from '../../../components/settings-header/settings-header.component';
import { clubPreferenceGeneralForm } from './models/settings-club-general.form';
import { ClubPreferenceGeneral, ClubPreferenceGeneralForm } from './models/settings-club-general.type';

@UntilDestroy()
@Component({
	standalone: true,
	selector: 'iterpro-club-preferences-general',
	templateUrl: './club-preferences-general.component.html',
	imports: [
		ActionButtonsComponent,
		CloudUploadComponent,
		FormFeedbackComponent,
		FormsModule,
		IconButtonComponent,
		LangToFlagPipe,
		ReactiveFormsModule,
		SharedModule,
		TranslateModule,
		PictureComponent,
		PlayerFlagComponent,
		PrimeNgModule,
		SkeletonGridComponent,
		SettingsHeaderComponent
	]
})
export class SettingsClubPreferencesGeneralComponent implements CanComponentDeactivate, OnInit {
	// Services
	readonly #clubApi = inject(ClubApi);
	readonly #azureStorageApi = inject(AzureStorageApi);
	readonly #errorService = inject(ErrorService);
	readonly #translateService = inject(TranslateService);
	readonly #alertService = inject(AlertService);
	readonly #authStore = inject(Store<AuthState>);
	readonly #fb = inject(FormBuilder);
	readonly #permissionsService = inject(PermissionsService);
	readonly #blockUiInterceptorService = inject(BlockUiInterceptorService);
	// Variables
	readonly generalForm = this.#fb.nonNullable.group<ClubPreferenceGeneralForm>(clubPreferenceGeneralForm);
	saveClicked = false;
	club: ClubPreferenceGeneral;
	nationalities: SelectItem[];
	today = new Date();
	club$ = this.#authStore.select(AuthSelectors.selectClub).pipe(takeUntilDestroyed());
	#currentTeam$ = this.#authStore.select(AuthSelectors.selectCurrentTeam).pipe(takeUntilDestroyed());
	#currentTeam: Team;
	landingPages: SelectItem[];
	isLoading = true;
	editMode = false;
	ngOnInit() {
		this.#translateService.getTranslation(this.#translateService.currentLang).subscribe({
			next: () => this.initAll()
		});
	}

	private initAll() {
		this.loadNations();
		combineLatest(this.club$, this.#currentTeam$)
			.pipe(
				distinctUntilChanged(),
				filter(([club, currentTeam]: [Club, Team]) => !!club && !!currentTeam)
			)
			.subscribe({
				next: ([club, currentTeam]: [Club, Team]) => {
					this.club = club;
					this.#currentTeam = currentTeam;
					this.loadForm();
					this.loadLandingPages(currentTeam);
					setTimeout(() => (this.isLoading = false), 300);
				}
			});
	}

	canDeactivate(): boolean {
		return !this.generalForm.dirty;
	}

	private loadForm(): void {
		this.generalForm.patchValue(this.club);
		this.generalForm.disable();
	}

	private loadNations() {
		this.nationalities = NATIONALITIES.map(item => ({
			label: this.#translateService.instant(item.label),
			value: item.value
		}));
	}

	private loadLandingPages(currentTeam: Team) {
		this.landingPages = LANDING_PAGES.filter(
			item =>
				!item.userPermission ||
				(this.canAccessToModule(item.userPermission, currentTeam) && !item.teamModules?.length) ||
				(item.teamModules || []).some(module =>
					this.#permissionsService.canTeamAccessToModule(module, this.#currentTeam)
				)
		);
	}

	private canAccessToModule(module: IterproUserPermission, currentTeam: Team): boolean {
		return this.#permissionsService.canUserAccessToModule(module, currentTeam).response;
	}

	onUpload({ downloadUrl }: CloudUploadResult) {
		this.generalForm.patchValue({ crest: downloadUrl });
		this.generalForm.markAsDirty();
	}

	deleteImage() {
		this.#blockUiInterceptorService
			.disableOnce(this.#azureStorageApi.removeFile(this.club.id, this.club.crest))
			.pipe(
				first(),
				switchMap(() => {
					return this.getUpdatePictureApi(null);
				}),
				untilDestroyed(this)
			)
			.subscribe({
				next: (club: Partial<Club>) => {
					this.generalForm.patchValue({ crest: null });
					this.club = { ...this.club, crest: null };
					this.generalForm.markAsDirty();
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	private getUpdatePictureApi(downloadUrl: string): Observable<Club> {
		return this.#clubApi.patchAttributes(this.club.id, { crest: downloadUrl });
	}

	edit(): void {
		this.editMode = true;
		this.generalForm.enable();
	}

	discard(): void {
		this.saveClicked = false;
		this.editMode = false;
		this.generalForm.markAsPristine();
		this.loadForm();
	}

	save(): void {
		this.saveClicked = true;

		if (!this.generalForm.valid) {
			return this.#alertService.notify('warn', 'Settings', 'alert.formNotValid', false);
		}

		this.editMode = false;
		this.generalForm.disable();
		this.generalForm.markAsPristine();
		const formValue = this.generalForm.value;
		this.#blockUiInterceptorService
			.disableOnce(this.#clubApi.patchAttributes(this.club.id, formValue))
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.saveClicked = false;
					this.#alertService.notify('success', 'home.clubSettings', 'alert.settingsUpdated', false);
					this.#authStore.dispatch(
						AuthActions.performPatchTeam({
							teamId: this.#currentTeam.id,
							team: { ...(this.#currentTeam as Team), club: { ...(this.club as Club), ...formValue } }
						})
					);
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}
}
