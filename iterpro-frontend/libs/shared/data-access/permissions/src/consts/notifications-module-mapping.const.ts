import { IterproUserPermission } from '@iterpro/shared/data-access/permissions';
import { IterproOrgType } from '../interfaces/iterpro-org-type.interface';

export type NotificationModuleMapping = {
	[key in string]: {
		modules: IterproUserPermission[];
		onlyOrgType: IterproOrgType[];
		relation: 'and' | 'or';
	};
};
