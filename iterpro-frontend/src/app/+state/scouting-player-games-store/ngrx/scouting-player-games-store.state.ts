import { Customer, ScoutingGameWithReport, ScoutingSettings } from '@iterpro/shared/data-access/sdk';
import { getId } from '@iterpro/shared/utils/common-utils';
import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import { PlayerScoutingInfo } from '../interfaces/scouting-player-games-store.interfaces';

export const scoutingGamesFeatureKey = 'scoutingGames';

export interface State extends EntityState<ScoutingGameWithReport> {
	currentTeamId: string;
	playerInfo: PlayerScoutingInfo;
	loading: boolean;
	settings: ScoutingSettings;
	customers: Customer[];
	error: any;
}

export const adapter: EntityAdapter<ScoutingGameWithReport> = createEntityAdapter<ScoutingGameWithReport>({
	selectId: getId
});

export const initialState: State = adapter.getInitialState({
	currentTeamId: undefined,
	playerInfo: undefined,
	loading: false,
	settings: undefined,
	customers: [],
	error: undefined
});
