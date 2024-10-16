import { Pipe, PipeTransform } from '@angular/core';
import { AccountManagementUserPermission } from '../models/settings-user-permissions.type';

@Pipe({
	standalone: true,
	name: 'teamCounterCustomer'
})
export class TeamCounterCustomerPipe implements PipeTransform {
	transform(teamId: string, customers: AccountManagementUserPermission[]): number {
		// count the number of customers that have the teamId in their teamSettings
		return (customers || [])
			.filter(({ teamSettings }) => (teamSettings || [])
				.find(({teamId: settingTeamId, removed}) => !removed && settingTeamId === teamId)).length;
	}
}
