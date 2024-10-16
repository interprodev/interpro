import { Pipe, PipeTransform } from '@angular/core';
import { getAllSelectItemGroupValues } from '@iterpro/shared/utils/common-utils';
import { SelectItem, SelectItemGroup } from 'primeng/api';

@Pipe({
	standalone: true,
	name: 'costItemPersonTeam'
})
export class CostItemPersonTeamPipe implements PipeTransform {
	transform(personId: string, personOptions: SelectItemGroup[], teamsOptions: SelectItem[]): string | undefined {
		if (!personId) return undefined;
		const person = getAllSelectItemGroupValues(personOptions).find(({ value }) => value === personId);
		const personTeam = teamsOptions.find(({ value }) => value === person?.teamId);
		return personTeam.label;
	}
}
