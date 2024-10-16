import { Pipe, PipeTransform } from '@angular/core';
import { CustomerTeamSettings } from '@iterpro/shared/data-access/sdk';
import { getTeamSettings } from '@iterpro/shared/utils/common-utils';

@Pipe({
	standalone: true,
	name: 'customerTeamSetting'
})
export class CustomerTeamSettingPipe implements PipeTransform {
	transform(teamId: string, teamSettings: CustomerTeamSettings[]): CustomerTeamSettings | undefined {
		return getTeamSettings(teamSettings, teamId);
	}
}
