import { SideMenu } from '@iterpro/shared/ui/components';
import { IterproOrgType, IterproTeamModule, IterproUserPermission } from '@iterpro/shared/data-access/permissions';

export interface SettingSideMenu extends SideMenu {
	teamModules: IterproTeamModule[];
	onlyAdmin: boolean;
	onlyWithPermissions: IterproUserPermission[];
	onlyOrgType: IterproOrgType[];
	items?: SettingSideMenu[];
}
