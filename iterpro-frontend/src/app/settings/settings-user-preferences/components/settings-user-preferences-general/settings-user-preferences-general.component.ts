import { NgClass, NgStyle, NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, Renderer2, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthActions, AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import { AzureStorageApi, Customer, CustomerApi, CustomerTeamSettingsApi } from '@iterpro/shared/data-access/sdk';
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
	AzureStoragePipe,
	BlockUiInterceptorService,
	CanComponentDeactivate,
	ErrorService,
	dateFormatList,
	languagesList
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as moment from 'moment/moment';
import { SelectItem } from 'primeng/api';
import { Observable, forkJoin } from 'rxjs';
import { first, switchMap, tap } from 'rxjs/operators';
import { SettingsHeaderComponent } from '../../../components/settings-header/settings-header.component';
import { userPreferencesContactsForm } from './models/user-preferences-general.form';
import { CustomerPreferenceGeneral, UserPreferencesContacts } from './models/user-preferences-general.type';

// TODO landing pages is missing, it should be added to the form ot in Team Settings

@UntilDestroy()
@Component({
	standalone: true,
	selector: 'iterpro-user-preferences-general',
	imports: [
		TranslateModule,
		NgStyle,
		AzureStoragePipe,
		IconButtonComponent,
		FormsModule,
		ReactiveFormsModule,
		NgTemplateOutlet,
		FormFeedbackComponent,
		PlayerFlagComponent,
		LangToFlagPipe,
		NgClass,
		CloudUploadComponent,
		PictureComponent,
		ActionButtonsComponent,
		SkeletonGridComponent,
		PrimeNgModule,
		SettingsHeaderComponent
	],
	templateUrl: './settings-user-preferences-general.component.html'
})
export class SettingsUserPreferencesGeneralComponent implements CanComponentDeactivate, OnInit {
	// Services
	readonly #customerApi = inject(CustomerApi);
	readonly #customerTeamSettingsApi = inject(CustomerTeamSettingsApi);
	readonly #errorService = inject(ErrorService);
	readonly #alertService = inject(AlertService);
	readonly #translateService = inject(TranslateService);
	readonly #azureStoragePipe = inject(AzureStoragePipe);
	readonly #azureStorageApi = inject(AzureStorageApi);
	readonly #authStore = inject(Store<AuthState>);
	readonly #renderer = inject(Renderer2);
	readonly #fb = inject(FormBuilder);
	readonly customer$ = this.#authStore.select(AuthSelectors.selectCustomer).pipe(takeUntilDestroyed());
	readonly contactsForm = this.#fb.nonNullable.group<UserPreferencesContacts>(userPreferencesContactsForm);
	readonly #blockUiInterceptorService = inject(BlockUiInterceptorService);
	// Variables
	saveClicked = false;
	languagesOptions: SelectItem[];
	dateFormatOptions: SelectItem[];
	customer: CustomerPreferenceGeneral;
	isLoading = true;
	editMode = false;
	ngOnInit() {
		this.#translateService.getTranslation(this.#translateService.currentLang).subscribe({
			next: () => this.initAll()
		});
	}

	private initAll() {
		this.setLanguageOptions();
		this.setDateFormatList();
		this.customer$.subscribe({
			next: (customer: CustomerPreferenceGeneral) => {
				this.customer = customer;
				this.loadForm();
				setTimeout(() => (this.isLoading = false), 300);
			}
		});
	}

	canDeactivate(): boolean {
		return !this.contactsForm.dirty;
	}

	private loadForm(): void {
		this.contactsForm.patchValue({ ...this.customer, teamSettings: this.customer.teamSettings[0] });
		this.contactsForm.disable();
	}

	//#region Language
	private setLanguageOptions() {
		this.languagesOptions = languagesList.map(({ label, value }) => ({
			label: this.#translateService.instant(label),
			value
		}));
	}

	onLanguageSelect({ value }) {
		this.#translateService
			.use(value)
			.pipe(
				first(),
				untilDestroyed(this),
				tap(value => {
					if (value === 'ar-SA') {
						this.#renderer.addClass(document.documentElement, 'arabic');
					} else {
						this.#renderer.removeClass(document.documentElement, 'arabic');
					}
				})
			)
			.subscribe({
				next: () => {
					this.setLanguageOptions();
					/** Update moment locale */
					moment.locale(value);
				}
			});
	}
	//#endregion

	//#region Date Format
	private setDateFormatList() {
		this.dateFormatOptions = dateFormatList.map(({ label, value }) => ({
			label: this.#translateService.instant(label),
			value
		}));
	}
	//#endregion

	//#region Profile Picture
	onProfilePictureClicked() {
		if (!this.customer.downloadUrl || !this.#azureStoragePipe.transform(this.customer.downloadUrl)) return;
		window.open(this.#azureStoragePipe.transform(this.customer.downloadUrl), '_blank');
	}

	deleteImage() {
		this.#blockUiInterceptorService
			.disableOnce(this.#azureStorageApi.removeFile(this.customer.clubId, this.customer.downloadUrl))
			.pipe(
				first(),
				switchMap(() => {
					return this.getUpdatePictureApi(null, null, null);
				}),
				untilDestroyed(this)
			)
			.subscribe({
				next: (customer: Partial<Customer>) => {
					this.contactsForm.patchValue({ downloadUrl: null, profilePhotoUrl: null, profilePhotoName: null });
					this.customer = { ...this.customer, downloadUrl: null, profilePhotoUrl: null, profilePhotoName: null };
					this.contactsForm.markAsDirty();
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	private getUpdatePictureApi(
		downloadUrl: string,
		profilePhotoUrl: string,
		profilePhotoName: string
	): Observable<Customer> {
		return this.#customerApi.patchAttributes(this.customer.id, { downloadUrl, profilePhotoUrl, profilePhotoName });
	}

	onUpload({ downloadUrl, profilePhotoUrl, profilePhotoName }: CloudUploadResult) {
		this.contactsForm.patchValue({ downloadUrl, profilePhotoUrl, profilePhotoName });
		this.contactsForm.markAsDirty();
	}
	//#endregion

	edit(): void {
		this.editMode = true;
		this.contactsForm.enable();
	}

	discard(): void {
		this.saveClicked = false;
		this.editMode = false;
		this.contactsForm.markAsPristine();
		this.loadForm();
		this.onLanguageSelect({ value: this.customer.currentLanguage });
	}

	save(): void {
		this.saveClicked = true;
		if (!this.contactsForm.valid) return this.#alertService.notify('warn', 'Settings', 'alert.formNotValid', false);
		this.editMode = false;
		this.contactsForm.disable();
		this.contactsForm.markAsPristine();
		const { teamSettings, firstName, lastName, downloadUrl, currentLanguage, email, telephone, currentDateFormat } =
			this.contactsForm.value;
		const { position } = teamSettings;
		const obs$ = [
			this.#customerApi.patchAttributes(this.customer.id, {
				firstName,
				lastName,
				downloadUrl,
				currentLanguage,
				email,
				telephone,
				currentDateFormat
			}),
			this.#customerTeamSettingsApi.patchAttributes(teamSettings.id, { position })
		];
		this.#blockUiInterceptorService
			.disableOnce(forkJoin(obs$))
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					const payload: Partial<Customer> = {
						firstName,
						lastName,
						downloadUrl,
						currentLanguage,
						email,
						telephone,
						currentDateFormat,
						teamSettings: this.customer.teamSettings.map(teamSetting =>
							teamSetting.id === teamSettings.id ? { ...teamSetting, position } : teamSetting
						)
					};
					this.syncAuthStore(payload);
					this.#alertService.notify('success', 'home.clubSettings', 'alert.recordUpdated', false);
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	private syncAuthStore(payload: Partial<Customer>) {
		this.#authStore.dispatch(AuthActions.performPatchCustomer({ customer: payload }));
	}
}
