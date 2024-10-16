import { createAction, props } from '@ngrx/store';
import { SeasonStore } from './season-store.model';

export const initSeasonStores = createAction(
	'[SeasonStore/API] Init SeasonStores and current',
	props<{ current: SeasonStore; seasonStores: SeasonStore[] }>()
);

export const performSeasonSelection = createAction(
	'[SeasonStore/API] Perform Season Selection',
	props<{ selected: SeasonStore }>()
);

export const resetSeasonSelection = createAction('[SeasonStore/API] Reset Season Selection');
