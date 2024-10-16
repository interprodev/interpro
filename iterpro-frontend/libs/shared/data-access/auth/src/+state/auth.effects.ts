import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatApi, Customer, CustomerApi, SDKToken, TeamApi } from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	AzureStorageService,
	CalendarService,
	NotificationService,
	UserDateFormatSetting,
	getActiveTeams
} from '@iterpro/shared/utils/common-utils';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { sortBy } from 'lodash';
import * as moment from 'moment';
import { Message } from 'primeng/api';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, exhaustMap, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { AuthActions, AuthSelectors } from '.';
import {
	CurrentTeam,
	GoogleAuthenticationResponse,
	SelectableTeam,
	TwoFactorAuthToken
} from '../models/auth.interfaces';
import { AuthService } from '../services/auth.service';
import { AuthState } from './auth.state';
import { IterproRoute } from '@iterpro/shared/data-access/permissions';
import mixpanel from 'mixpanel-browser';

@Injectable()
export class AuthEffects {
	clearAuthEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.clearAuth),
			tap(() => {
				this.authService.deleteToken();
				this.alertService.notify('warn', 'auth', 'confirm.sessionExpired');
				this.router.navigate(['/login']);
			}),
			map(() => AuthActions.clearAuthSuccess())
		)
	);

	performLogoutEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.performLogout),
			switchMap(({ expired }) =>
				this.authService.logout().pipe(
					tap(() => mixpanel.reset()),
					map(() => AuthActions.performLogoutSuccess({ expired })),
					catchError(error => {
						return of(AuthActions.performLoginFailure({ error }));
					})
				)
			)
		)
	);

	performLogoutSuccessEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.performLogoutSuccess),
			tap(() => this.router.navigate(['/login'])),
			switchMap(({ expired }) =>
				this.translate.use('en-US').pipe(
					map(() => {
						const message: Message | null = expired
							? { severity: 'warn', summary: 'auth', detail: 'confirm.sessionExpired' }
							: null;
						return AuthActions.performLoginMessage({ message });
					})
				)
			)
		)
	);

	performPasswordRecoveryEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.performPasswordRecovery),
			exhaustMap(({ email }) =>
				this.authService.passwordRecovery(email).pipe(
					map(() => AuthActions.performPasswordRecoverySuccess()),
					catchError(error => of(AuthActions.performPasswordRecoveryFailure({ error })))
				)
			)
		)
	);

	performPasswordRecoverySuccessEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.performPasswordRecoverySuccess),
			map(() =>
				AuthActions.performLoginMessage({
					message: { severity: 'success', summary: 'login', detail: 'alert.recoveryEmailSent' }
				})
			)
		)
	);

	performLoginEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.performLogin),
			exhaustMap(({ credentials }) =>
				this.authService.requestLogin(credentials).pipe(
					map((twoFactorToken: TwoFactorAuthToken) => {
						// check if 2FA is enabled
						const is2FAEnabled = !!twoFactorToken.useTwoFactor;
						// if enabled: show input text for google auth code, if OK will return a SDKToken
						// if NOT enabled: 2FA is mandatory, setup the 2FA with QR code
						return is2FAEnabled
							? AuthActions.requireTwoFactorAuthentication()
							: AuthActions.setupTwoFactorAuthentication({ twoFactorToken });
					}),
					catchError(error => of(AuthActions.performLoginFailure({ error })))
				)
			)
		)
	);

	setupTwoFactorAuthenticationEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.setupTwoFactorAuthentication),
			switchMap(({ twoFactorToken }) =>
				this.authService.generateSecret(twoFactorToken.userId).pipe(
					map((googleResponse: GoogleAuthenticationResponse) => AuthActions.setGoogleSetupResponse({ googleResponse })),
					catchError(error => of(AuthActions.performLoginFailure({ error })))
				)
			)
		)
	);

	// action dispatched when user with 2FA configured click on the submit google auth code
	performTwoFactorAuthenticationLoginEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.performTwoFactorAuthenticationLogin),
			switchMap(({ credentials }) =>
				this.authService.login(credentials).pipe(
					tap((sdk: SDKToken) => mixpanel.identify(sdk.userId)),
					map((token: SDKToken) => AuthActions.performLoginSetToken({ token })),
					catchError(error => of(AuthActions.performLoginFailure({ error })))
				)
			)
		)
	);

	// action dispatched when user submit the google qr-code auth code
	validateTwoFactorAuthenticationSetupCodeEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.validateTwoFactorAuthenticationSetupCode),
			withLatestFrom(this.store$.select(AuthSelectors.selectTwoFactorAuthToken)),
			exhaustMap(([{ credentials }, twoFactorAuthToken]) =>
				this.authService.validateSecret(twoFactorAuthToken?.userId as string, credentials).pipe(
					map((token: SDKToken) => AuthActions.performLoginSetToken({ token })),
					catchError(error => of(AuthActions.performLoginFailure({ error })))
				)
			)
		)
	);

	performLoginSetTokenEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.performLoginSetToken),
			switchMap(({ token, changePassword }) => {
				this.authService.setToken(token);
				return this.authService.getCustomer().pipe(
					filter(() => !changePassword),
					tap((customer: Customer) => mixpanel.people.set({
						'$name': `${customer.firstName} ${customer.lastName}`,
						'$email': customer.email
					})),
					tap((customer: Customer) => this.translate.use(customer.currentLanguage)),
					map((customer: Customer) => AuthActions.performLoginSetCustomer({ customer })),
					catchError(error => of(AuthActions.performLoginFailure({ error })))
				);
			})
		)
	);

	performLoginSetCustomerEffetc$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.performLoginSetCustomer),
			switchMap(({ customer }) =>
				this.authService.getSasToken(customer.clubId).pipe(
					map((sasTokenKey: any) => {
						this.azureStorageService.updateSasTokenFromStore(sasTokenKey);
						return AuthActions.performLoginSetSasTokenKey({ sasTokenKey });
					}),
					catchError(error => of(AuthActions.performLoginFailure({ error })))
				)
			)
		)
	);
	performLoginTeamRequestEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.performLoginSetSasTokenKey),
			withLatestFrom(this.store$.select(AuthSelectors.selectCustomer)),
			switchMap(([action, customer]) =>
				this.authService.downloadTeam(customer.currentTeamId).pipe(
					map((currentTeam: CurrentTeam) => AuthActions.performLoginTeamRequestSuccess({ currentTeam })),
					catchError(error => of(AuthActions.performLoginFailure({ error })))
				)
			)
		)
	);
	performLoginTeamRequestSuccessEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.performLoginTeamRequestSuccess),
			withLatestFrom(this.store$.select(AuthSelectors.selectCustomer)),
			map(([{ currentTeam }, customer]) => {
				const userSettingDateFormat: UserDateFormatSetting =
					customer?.currentDateFormat || UserDateFormatSetting.EuropeanFormat;
				localStorage.setItem('currentDateFormat', JSON.stringify(userSettingDateFormat));
				let returnUrl =
					currentTeam.team.club.nationalClub || (customer && customer.isTempPassword)
						? ['/settings']
						: this.route.snapshot.queryParams['returnUrl'] || null;
				if (!returnUrl || returnUrl.length === 0) {
					returnUrl = this.authService.getReturnUrl(currentTeam);
				}
				return AuthActions.performLoginSuccess({ returnUrl });
			})
		)
	);
	performLoginSuccessEffect$: Observable<void> = createEffect(
		() =>
			this.actions$.pipe(
				ofType(AuthActions.performLoginSuccess),
				map(action => {
					const returnUrl = action.returnUrl;
					this.notificationService.initNotifications();
					this.router.navigate(returnUrl);
				})
			),
		{ dispatch: false }
	);

	// Load List

	// Team Update

	updateSelectedTeam$: Observable<any> = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.updateSelectedTeam),
			withLatestFrom(
				this.store$.select(AuthSelectors.selectCustomer),
				this.store$.select(AuthSelectors.selectTeamList)
			),
			switchMap(([{ teamId: currentTeamId, redirectUrl }, customer, teams]) => {
				const team = teams.find(({ id }) => id === currentTeamId);
				const currentSeason = team?.teamSeasons.find(({ offseason, inseasonEnd }) =>
					moment().isBetween(moment(offseason), moment(inseasonEnd))
				);
				const currentTeamSeasonId = currentSeason ? currentSeason.id : undefined;

				const updateCustomer$: Observable<Customer> = this.customerApi.patchAttributes(customer.id, {
					currentTeamId,
					currentTeamSeasonId
				});

				const updateTeam$: Observable<CurrentTeam> = this.authService.downloadTeam(currentTeamId, currentTeamSeasonId);
				return forkJoin([updateCustomer$, updateTeam$, of(customer.teamSettings), of(redirectUrl)]);
			}),
			map(([customer, currentTeam, teamSettings, redirectUrl]) =>
				AuthActions.updateSelectedTeamSuccess({ customer: { ...customer, teamSettings }, currentTeam, redirectUrl })
			),
			catchError(error => of(AuthActions.updateSelectedTeamFailure({ error })))
		)
	);

	updateSelectedTeamSuccess$: Observable<void> = createEffect(
		() =>
			this.actions$.pipe(
				ofType(AuthActions.updateSelectedTeamSuccess),
				map(({ customer, currentTeam, redirectUrl }) => {
					this.calendarService.downloadCalendar(customer.currentTeamId);
					this.notificationService.initNotifications(true);
					this.alertService.notify('success', 'home.settings', 'alert.settingsUpdated', false);
					const returnUrl = this.authService.getReturnUrl(currentTeam, redirectUrl as [IterproRoute, object]);
					this.router.navigate(returnUrl);
				})
			),
		{ dispatch: false }
	);

	loadTeamList$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.loadTeamList),
			withLatestFrom(this.store$.select(AuthSelectors.selectCustomer)),
			switchMap(([, customer]) => {
				this.calendarService.downloadCalendar(customer.currentTeamId);
				const teamList = getActiveTeams(customer.teamSettings);
				return this.teamApi
					.find({
						where: { id: { inq: teamList } },
						fields: ['id', 'name', 'accountType', 'enabledModules', 'wyscoutId', 'instatId', 'playerAttributes'], // TODO: add each time a new providerId
						include: [
							{
								relation: 'teamSeasons',
								scope: { fields: ['id', 'name', 'offseason', 'inseasonEnd'], order: 'offseason DESC' }
							},
							{
								relation: 'tests'
							}
						]
					})
					.pipe(
						map((teams: any[]) => AuthActions.loadTeamListSuccess({ teams: sortBy(teams, 'name') })),
						catchError(error => of(AuthActions.loadTeamListFailure({ error })))
					);
			})
		)
	);

	setActiveTeam$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.loadTeamListSuccess),
			withLatestFrom(this.store$.select(AuthSelectors.selectCustomer)),
			switchMap(([{ teams }, customer]) => {
				const team: SelectableTeam = teams.find(t => t.id === customer.currentTeamId) as SelectableTeam;
				const currentSeason = team.teamSeasons.find(({ offseason, inseasonEnd }) =>
					moment().isBetween(moment(offseason), moment(inseasonEnd))
				);
				const currentTeamSeasonId = currentSeason ? currentSeason.id : undefined;
				return this.authService
					.downloadTeam(team.id, currentTeamSeasonId)
					.pipe(
						switchMap((currentTeam: CurrentTeam) => [
							AuthActions.performUpdateTeam({ currentTeam }),
							AuthActions.loadChatAccess()
						])
					);
			})
		)
	);

	loadChatAccess$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.loadChatAccess),
			switchMap(() =>
				this.chatApi.isEnabled().pipe(
					map(canAccessChat => AuthActions.loadChatAccessSuccess({ canAccessChat })),
					catchError(error => of(AuthActions.loadChatAccessFailure({ error })))
				)
			)
		)
	);

	loadCurrentUser$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.loadCurrentUser),
			switchMap(() =>
				this.authService.getCustomer().pipe(
					map(currentUser => AuthActions.loadCurrentUserSuccess({ currentUser })),
					catchError(error => of(AuthActions.loadCurrentUserFailure({ error })))
				)
			)
		)
	);

	constructor(
		private readonly teamApi: TeamApi,
		private readonly actions$: Actions,
		private readonly store$: Store<AuthState>,
		private readonly authService: AuthService,
		private readonly router: Router,
		private readonly route: ActivatedRoute,
		private readonly translate: TranslateService,
		private readonly customerApi: CustomerApi,
		private readonly alertService: AlertService,
		private readonly calendarService: CalendarService,
		private readonly azureStorageService: AzureStorageService,
		private readonly notificationService: NotificationService,
		private readonly chatApi: ChatApi
	) {}
}
