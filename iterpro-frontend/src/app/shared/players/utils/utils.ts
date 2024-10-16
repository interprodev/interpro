import { createFeatureSelector, createSelector, select } from '@ngrx/store';
import { ADMIN_FILTERS_STORE_KEY } from '@app/_root-store/filters-store';
import { FiltersState } from '@app/_root-store/filters-store/filters.reducer';
import { PLAYERS_STORE_KEY } from '@app/_root-store/players-store';
import { PlayersState } from '@app/_root-store/players-store/players.reducer';

export const selectPlayers = createFeatureSelector<PlayersState>(PLAYERS_STORE_KEY);
export const selectFilters = createFeatureSelector<FiltersState>(ADMIN_FILTERS_STORE_KEY);

export const selectFilteredPlayers = createSelector(
	selectPlayers,
	selectFilters,
	(playersState: PlayersState, filtersState: FiltersState) => {
		return { playersState, filtersState };
	}
);
