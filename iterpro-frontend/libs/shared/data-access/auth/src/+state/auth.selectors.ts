import { Club, Customer, SDKToken, Team, TeamSeason } from '@iterpro/shared/data-access/sdk';
import { CurrencyType } from '@iterpro/shared/utils/common-utils';
import { MemoizedSelector, createFeatureSelector, createSelector } from '@ngrx/store';
import * as moment from 'moment';
import { LoginViewMode, SelectableTeam, TwoFactorAuthToken } from '../models/auth.interfaces';
import { AuthState, authStoreFeatureKey } from './auth.state';
import { IterproOrgType } from '@iterpro/shared/data-access/permissions';

// GETTERS
const getError = (state: AuthState): any => state.error;
const getMessage = (state: AuthState): any => state.message;
const getIsLoading = (state: AuthState): boolean => state.isLoading;
const getToken = (state: AuthState): SDKToken | undefined => state?.token;
const getTwoFactorAuthToken = (state: AuthState): TwoFactorAuthToken | undefined => state.twoFactorToken;
const getTeam = (state: AuthState): Team | undefined => state.currentTeam;
const getTeamSeason = (state: AuthState): TeamSeason | undefined => state.currentSeason;
const getTeamList = (state: AuthState): SelectableTeam[] => state.teamList;
const getCustomer = (state: AuthState): Customer => (state.token ? state.token.user : undefined);
const getViewMode = (state: AuthState): LoginViewMode => state.viewMode;
const getSetupTwoFactorAuthentication = (state: AuthState): boolean => state.setupTwoFactorAuthentication;
const getQrCode = (state: AuthState): string | undefined =>
	state.qrCode && state.qrCode.length > 0 ? state.qrCode : undefined;
const getTextCode = (state: AuthState): string | undefined =>
	state.textCode && state.textCode.length > 0 ? state.textCode : undefined;
const getCanAccessChat = (state: AuthState): boolean => state.canAccessChat;

// SELECTORS
export const selectState: MemoizedSelector<object, AuthState> = createFeatureSelector<AuthState>(authStoreFeatureKey);
export const selectError: MemoizedSelector<object, any> = createSelector(selectState, getError);
export const selectMessage: MemoizedSelector<object, any> = createSelector(selectState, getMessage);
export const selectIsLoading: MemoizedSelector<object, boolean> = createSelector(selectState, getIsLoading);
export const selectToken: MemoizedSelector<object, SDKToken | undefined> = createSelector(selectState, getToken);
export const selectTwoFactorAuthToken: MemoizedSelector<object, TwoFactorAuthToken | undefined> = createSelector(
	selectState,
	getTwoFactorAuthToken
);
export const selectTeam: MemoizedSelector<object, Team | undefined> = createSelector(selectState, getTeam);
export const selectTeamSeason: MemoizedSelector<object, TeamSeason | undefined> = createSelector(
	selectState,
	getTeamSeason
);
export const selectTeamList: MemoizedSelector<object, SelectableTeam[]> = createSelector(selectState, getTeamList);
export const selectCustomer: MemoizedSelector<object, Customer> = createSelector(selectState, getCustomer);
export const selectViewMode: MemoizedSelector<object, LoginViewMode> = createSelector(selectState, getViewMode);
export const selectQrCode: MemoizedSelector<object, string | undefined> = createSelector(selectState, getQrCode);
export const selectTextCode: MemoizedSelector<object, string | undefined> = createSelector(selectState, getTextCode);
export const selectSetupTwoFactorAuthentication: MemoizedSelector<object, boolean> = createSelector(
	selectState,
	getSetupTwoFactorAuthentication
);
export const selectCurrentTeamId: MemoizedSelector<object, string | undefined> = createSelector(
	selectCustomer,
	customer => (customer ? customer.currentTeamId : undefined)
);
export const selectCurrentSelectableTeam: MemoizedSelector<object, SelectableTeam | undefined> = createSelector(
	selectTeamList,
	selectCurrentTeamId,
	(teams, currentTeamId) => (teams || []).find(team => team.id === currentTeamId)
);
export const selectCurrentTeam: MemoizedSelector<object, Team | undefined> = createSelector(
	selectTeam,
	(team: Team | undefined) => team
);

export const selectClub: MemoizedSelector<object, Club | undefined> = createSelector(selectTeam, team =>
	team ? team.club : undefined
);
export const selectIsNationalClub: MemoizedSelector<object, boolean | undefined> = createSelector(selectClub, club =>
	club ? club.nationalClub : undefined
);
export const selectSportType: MemoizedSelector<object, string | undefined> = createSelector(selectClub, club =>
	club ? club.sportType : undefined
);
export const selectOrganizationType: MemoizedSelector<object, IterproOrgType | undefined> = createSelector(
	selectClub,
	club => (club ? (club.type as IterproOrgType) : undefined)
);
export const selectCanAccessChat: MemoizedSelector<object, boolean> = createSelector(selectState, getCanAccessChat);

export const selectExpiringDays: MemoizedSelector<object, number | null> = createSelector(selectClub, club =>
	club?.expiryDate ? moment(club.expiryDate).diff(moment(), 'days') : null
);
export const selectIsExpiring: MemoizedSelector<object, boolean> = createSelector(selectExpiringDays, days =>
	days ? days <= 28 : false
);

/** Club Info */
export const selectClubCurrencyCode = createSelector(
	selectTeam,
	team => (team?.club.currency as CurrencyType) || 'EUR'
);
export const selectCurrentClub = createSelector(selectCustomer, customer => customer?.club);
