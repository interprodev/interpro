import { Team } from '@iterpro/shared/data-access/sdk';
import { createAction, props } from '@ngrx/store';

export const changeTeam = createAction('[RootStore] change team', props<{ team: Team }>());
