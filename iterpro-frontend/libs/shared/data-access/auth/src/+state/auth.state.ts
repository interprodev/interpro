import { Customer, SDKToken, Team, TeamSeason } from '@iterpro/shared/data-access/sdk';
import { Message } from 'primeng/api';
import { LoginViewMode, SelectableTeam, TwoFactorAuthToken } from '../models/auth.interfaces';

export const authStoreFeatureKey = 'authStore';
export const authStoreLocalStorageSyncKeys = ['token', 'sasTokenKey', 'currentTeam', 'currentSeason'];

export interface AuthState {
	/** Tokens */
	readonly twoFactorToken?: TwoFactorAuthToken | undefined;
	readonly token?: SDKToken | undefined;
	readonly sasTokenKey: any | undefined;

	/** Current User */
	readonly currentUser: Customer | null;

	/** Team and Club Info */
	readonly currentTeam?: Team | undefined;
	readonly currentSeason?: TeamSeason | undefined;
	readonly teamList: SelectableTeam[];
	readonly canAccessChat: boolean;
	readonly message?: Message | null;

	/** Login UI Logic | TODO: move into separate store (Login) */
	readonly viewMode: LoginViewMode;
	readonly setupTwoFactorAuthentication: boolean;
	readonly qrCode: string;
	readonly textCode: string;
	readonly expired: boolean | undefined;

	/** UI */
	readonly isLoading: boolean;
	readonly error?: string | undefined;
}

export const initialState: AuthState = {
	currentUser: null,
	twoFactorToken: undefined,
	token: undefined,
	sasTokenKey: undefined,
	currentTeam: undefined,
	currentSeason: undefined,
	isLoading: false,
	error: undefined,
	message: null,
	viewMode: 'login',
	setupTwoFactorAuthentication: false,
	qrCode: '',
	textCode: '',
	expired: false,
	teamList: [],
	canAccessChat: false
};
