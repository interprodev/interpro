import { SDKToken, TeamSeason, Test } from '@iterpro/shared/data-access/sdk';
import { Action, createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { AuthState, initialState } from './auth.state';

// TODO: currentSeason should be a selector as it derives from currentTeam.teamSeasons
// (at the moment is accessed by others services so I leave it here)

// there are two issues with localStorage sync:
// - it replaces the initialState COMPLETELY;
// - it doesn't cast types properly (eg: booleans stored as "true" or "false")
// The workaround is to merge the initialState (default) with the deserialized synced state in the "init feature action"
const authReducer = createReducer(
	initialState,
	on(
		AuthActions.initLoginStores,
		AuthActions.clearAuthSuccess,
		AuthActions.performLogoutSuccess,
		AuthActions.cancelTwoFactorAuthentication,
		(): AuthState => initialState
	),
	on(AuthActions.performLogout, (state, { expired }): AuthState => ({ ...state, isLoading: true, expired })),
	on(AuthActions.performLogin, (state): AuthState => ({ ...state, error: undefined, isLoading: true })),
	on(
		AuthActions.performLoginSetToken,
		(state, { token }): AuthState => ({ ...state, token: { ...state.token, ...token } })
	),
	on(
		AuthActions.performLoginSetCustomer,
		AuthActions.performUpdateCustomer,
		AuthActions.updateSelectedTeamSuccess,
		(state, { customer }): AuthState => ({
			...state,
			token: {
				id: state.token?.id,
				rememberMe: state.token?.rememberMe as boolean,
				created: state.token?.created,
				scopes: state.token?.scopes,
				ttl: state.token?.ttl as number,
				user: customer,
				userId: customer.id
			}
		})
	),
	on(
		AuthActions.performPatchCustomer,
		(state, { customer }): AuthState => ({
			...state,
			token: {
				...(state.token as SDKToken),
				user: {
					...state.token?.user,
					...customer
				}
			}
		})
	),
	on(
		AuthActions.performLoginSetSasTokenKey,
		AuthActions.performUpdateSasToken,
		(state, { sasTokenKey }): AuthState => ({ ...state, sasTokenKey })
	),
	on(
		AuthActions.performLoginTeamRequestSuccess,
		AuthActions.performUpdateTeam,
		AuthActions.updateSelectedTeamSuccess,
		(state, { currentTeam }): AuthState => ({
			...state,
			currentTeam: currentTeam.team,
			currentSeason: currentTeam.season
		})
	),
	// partial update of the current team
	on(AuthActions.performPatchTeam, (state, { teamId, team }): AuthState => {
		if (!state.currentTeam?.id) {
			return state;
		}
		return {
			...state,
			currentTeam: state.currentTeam.id === teamId ? { ...state.currentTeam, ...team } : { ...state.currentTeam },
			// only update the fields changed
			teamList: state.teamList.map(t =>
				t.id === team.id
					? {
							id: team.id,
							name: team.name as string,
							accountType: team.accountType as string,
							enabledModules: team.enabledModules,
							wyscoutId: team?.wyscoutId as number,
							instatId: team?.instatId as number,
							playerAttributes: team.playerAttributes as any[],
							customersLimit: team.customersLimit as number,
							teamSeasons: team.teamSeasons as TeamSeason[],
							tests: team.tests as Test[]
						}
					: t
			)
		};
	}),
	on(AuthActions.performLoginSuccess, (state): AuthState => ({ ...state, isLoading: false, viewMode: 'success' })),
	on(
		AuthActions.performLoginFailure,
		AuthActions.performPasswordRecoveryFailure,
		(state, { error }): AuthState => ({ ...state, error, isLoading: false })
	),
	on(AuthActions.performLoginMessage, (state, { message }): AuthState => ({ ...state, message })),
	on(AuthActions.changeViewModeToLogin, (state): AuthState => ({ ...state, viewMode: 'login' })),
	on(AuthActions.changeViewModeToReset, (state): AuthState => ({ ...state, viewMode: 'reset' })),
	on(
		AuthActions.setupTwoFactorAuthentication,
		(state, { twoFactorToken }): AuthState => ({ ...state, twoFactorToken, setupTwoFactorAuthentication: true })
	),
	on(
		AuthActions.setGoogleSetupResponse,
		(state, { googleResponse }): AuthState => ({
			...state,
			qrCode: googleResponse.qrCode,
			textCode: googleResponse.textCode,
			viewMode: '2FAsetup',
			isLoading: false
		})
	),
	on(
		AuthActions.requireTwoFactorAuthentication,
		(state): AuthState => ({ ...state, viewMode: '2FAlogin', isLoading: false })
	),
	on(
		AuthActions.performTwoFactorAuthenticationLogin,
		AuthActions.validateTwoFactorAuthenticationSetupCode,
		(state): AuthState => ({ ...state, isLoading: true })
	),
	on(AuthActions.loadTeamList, (state): AuthState => ({ ...state, isLoading: true })),
	on(
		AuthActions.loadTeamListSuccess,
		(state, { teams }): AuthState => ({
			...state,
			teamList: teams,
			isLoading: false
		})
	),
	on(AuthActions.loadTeamListFailure, (state, { error }): AuthState => ({ ...state, error, isLoading: false })),
	on(AuthActions.loadChatAccessSuccess, (state, { canAccessChat }): AuthState => ({ ...state, canAccessChat })),
	on(
		AuthActions.loadCurrentUserSuccess,
		(state, { currentUser }): AuthState => ({
			...state,
			token: {
				...state.token,
				id: state.token?.id,
				rememberMe: state.token?.rememberMe as boolean,
				created: state.token?.created,
				scopes: state.token?.scopes,
				ttl: state.token?.ttl as number,
				user: currentUser,
				userId: currentUser.id
			}
		})
	)
);

export function reducer(state: AuthState | undefined, action: Action) {
	return authReducer(state, action);
}
