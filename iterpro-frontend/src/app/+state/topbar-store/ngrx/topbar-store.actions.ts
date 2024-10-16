import { createAction, props } from '@ngrx/store';

export const setTopbarStatus = createAction(
	'[TopbarStore] set topbar visibility and mode status',
	props<{ visible: boolean }>()
);
