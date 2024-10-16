import { Injectable } from '@angular/core';
import { AuthSelectors, AuthService } from '@iterpro/shared/data-access/auth';
import {
	AuthResponse,
	PermissionsActions,
	PermissionsStoreService, IterproRoute
} from '@iterpro/shared/data-access/permissions';
import { Customer, CustomerTeamSettings, SDKStorage, Team } from '@iterpro/shared/data-access/sdk';
import {
	getTeamSettings,
	RoutingStateService,
	ThirdPartiesIntegrationCheckService
} from '@iterpro/shared/utils/common-utils';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { ROUTER_NAVIGATED, ROUTER_REQUEST, RouterNavigatedPayload } from '@ngrx/router-store';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { filter, map, withLatestFrom } from 'rxjs/operators';
import * as RootStoreActions from './root-store.actions';
import { RootStoreState } from './root-store.state';
import { SeasonStoreActions } from './season-store';
import { TopbarStoreActions, TopbarStoreSelectors } from './topbar-store';
import { Router } from '@angular/router';

@Injectable()
export class RootStoreEffects {
	constructor(
		private readonly router: Router,
		private readonly actions$: Actions,
		private readonly store$: Store<RootStoreState>,
		private readonly storageService: SDKStorage,
		private readonly authService: AuthService,
		private readonly permissionStoreService: PermissionsStoreService,
		private readonly thirdPartyService: ThirdPartiesIntegrationCheckService,
		private readonly routingStateService: RoutingStateService
	) {
		this.routingStateService.saveHistory();
	}

	changeTeamEffect$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(RootStoreActions.changeTeam),
				map(({ team }) => {
					if (team && team.teamSeasons) {
						const currentSeason = team.teamSeasons.find(season =>
							moment().isBetween(moment(season.offseason), moment(season.inseasonEnd), 'day', '[]')
						);

						return this.store$.dispatch(
							SeasonStoreActions.initSeasonStores({
								seasonStores: team.teamSeasons,
								current: currentSeason
							})
						);
					}
				})
			),
		{ dispatch: false }
	);

	changeRouteUrlEffect$ = createEffect(() =>
		this.actions$.pipe(
			ofType(ROUTER_NAVIGATED),
			map(({ payload }: { payload: RouterNavigatedPayload }) => {
				const { url } = payload.event;
				const visible = url.indexOf('login') < 0 && url.indexOf('guide') < 0;

				return TopbarStoreActions.setTopbarStatus({ visible });
			})
		)
	);

	permissionsGuardEffect$ = createEffect(() =>
		this.actions$.pipe(
			ofType(ROUTER_REQUEST),
			withLatestFrom(
				this.store$.select(AuthSelectors.selectCustomer),
				this.store$.select(AuthSelectors.selectTeam),
				this.store$.select(TopbarStoreSelectors.selectLandingPage)
			),
			filter(([_, customer, team]) => !!customer && !!team),
			map(
				([{ payload }, customer, team, landingPage]: [{ payload: RouterNavigatedPayload }, Customer, Team, string]) => {
					const { url } = payload.event;
					if (url === '/' || url === '') {
						this.router.navigate([landingPage]);
						return PermissionsActions.routeRequested({
							canAccess: true,
							error: null
						});
					}
					let response: AuthResponse = { response: true, error: null };
					if (!customer) return PermissionsActions.routeRequested({ canAccess: false, error: 'generic' });
					const currentTeamSettings: CustomerTeamSettings = getTeamSettings(customer.teamSettings, team.id);
					const canAccess = this.permissionStoreService.canAccessToRoute(url as IterproRoute, team.enabledModules, customer.admin, currentTeamSettings);
					if (!canAccess) {
						const returnUrl = this.authService.getReturnUrl({team, season: null});
						this.router.navigate(returnUrl);
					}
					return PermissionsActions.routeRequested({
						canAccess: response.response,
						error: response.error
					});
				}
			)
		)
	);
}
