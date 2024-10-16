import { Injectable } from '@angular/core';
import { DrillApi, LoopBackAuth } from '@iterpro/shared/data-access/sdk';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { RootStoreState } from '../../root-store.state';
import * as DrillsProfileStoreActions from './drills-profile-store.actions';
import * as DrillsProfileStoreSelectors from './drills-profile-store.selectors';
import { DrillsProfileStore } from './drills-profile-store.state';

@Injectable()
export class DrillsProfileStoreEffects {
	getChartData$: Observable<Action> = createEffect(() => {
		return this.actions$.pipe(
			ofType(DrillsProfileStoreActions.selectedDrill),
			withLatestFrom(this.store$.select(DrillsProfileStoreSelectors.selectChartDataByID)),
			map(([{ selectedDrillId }, { chartData }]) =>
				!chartData
					? DrillsProfileStoreActions.performChartDataFromServer({ selectedDrillId })
					: DrillsProfileStoreActions.performChartDataSuccess({ chartData })
			)
		);
	});

	performChartDataFromServer$: Observable<Action> = createEffect(() => {
		return this.actions$.pipe(
			ofType(DrillsProfileStoreActions.performChartDataFromServer),
			switchMap(({ selectedDrillId }) =>
				this.drillApi
					.getDrillProfile(selectedDrillId, this.auth.getCurrentUserData().currentTeamId, this.auth.getCurrentUserId())
					.pipe(
						map((res: any) => {
							const chartData: DrillsProfileStore = res;
							return DrillsProfileStoreActions.performChartDataSuccess({ chartData });
						}),
						catchError(error => of(DrillsProfileStoreActions.performChartDataFailure({ error })))
					)
			)
		);
	});

	constructor(
		private actions$: Actions,
		private store$: Store<RootStoreState>,
		private drillApi: DrillApi,
		private auth: LoopBackAuth
	) {}
}
