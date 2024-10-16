import { Component, EventEmitter, inject, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import { CustomerApi, SDKToken } from '@iterpro/shared/data-access/sdk';
import {
	ActionButtonsComponent,
	FormFeedbackComponent,
	IconButtonComponent,
	SkeletonGridComponent
} from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AlertService,
	BlockUiInterceptorService,
	CanComponentDeactivate,
	ErrorService
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { ChipModule } from 'primeng/chip';
import { Observable, of } from 'rxjs';
import { catchError, first, map, tap } from 'rxjs/operators';
import { SettingsHeaderComponent } from '../../../../../components/settings-header/settings-header.component';
import { passwordEditForm } from './models/password-edit.form';
import {
	CustomerPasswordEdit,
	PasswordEdit,
	PasswordValidatorInput,
	PasswordValidatorResponse
} from './models/password-edit.type';

@UntilDestroy()
@Component({
	standalone: true,
	selector: 'iterpro-password-edit',
	imports: [
		ReactiveFormsModule,
		FormFeedbackComponent,
		TranslateModule,
		ActionButtonsComponent,
		IconButtonComponent,
		ChipModule,
		PrimeNgModule,
		SkeletonGridComponent,
		SettingsHeaderComponent
	],
	templateUrl: './password-edit.component.html'
})
export class PasswordEditComponent implements CanComponentDeactivate {
	// Services
	readonly #customerApi = inject(CustomerApi);
	readonly #errorService = inject(ErrorService);
	readonly #alertService = inject(AlertService);
	readonly #authStore = inject(Store<AuthState>);
	readonly #fb = inject(FormBuilder);
	readonly #blockUiInterceptorService = inject(BlockUiInterceptorService);
	// Variables
	customer$ = this.#authStore.select(AuthSelectors.selectCustomer).pipe(takeUntilDestroyed());
	readonly changePwdForm = this.#fb.nonNullable.group<PasswordEdit>(passwordEditForm);
	customer: CustomerPasswordEdit;
	customerId: string;
	pwdInfo: { score: 0 | 1 | 2 | 3 | 4; pwdWarningSuggestion: string[] };
	suggestedPassword: string;
	showPassword = false;
	passwordRequirements: string[];
	saveClicked = false;
	isLoading = true;
	editMode = false;
	@Output() passwordChanged: EventEmitter<SDKToken> = new EventEmitter<SDKToken>();
	constructor() {
		this.loadForm();
		this.loadPasswordRequirements();
		this.customer$.subscribe({
			next: (customer: CustomerPasswordEdit) => {
				this.isLoading = true;
				this.customer = customer;
				if (this.customer && this.customer.isTempPassword) {
					this.editMode = true;
					this.enableForm();
					this.isLoading = false;
				}
			}
		});
		setTimeout(() => (this.isLoading = false), 300);
	}

	canDeactivate(): boolean {
		return !this.editMode;
	}

	private loadForm() {
		this.changePwdForm.get('passwords').get('new_password').setAsyncValidators(this.validateAsync.bind(this));
		this.disableForm();
		this.changePwdForm
			.get('passwords')
			.get('new_password')
			.valueChanges.subscribe(value => {
				this.pwdInfo = null;
				this.suggestedPassword = null;
			});
	}

	edit(): void {
		this.editMode = true;
		this.enableForm();
	}

	discard(): void {
		this.editMode = false;
		this.changePwdForm.reset();
		this.changePwdForm.markAsPristine();
		this.disableForm();
	}

	private enableForm() {
		this.changePwdForm.enable();
	}
	private disableForm() {
		this.changePwdForm.disable();
	}

	//#region Async Validators
	// Create a custom validator function that calls the API endpoint

	private validateAsync(control: FormControl): Observable<ValidationErrors> {
		return this.validateField(control.value).pipe(
			map(response => {
				if (response.valid) {
					this.pwdInfo = {
						score: response.strengthInfo.score,
						pwdWarningSuggestion: response.strengthInfo.feedback.suggestions.map(
							(suggestionHint: string) => suggestionHint
						)
					};
					return null;
				}
				this.pwdInfo = null;
				return {
					valid: false,
					errors: response.missingRequirements.map((requirement: string) => ({
						message: requirement
					}))
				};
			}),
			catchError(() => of(null))
		);
	}

	private validateField(value: string): Observable<PasswordValidatorResponse> {
		const validationInput: PasswordValidatorInput = {
			password: value,
			extraBannedWords: [this.customer.firstName, this.customer.lastName]
		};
		return this.#customerApi.isValidPassword(validationInput).pipe(untilDestroyed(this));
	}

	getPasswordScore(score: 0 | 1 | 2 | 3 | 4): { color: string; label: string } {
		switch (score) {
			case 0:
				return {
					label: 'password.score.0',
					color: 'red'
				};
			case 1:
				return {
					label: 'password.score.1',
					color: 'orange'
				};
			case 2:
				return {
					label: 'password.score.2',
					color: 'yellow'
				};
			case 3:
				return {
					label: 'password.score.3',
					color: 'lightgreen'
				};
			case 4:
				return {
					label: 'password.score.4',
					color: 'green'
				};
		}
	}

	setFormPassword() {
		this.changePwdForm.get('passwords').get('new_password').setValue(this.suggestedPassword);
	}

	generatePassword() {
		this.#blockUiInterceptorService
			.disableOnce(this.#customerApi.generateStrongPassword())
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (response: { password: string }) => {
					if (response) {
						this.suggestedPassword = response.password;
					}
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	private loadPasswordRequirements() {
		this.#blockUiInterceptorService
			.disableOnce(this.#customerApi.getPasswordRequirements())
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (response: string[]) => {
					if (response) {
						this.passwordRequirements = Object.values(response);
					}
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}
	//#endregion

	onSubmit() {
		if (!this.changePwdForm.valid) {
			this.saveClicked = true;
			return;
		}
		this.#customerApi
			.changePasswordRequest(
				this.customer.id,
				this.changePwdForm.get('current_password').value,
				this.changePwdForm.get('passwords').value.new_password
			)
			.pipe(
				first(),
				untilDestroyed(this),
				tap(() => {
					this.changePwdForm.reset();
					this.changePwdForm.disable();
					this.editMode = false;
					this.#alertService.notify('success', 'home.settings', 'alert.passwordUpdated', false);
				})
			)
			.subscribe({
				next: ({ token }) => this.passwordChanged.emit(token as SDKToken),
				error: (error: Error) => this.#alertService.notify('error', 'home.settings', error.message, false)
			});
	}
}
