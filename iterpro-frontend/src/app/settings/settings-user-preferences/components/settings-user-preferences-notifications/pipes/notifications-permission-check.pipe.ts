import { inject, Pipe, PipeTransform } from '@angular/core';
import {
	AuthResponse, IterproOrgType,
	IterproUserPermission,
	notificationModuleMapping,
	PermissionsService
} from '@iterpro/shared/data-access/permissions';
import { Club, Customer, Team } from '@iterpro/shared/data-access/sdk';

@Pipe({
	name: 'notificationPermissionCheck',
	standalone: true
})
export class NotificationPermissionCheckPipe implements PipeTransform {
	readonly #permissionsService = inject(PermissionsService);

	transform(
		notification: string,
		team: Team,
		club: Club,
		customer?: Customer
	): { visible: boolean; enabled: AuthResponse } {
		const { modules = [], relation = 'or', onlyOrgType = [] } = notificationModuleMapping[notification];
		const visible = onlyOrgType.length === 0 || onlyOrgType.includes(<IterproOrgType>club.type);
		const responses = modules.map(module => this.canAccessToModule(module, team, customer));
		const reduced = responses.reduce(
			(a: AuthResponse, b: AuthResponse) => ({
				response: relation === 'or' ? a.response || b.response : a.response && b.response,
				error: relation === 'or' ? (!b.error ? b.error : a.error) : b.error ? b.error : a.error
			}),
			responses[0]
		);
		return { visible, enabled: reduced };
	}

	private canAccessToModule(module: IterproUserPermission, team: Team, customer?: Customer): AuthResponse {
		return this.#permissionsService.canUserAccessToModule(module, team, customer);
	}
}
