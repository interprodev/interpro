import { Pipe, PipeTransform } from '@angular/core';
import { Drill } from '@iterpro/shared/data-access/sdk';
import { SelectItem } from 'primeng/api';

@Pipe({
	name: 'drillThemesFilter'
})
export class DrillThemesFilterPipe implements PipeTransform {
	transform(themes: SelectItem[], filteredByUserDrills: Drill[]): SelectItem[] {
		const filteredDrillThemes: string[] = (filteredByUserDrills || []).map(({ theme }) => theme);
		return (themes || []).filter(({ value }) => {
			return filteredDrillThemes.includes(value);
		});
	}
}
