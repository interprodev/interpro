import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '@iterpro/config';
import { AuthActions, AuthSelectors, AuthState, Credentials, Credentials2FA, LoginViewMode } from '@iterpro/shared/data-access/auth';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Observable } from 'rxjs';
import { ButtonModule } from 'primeng/button';

@Component({
	selector: 'iterpro-login-feature-form',
	standalone: true,
	imports: [CommonModule, TranslateModule, AsyncPipe, FormsModule, ReactiveFormsModule, ProgressSpinnerModule, InputTextModule, ButtonModule],
	templateUrl: './login-feature-form.component.html',
	styleUrls: ['./login-feature-form.component.scss']
})
export class LoginFeatureFormComponent implements OnInit {
	isLoading$: Observable<boolean>;
	viewMode$: Observable<LoginViewMode>;
	qrCode$: Observable<string | undefined>;
	textCode$: Observable<string | undefined>;

	loginForm: FormGroup;
	recoverForm: FormGroup;
	authenticationCode = '';
	mode: string = environment.mode;

	constructor(private readonly store$: Store<AuthState>, private readonly formBuilder: FormBuilder) {
		// Init forms
		this.loginForm = this.formBuilder.group({
			email: new FormControl('', [Validators.required, Validators.email]),
			password: new FormControl('', [Validators.required])
		});

		this.recoverForm = this.formBuilder.group({
			email: new FormControl('', [Validators.required, Validators.email])
		});

		// Initialize
		this.viewMode$ = this.store$.select(AuthSelectors.selectViewMode);
		this.isLoading$ = this.store$.select(AuthSelectors.selectIsLoading);
		this.qrCode$ = this.store$.select(AuthSelectors.selectQrCode);
		this.textCode$ = this.store$.select(AuthSelectors.selectTextCode);
	}

	ngOnInit() {
		this.store$.dispatch(AuthActions.initLoginStores());
	}

	passwordRecoveryAction(): void {
		const email = this.recoverForm.value.email;
		this.store$.dispatch(AuthActions.performPasswordRecovery({ email }));
	}

	showLoginViewAction(): void {
		this.store$.dispatch(AuthActions.changeViewModeToLogin());
	}

	showRecoveryPasswordViewAction(): void {
		this.store$.dispatch(AuthActions.changeViewModeToReset());
	}

	performLoginAction(): void {
		const credentials: Credentials = {
			email: this.loginForm.value.email,
			password: this.loginForm.value.password
		};

		this.store$.dispatch(AuthActions.performLogin({ credentials }));
	}

	validateLoginCodeAction(): void {
		const credentials: Credentials2FA = {
			email: this.loginForm.value.email,
			password: this.loginForm.value.password,
			code: this.authenticationCode
		};

		this.store$.dispatch(AuthActions.performTwoFactorAuthenticationLogin({ credentials }));
	}

	cancelLoginCodeAction(): void {
		this.store$.dispatch(AuthActions.cancelTwoFactorAuthentication());
	}

	validateSetupCodeAction(): void {
		const credentials: Credentials2FA = {
			email: this.loginForm.value.email,
			password: this.loginForm.value.password,
			code: this.authenticationCode
		};

		this.store$.dispatch(AuthActions.validateTwoFactorAuthenticationSetupCode({ credentials }));
	}
}
