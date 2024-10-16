import { Injectable } from '@angular/core';
import { CustomerTeamSettings, Team } from '@iterpro/shared/data-access/sdk';
import {
	AuthResponse,
} from '../interfaces/store-permissions.interfaces';
import { SelectableTeam } from '@iterpro/shared/data-access/auth';
import { ROUTE_SETTINGS } from '../consts/route-settings.const';
import { IterproTeamModule } from '../interfaces/iterpro-team-modules.interface';
import { IterproUserPermission } from '../interfaces/iterpro-user-permissions.interface';
import { IterproRoute } from '../interfaces/iterpro-routes.interface';

@Injectable({
	providedIn: 'root'
})
export class PermissionsStoreService {

	canAccessToRoute(route: IterproRoute, teamModules: IterproTeamModule[], isAdmin: boolean, { permissions: userPermissions }: CustomerTeamSettings): boolean {
		// Normalize the route by removing parameters and query strings
		const normalizedRoute = route.replace('/home', '').split(/[;?]/)[0] as IterproRoute;
		const routeSettings = ROUTE_SETTINGS[normalizedRoute];
		if (!routeSettings) return true;
		if (routeSettings.teamModules.some(module => !teamModules.includes(module))) return false;
		if (routeSettings.onlyAdmin && !isAdmin) return false;
		if (isAdmin) return true;
		if (routeSettings.userPermission.some(permission => !userPermissions.includes(permission))) return false;
		return true;
	}

	userHasPermissions(permission: IterproUserPermission, isAdmin: boolean, { permissions: userPermissions }: CustomerTeamSettings): AuthResponse {
		if (isAdmin || userPermissions.includes(permission)) {
			return { response: true, error: null };
		}
		return { response: false, error: 'noPermissions' };
	}

	teamHasModule(module: IterproTeamModule, team: Team): AuthResponse {
		if (this.isModuleEnabled(team, module)) {
			return { response: true, error: null };
		}
		return { response: false, error: 'featureNotAvailable' };
	}

	isModuleEnabled(team: Team | SelectableTeam, module: IterproTeamModule): boolean {
		return !!team && !!team.enabledModules && team.enabledModules.includes(module);
	}
}


