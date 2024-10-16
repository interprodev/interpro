import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FormControl } from '@angular/forms';
import { groupBy } from 'lodash';

@Pipe({
	name: 'picklistHeaderLabel',
	standalone: true
})
export class PicklistHeaderLabelPipePipe implements PipeTransform {
	#translateService = inject(TranslateService);
	transform(controls: FormControl[], baseLabel: string, activeGroupBy?: string): string {
		const base = this.#translateService.instant(baseLabel);
		const total = controls.length;
		if (!activeGroupBy) {
			return `${base} (${total})`;
		}
		const grouped = groupBy(controls, activeGroupBy);
		const reduced = Object.entries(grouped)
			.map(([key, values]) => `${this.#translateService.instant(`profile.attributes.${key}`)}: ${values.length}`)
			.join(', ');
		if (!reduced) {
			return `${base} (${total})`;
		}
		return `${base} (${total}) (${reduced})`;
	}
}
