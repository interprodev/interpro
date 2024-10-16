import { Customer, SDKToken, Team } from '@iterpro/shared/data-access/sdk';
import { createAction, props } from '@ngrx/store';
import { Message } from 'primeng/api';
import {
	Credentials,
	Credentials2FA,
	CurrentTeam,
	GoogleAuthenticationResponse,
	SelectableTeam,
	TwoFactorAuthToken
} from '../models/auth.interfaces';

export const initLoginStores = createAction('[AuthStore] Init Login Page');
export const changeViewModeToLogin = createAction('[AuthStore] Show Login View');
export const changeViewModeToReset = createAction('[AuthStore] Show Reset Password View');

// Clear Auth
export const clearAuth = createAction('[LoginStore] Clear Auth');
export const clearAuthSuccess = createAction('[LoginStore] Clear Auth Success');

// password recovery
export const performPasswordRecovery = createAction(
	'[AuthStore] Perform Password Recovery',
	props<{ email: string }>()
);
export const performPasswordRecoverySuccess = createAction('[AuthStore] Perform Password Recovery Success');

export const loadCurrentUser = createAction('[AuthStore] Load Current User');
export const loadCurrentUserSuccess = createAction(
	'[AuthStore] Load Current User Success',
	props<{ currentUser: Customer }>()
);
export const loadCurrentUserFailure = createAction('[AuthStore] Load Current User Failure', props<{ error: any }>());

// login
export const performLogin = createAction('[AuthStore] Perform Login', props<{ credentials: Credentials }>());
export const performLoginSetToken = createAction(
	'[AuthStore] Perform Login: set token',
	props<{ token: SDKToken; changePassword?: boolean }>()
);
export const performLoginSetCustomer = createAction(
	'[AuthStore] Perform Login: set customer',
	props<{ customer: Customer }>()
);
export const performLoginSetSasTokenKey = createAction(
	'[AuthStore] Perform Login: set sas token',
	props<{ sasTokenKey: any }>()
);
export const performLoginTeamRequestSuccess = createAction(
	'[AuthStore] Perform Login: Team Request Success',
	props<{ currentTeam: CurrentTeam }>()
);
export const performLoginSuccess = createAction(
	'[AuthStore] Perform Login Success',
	props<{ returnUrl: [string, object] }>()
);

// 2FA login
export const requireTwoFactorAuthentication = createAction('[AuthStore] Require Two Factor Authentication');
export const performTwoFactorAuthenticationLogin = createAction(
	'[AuthStore] Validate 2AF login code',
	props<{ credentials: Credentials2FA }>()
);
export const cancelTwoFactorAuthentication = createAction('[AuthStore] Cancel 2AF code validation');

// logout
export const performLogout = createAction('[AuthStore] Perform Logout', props<{ expired?: boolean }>());

// export const tokenExpired = createAction('[AuthStore] Token has expired');
export const performLogoutSuccess = createAction('[AuthStore] Perform Logout Success', props<{ expired?: boolean }>());

// 2FA setup
export const setupTwoFactorAuthentication = createAction(
	'[AuthStore] Setup Two Factor Authentication',
	props<{ twoFactorToken: TwoFactorAuthToken }>()
);
export const enableTwoFactorAuthentication = createAction('[AuthStore] Enable Two Factor Authentication');
export const setGoogleSetupResponse = createAction(
	'[AuthStore]  Google Response to activate Two Factor Authentication',
	props<{ googleResponse: GoogleAuthenticationResponse }>()
);
export const validateTwoFactorAuthenticationSetupCode = createAction(
	'[AuthStore] Validate 2AF setup code',
	props<{ credentials: Credentials2FA }>()
);

// Errors
export const performLoginFailure = createAction('[AuthStore] Perform Login Failure', props<{ error: any }>());
export const performPasswordRecoveryFailure = createAction(
	'[AuthStore] Perform Recovery Password Failure',
	props<{ error: any }>()
);
// Messages
export const performLoginMessage = createAction(
	'[AuthStore] Perform Login Message',
	props<{ message: Message | null }>()
);

// updates
export const performUpdateCustomer = createAction('[AuthStore] Update Customer', props<{ customer: Customer }>());
export const performPatchCustomer = createAction('[AuthStore] Patch Customer', props<{ customer: Partial<Customer> }>());
export const performUpdateTeam = createAction('[AuthStore] Update Team', props<{ currentTeam: CurrentTeam }>());
export const performPatchTeam = createAction('[AuthStore] Patch Team', props<{ teamId: string; team: Partial<Team> }>());
export const performUpdateSasToken = createAction('[AuthStore] Update SaS token', props<{ sasTokenKey: any }>());

// update team
export const updateSelectedTeam = createAction(
	'[AuthStore] Update Selected Team',
	props<{ teamId: string; redirectUrl?: [string, object?] }>()
);
export const updateSelectedTeamSuccess = createAction(
	'[AuthStore] Update Selected Team Success',
	props<{ customer: Customer; currentTeam: CurrentTeam; redirectUrl?: [string, object?] }>()
);
export const updateSelectedTeamFailure = createAction(
	'[AuthStore] Update Selected Team Failure',
	props<{ error: any }>()
);
export const loadTeamList = createAction('[AuthStore] load active teams');
export const loadTeamListSuccess = createAction(
	'[AuthStore] Load Active Teams Success',
	props<{ teams: SelectableTeam[] }>()
);
export const loadTeamListFailure = createAction('[AuthStore] Load Active Teams Failure', props<{ error: any }>());

// Chat
export const loadChatAccess = createAction('[AuthStore] Load Chat Access');
export const loadChatAccessSuccess = createAction(
	'[AuthStore] Load Chat Access Success',
	props<{ canAccessChat: boolean }>()
);
export const loadChatAccessFailure = createAction('[AuthStore] Load Chat Access Failure', props<{ error: any }>());
