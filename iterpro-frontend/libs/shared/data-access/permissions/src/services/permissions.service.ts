import { Injectable, inject } from '@angular/core';
import { Customer, CustomerTeamSettings, LoopBackAuth, Team } from '@iterpro/shared/data-access/sdk';
import { AuthResponse} from '../interfaces/store-permissions.interfaces';
import { PermissionsStoreService } from './store-permissions.service';
import { getTeamSettings } from '@iterpro/shared/utils/common-utils';
import { IterproUserPermission } from '../interfaces/iterpro-user-permissions.interface';
import { IterproTeamModule } from '../interfaces/iterpro-team-modules.interface';
import { IterproRoute } from '../interfaces/iterpro-routes.interface';

@Injectable({
	providedIn: 'root'
})
export class PermissionsService {
	readonly #authService = inject(LoopBackAuth);
	readonly #permissionStoreService = inject(PermissionsStoreService);

	canAccessToRoute(url: IterproRoute, currentTeam: Team): boolean {
		const customer: Customer = this.#authService.getCurrentUserData();
		if (!customer) return false;
		const currentTeamSettings: CustomerTeamSettings = getTeamSettings(customer.teamSettings, currentTeam.id) as CustomerTeamSettings;
		return this.#permissionStoreService.canAccessToRoute(url, currentTeam.enabledModules, customer.admin, currentTeamSettings);
	}

	canUserAccessToModule(permission: IterproUserPermission, team: Team, customer = this.#authService.getCurrentUserData()): AuthResponse {
		if (!customer) return { response: false, error: 'generic' };
		const currentTeamSettings: CustomerTeamSettings = getTeamSettings((customer?.teamSettings || []), team.id) as CustomerTeamSettings;
		return this.#permissionStoreService.userHasPermissions(permission, customer.admin, currentTeamSettings);
	}

	canTeamAccessToModule(module: IterproTeamModule, team: Team): AuthResponse {
		return this.#permissionStoreService.teamHasModule(module, team);
	}

	getUserAvailableTeamIdsByPermissions(permission: IterproUserPermission, isAdmin: boolean, teamSettings: CustomerTeamSettings[]): string[] {
		return teamSettings.filter(item => this.#permissionStoreService.userHasPermissions(permission, isAdmin, item).response)
			.map(({ teamId }) => teamId);
	}

	isCustomerAdmin(): boolean {
		return this.#authService.getCurrentUserData().admin;
	}
}
