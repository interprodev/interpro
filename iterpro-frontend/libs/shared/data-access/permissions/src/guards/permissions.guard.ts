import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanLoad, Route, Router, RouterStateSnapshot } from '@angular/router';
import { AlertService } from '@iterpro/shared/utils/common-utils';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { PermissionsSelectors } from '../+state';
import { PermissionsState } from '../+state/store-permissions.state';
import { PermissionError } from '../interfaces/store-permissions.interfaces';

@Injectable({
	providedIn: 'root'
})
export class PermissionsGuard implements CanActivate, CanLoad {
	constructor(private store$: Store<PermissionsState>, private alertService: AlertService, private router: Router) {}

	canLoad(route: Route): Observable<boolean> {
		return this.store$.pipe(
			select(PermissionsSelectors.selectPermission),
			first(),
			map(permissionResponse => {
				if (!permissionResponse.response) {
					this.performAllowedErrorActions('featureNotAvailable', route.path as string);
				}
				return permissionResponse.response;
			})
		);
	}

	canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
		const url: string = state.url;
		return this.store$.pipe(
			select(PermissionsSelectors.selectPermission),
			first(),
			map(permissionResponse => {
				if (!permissionResponse.response) {
					this.performAllowedErrorActions(permissionResponse.error, url);
				}
				return permissionResponse.response;
			})
		);
	}

	private performAllowedErrorActions(error: PermissionError, returnUrl: string) {
		const actions: any = {
			generic: () => this.alertService.notify('error', 'alert.authGuard.title', 'noPermissions', false),
			noCurrentTeam: () =>
				this.router.navigate(['/login'], {
					queryParams: { returnUrl }
				}),
			noThirdPartyTactical: () => this.router.navigate(['/settings?home=1']),
			noPermissions: () => this.alertService.notify('error', 'alert.authGuard.title', 'noPermissions', false),
			featureNotAvailable: () =>
				this.alertService.notify('error', 'alert.authGuard.title', 'featureNotAvailable', false)
		};

		if (error) actions[error]();
	}
}
