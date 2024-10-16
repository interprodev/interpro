import { Component, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthActions, AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import { Club, ClubApi, Team } from '@iterpro/shared/data-access/sdk';
import { CloudUploadComponent } from '@iterpro/shared/feature-components';
import {
	ActionButtonsComponent,
	FormFeedbackComponent,
	IconButtonComponent,
	PictureComponent,
	PlayerFlagComponent,
	SkeletonGridComponent
} from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AlertService,
	BlockUiInterceptorService,
	CanComponentDeactivate,
	currencies,
	CurrencyType,
	ErrorService,
	ExchangeService
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmationService, SelectItem, SharedModule } from 'primeng/api';
import { combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, first } from 'rxjs/operators';
import { SettingsHeaderComponent } from '../../../components/settings-header/settings-header.component';
import { clubPreferenceFinanceForm } from './models/settings-club-finance.form';
import { ClubPreferenceFinance, ClubPreferenceFinanceForm } from './models/settings-club-finance.type';
@UntilDestroy()
@Component({
	standalone: true,
	selector: 'iterpro-club-preferences-finance',
	templateUrl: './club-preferences-finance.component.html',
	imports: [
		ActionButtonsComponent,
		CloudUploadComponent,
		FormFeedbackComponent,
		FormsModule,
		IconButtonComponent,
		PlayerFlagComponent,
		ReactiveFormsModule,
		SharedModule,
		TranslateModule,
		PictureComponent,
		SkeletonGridComponent,
		PrimeNgModule,
		SettingsHeaderComponent
	]
})
export class SettingsClubPreferencesFinanceComponent implements CanComponentDeactivate, OnInit {
	// Services
	readonly #clubApi = inject(ClubApi);
	readonly #errorService = inject(ErrorService);
	readonly #alertService = inject(AlertService);
	readonly #translateService = inject(TranslateService);
	readonly #authStore = inject(Store<AuthState>);
	readonly #fb = inject(FormBuilder);
	readonly financeForm = this.#fb.nonNullable.group<ClubPreferenceFinanceForm>(clubPreferenceFinanceForm);
	readonly club$ = this.#authStore.select(AuthSelectors.selectClub).pipe(takeUntilDestroyed());
	readonly #currentTeam$ = this.#authStore.select(AuthSelectors.selectCurrentTeam).pipe(takeUntilDestroyed());
	readonly #blockUiInterceptorService = inject(BlockUiInterceptorService);
	readonly #exchangeService = inject(ExchangeService);
	readonly #confirmationService = inject(ConfirmationService);
	// Variables
	readonly currencies: SelectItem<CurrencyType>[] = currencies;
	saveClicked = false;
	club: ClubPreferenceFinance;
	#currentTeam: Team;
	frequencies: SelectItem[];
	isLoading = true;
	editMode = false;
	ngOnInit() {
		this.isLoading = true;
		combineLatest(this.club$, this.#currentTeam$)
			.pipe(
				distinctUntilChanged(),
				filter(([club, currentTeam]: [Club, Team]) => !!club && !!currentTeam)
			)
			.subscribe({
				next: ([club, currentTeam]: [Club, Team]) => {
					this.club = club;
					this.#currentTeam = currentTeam;
					this.loadFrequencies();
					this.loadForm();
					setTimeout(() => (this.isLoading = false), 300);
				}
			});
	}

	canDeactivate(): boolean {
		return !this.financeForm.dirty;
	}

	private loadFrequencies(): void {
		this.frequencies = [
			{ label: this.#translateService.instant('frequency.year'), value: 'year' },
			{ label: this.#translateService.instant('frequency.month'), value: 'month' },
			{ label: this.#translateService.instant('frequency.week'), value: 'week' }
		];
	}

	private loadForm(): void {
		this.financeForm.patchValue(this.club);
		this.financeForm.disable();
	}

	edit(): void {
		this.editMode = true;
		this.financeForm.enable();
	}

	discard(): void {
		this.saveClicked = false;
		this.editMode = false;
		this.financeForm.markAsPristine();
		this.loadForm();
	}

	confirmSave(): void {
		this.saveClicked = true;
		if (this.financeForm.valid) {
			const hasCurrencyChanged = this.club.currency !== this.financeForm.value.currency;
			if (hasCurrencyChanged) {
				this.confirmExchangeRate();
			} else {
				this.save();
			}
		}
	}

	private confirmExchangeRate() {
		const formCurrency = this.financeForm.value.currency;
		this.#exchangeService
			.exchange(formCurrency, this.club.currency)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (res: any) => {
					this.#confirmationService.confirm({
						message: this.#translateService.instant('confirm.exchange', {
							val1: this.club.currency,
							val2: formCurrency,
							val3: res.rates[formCurrency]
						}),
						header: this.#translateService.instant('confirm.title'),
						icon: 'fa fa-question-circle',
						accept: () => {
							this.save();
						},
						reject: () => {
							this.financeForm.patchValue({ currency: this.club.currency });
						}
					});
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	save() {
		this.editMode = false;
		this.financeForm.disable();
		this.financeForm.markAsPristine();
		const formValue: Partial<Club> = this.financeForm.value;
		this.#blockUiInterceptorService
			.disableOnce(this.#clubApi.patchAttributes(this.club.id, formValue))
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.saveClicked = false;
					this.syncAuthStore(formValue);
					this.#alertService.notify('success', 'home.clubSettings', 'alert.settingsUpdated', false);
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	private syncAuthStore(data: Partial<Club>) {
		this.#authStore.dispatch(
			AuthActions.performPatchTeam({
				teamId: this.#currentTeam.id,
				team: {
					...(this.#currentTeam as Team),
					club: {
						...(this.club as Club),
						...data
					}
				}
			})
		);
	}
}
