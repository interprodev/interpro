import { TeamSeason } from '@iterpro/shared/data-access/sdk';
import { sortByDateDesc } from '@iterpro/shared/utils/common-utils';
import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';
import { seasonStoresFeatureKey, selectAll } from './season-store.reducer';
import { State } from './season-store.state';

// Getters
const getCurrent = (state: State): TeamSeason => state.current;
const getSelected = (state: State): TeamSeason => state.selected;

// Selectors
export const selectState: MemoizedSelector<object, State> = createFeatureSelector<State>(seasonStoresFeatureKey);
export const selectCurrent: MemoizedSelector<object, TeamSeason> = createSelector(selectState, getCurrent);
export const selectSelected: MemoizedSelector<object, TeamSeason> = createSelector(selectState, getSelected);
export const selectAllSeasons: MemoizedSelector<object, TeamSeason[]> = createSelector(selectState, selectAll);
export const selectAllSeasonsDescOrder: MemoizedSelector<object, TeamSeason[]> = createSelector(
	selectAllSeasons,
	teamSeasons => sortByDateDesc(teamSeasons, 'inseasonEnd')
);
export const selectDefault: MemoizedSelector<object, TeamSeason> = createSelector(
	selectSelected,
	selectCurrent,
	(selected, current) => selected || current
);
