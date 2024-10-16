import { CustomerTeamSettings } from '@iterpro/shared/data-access/sdk';
import { FormControl } from '@angular/forms';
import { SelectItem, SelectItemGroup } from 'primeng/api';
import {
	AccountManagementUserPermission
} from '../../settings-account-management-users-permissions/models/settings-user-permissions.type';
import { IterproUserPermission } from '@iterpro/shared/data-access/permissions';

export type CustomerTeamSettingEdit = Pick<CustomerTeamSettings, 'id' | 'position' | 'permissions' | 'mobilePermissions'>;
export type CustomerTeamSettingEditForm = {
	position: FormControl<string>;
	permissions: FormControl<IterproUserPermission[]>;
	mobilePermissions: FormControl<string[]>;
}

export interface CustomerTeamSettingEditFormInput {
	positionsOptions: SelectItem[];
	permissionsOptions: SelectItemGroup[];
	mobilePermissionsOptions: SelectItem[];
	customer: AccountManagementUserPermission;
	teamSettings: CustomerTeamSettingEdit;
	hasAnyMobileAppEnabled: boolean;
}
