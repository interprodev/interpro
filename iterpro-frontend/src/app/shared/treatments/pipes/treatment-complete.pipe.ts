import { Pipe, PipeTransform } from '@angular/core';
import { MedicalTreatment } from '@iterpro/shared/data-access/sdk';
import * as TrtUtilsService from '../utils/treatment-table-utils';

@Pipe({
	name: 'treatmentComplete'
})
export class TreatmentCompletePipe implements PipeTransform {
	transform(treatment: MedicalTreatment): { class: string; color: string; label: string } {
		return TrtUtilsService.getCompleteStyle(treatment);
	}
}
