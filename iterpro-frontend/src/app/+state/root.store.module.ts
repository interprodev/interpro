import { NgModule } from '@angular/core';
import { environment } from '@iterpro/config';
import { AuthModule } from '@iterpro/shared/data-access/auth';
import { PermissionsStoreModule } from '@iterpro/shared/data-access/permissions';
import { NGRX_MAX_ACTIONS_HISTORY } from '@iterpro/shared/utils/common-utils';
import { EffectsModule } from '@ngrx/effects';
import { RouterState, StoreRouterConnectingModule } from '@ngrx/router-store';
import { ActionReducer, MetaReducer, StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { localStorageSync } from 'ngrx-store-localstorage';
import { AttendancesStoreModule } from './attendances-store';
import { CashFlowStoreModule } from './cash-flow-store';
import { DrillsProfileStoreModule } from './drills-profile-store';
import { EventViewerStoreModule } from './event-viewer-store';
import { ImportStoreModule } from './import-store';
import { RootStoreEffects } from './root-store.effects';
import { RouteStoreModule } from './route-store';
import { ScoutingGameModule } from './scouting-player-games-store';
import { SeasonStoreModule } from './season-store';
import { TopbarStoreModule } from './topbar-store';

export function localStorageSyncReducer(reducer: ActionReducer<any>): ActionReducer<any> {
	return localStorageSync({
		keys: [{ authStore: ['token', 'sasTokenKey', 'currentTeam', 'currentSeason'] }],
		rehydrate: true
	})(reducer);
}
const metaReducers: Array<MetaReducer<any, any>> = [localStorageSyncReducer];

@NgModule({
	declarations: [],
	imports: [
		StoreModule.forRoot(
			{},
			{
				metaReducers,
				runtimeChecks: {
					strictStateImmutability: true,
					strictActionImmutability: true
				}
			}
		),
		EffectsModule.forRoot([RootStoreEffects]),
		AuthModule,
		TopbarStoreModule,
		SeasonStoreModule,
		RouteStoreModule,
		PermissionsStoreModule,
		EventViewerStoreModule,
		ImportStoreModule,
		AttendancesStoreModule,
		DrillsProfileStoreModule,
		CashFlowStoreModule,
		ScoutingGameModule,

		StoreRouterConnectingModule.forRoot({ routerState: RouterState.Minimal }),
		!environment.production
			? StoreDevtoolsModule.instrument({ maxAge: NGRX_MAX_ACTIONS_HISTORY, connectInZone: true })
			: []
	]
})
export class RootStoreModule {}
