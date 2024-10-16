import { Pipe, PipeTransform } from '@angular/core';
import { Team } from '@iterpro/shared/data-access/sdk';
import { getMedicationName } from '@iterpro/shared/utils/common-utils';

@Pipe({
	name: 'medicationLabel'
})
export class MedicationLabelPipe implements PipeTransform {
	transform(drug: string, team: Team): string {
		return getMedicationName(drug, team);
	}
}
