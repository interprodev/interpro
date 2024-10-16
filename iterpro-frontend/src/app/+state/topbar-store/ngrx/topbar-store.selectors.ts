import { AuthSelectors, SelectableTeam } from '@iterpro/shared/data-access/auth';
import { Customer, CustomerTeamSettings } from '@iterpro/shared/data-access/sdk';
import { MemoizedSelector, createFeatureSelector, createSelector } from '@ngrx/store';
import * as RootStoreSelectors from '../../root-store.selectors';
import { topbarStoreFeatureKey } from './topbar-store.reducer';
import { TopbarState } from './topbar-store.state';
import { selectTeam } from '../../../../../libs/shared/data-access/auth/src/+state/auth.selectors';
import { getTeamSettings } from '@iterpro/shared/utils/common-utils';

// GETTERS
const getVisible = (state: TopbarState): boolean => state.visible;

// SELECTORS
export const selectTopbarState: MemoizedSelector<object, TopbarState> =
	createFeatureSelector<TopbarState>(topbarStoreFeatureKey);
export const selectVisible: MemoizedSelector<object, boolean> = createSelector(selectTopbarState, getVisible);

// ADVANCED SELECTORS
export const selectCurrentTeamAccountType: MemoizedSelector<object, string> = createSelector(
	AuthSelectors.selectCurrentSelectableTeam,
	currentTeam => (currentTeam ? currentTeam.accountType : null)
);

export const selectViewAllowed: MemoizedSelector<object, (path: string) => boolean> = createSelector(
	RootStoreSelectors.selectCustomer,
	customer => (path: string) => {
		const teamId = customer.currentTeamId;
		const teamSettings = getTeamSettings(customer.teamSettings, teamId);
		return customer.admin || (teamSettings && teamSettings.permissions.includes(path));
	}
);
export const selectDashboardAllowed: MemoizedSelector<object, boolean> = createSelector(
	AuthSelectors.selectIsNationalClub,
	RootStoreSelectors.selectCustomer,
	AuthSelectors.selectCurrentSelectableTeam,
	// The standings dashboard should not be seen:
	// - is a National Club (temporary till new standing dasboard is done)
	// - for the first time login customer
	// - has no wyscout/instatId id associated
	(isNationalClub, customer, currentTeam) =>
		!isNationalClub && isStandingsEnabledForCustomer(customer) && isStandingsEnabledForTeam(currentTeam)
);

export const selectLandingPage: MemoizedSelector<object, string> = createSelector(
	selectTeam,
	RootStoreSelectors.selectCustomer,
	(team, customer) => {
		if (!customer) return undefined;
		const teamSettings = getTeamSettings(customer.teamSettings, customer.currentTeamId);
		if (teamSettings?.landingPage) {
			return teamSettings.landingPage;
		}
		if (team?.landingPage) {
			return team.landingPage;
		}
		if (team?.club?.landingPage) {
			return team.club.landingPage;
		}
		return undefined;
	}
);

// UTILS
const isStandingsEnabledForCustomer = (customer: Customer) => {
	return customer && !customer.isTempPassword;
};

const isStandingsEnabledForTeam = (currentTeam: SelectableTeam) => {
	return (
		!!currentTeam &&
		(currentTeam.enabledModules || []).includes('standings') &&
		(!!currentTeam.wyscoutId || !!currentTeam.instatId)
	);
};
