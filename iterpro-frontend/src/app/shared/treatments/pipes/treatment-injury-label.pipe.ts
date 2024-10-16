import { Pipe, PipeTransform } from '@angular/core';
import { Injury } from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';
import { getInjuryList } from '../utils/treatment-table-utils';

@Pipe({
	name: 'treatmentInjuryLabel'
})
export class TreatmentInjuryLabelPipe implements PipeTransform {
	constructor(private readonly translate: TranslateService) {}

	transform(injuryId: string, injuries: Injury[]): string {
		if (!injuryId) return null;
		const injury: Injury = (injuries || []).find(({ id }) => id === injuryId);
		if (!injury) return null;
		return getInjuryList([injury], this.translate)[0].label;
	}
}
