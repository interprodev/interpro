import { inject, Pipe, PipeTransform } from '@angular/core';
import { CustomerTeamSettings, Team } from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';
import { GroupedPermissions, PermissionConstantService } from '@iterpro/shared/utils/common-utils';

@Pipe({
	standalone: true,
	name: 'teamPermissionsTooltip'
})
export class TeamPermissionsTooltipPipe implements PipeTransform {
	#translateService = inject(TranslateService);
	#permissionService = inject(PermissionConstantService);
	#groupedPermissions: GroupedPermissions[] = [];

	constructor() {
		this.#groupedPermissions = this.#permissionService.getGroupedPermissions();
	}

	transform(teamSettings: CustomerTeamSettings): string {
		const permissions = teamSettings?.permissions || [];

		return `<ul>${this.#groupedPermissions
			.map(
				(groupedPermission: GroupedPermissions) =>
					`<li><h4 style='text-transform: uppercase'>${this.#translateService.instant(`permissions.group.${groupedPermission.group}`)}</h4><ul>${groupedPermission.items
						.filter((permission: string) => permission !== groupedPermission.group && permissions.includes(permission))
						.map(
							(permission: string) => `<li>• ${this.#translateService.instant(`permissions.item.${permission}`)}</li>`
						)
						.join('')}</ul></li>`
			)
			.join('')}</ul>`;
	}
}
