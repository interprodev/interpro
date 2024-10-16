import { Pipe, PipeTransform, inject } from '@angular/core';
import { ToLocalEquivalentService } from '@iterpro/shared/utils/common-utils';

@Pipe({
	standalone: true,
	name: 'toLocalDate'
})
export class ToLocalPipe implements PipeTransform {
	readonly #toEquivalentService = inject(ToLocalEquivalentService);

	transform(value: Date, args?: any): Date {
		return this.#toEquivalentService.convert(value);
	}
}
