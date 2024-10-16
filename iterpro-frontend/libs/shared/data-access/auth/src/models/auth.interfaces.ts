import { SDKToken, Team, TeamSeason, Test } from '@iterpro/shared/data-access/sdk';

export interface Credentials {
	email: string;
	password: string;
	ttl?: number;
}

export interface Credentials2FA {
	email: string;
	password: string;
	code: string;
}

export interface CurrentTeam {
	team: Team;
	season: TeamSeason;
}

export interface GoogleAuthenticationResponse {
	qrCode: string;
	textCode: string;
}

export interface TwoFactorAuthToken {
	useTwoFactor?: boolean;
	userId: string;
}

export type SelectableTeam = Pick<
	Team,
	'id' | 'name' | 'accountType' | 'enabledModules' | 'wyscoutId' | 'instatId' | 'playerAttributes'
> & {
	teamSeasons: Array<Pick<TeamSeason, 'id' | 'name' | 'offseason' | 'inseasonEnd'>>;
	tests: Array<Test>;
};

export type UnknownToken = SDKToken | TwoFactorAuthToken;
export type LoginViewMode = 'login' | 'reset' | '2FAsetup' | '2FAlogin' | 'success';
