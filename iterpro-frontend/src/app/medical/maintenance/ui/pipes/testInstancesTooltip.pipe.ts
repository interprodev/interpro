import { Pipe, PipeTransform, inject } from '@angular/core';
import { FunctionalTestInstance } from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
	name: 'testInstancesTooltip'
})
export class TestInstancesTooltip implements PipeTransform {
	readonly #transalteService = inject(TranslateService);

	transform(tests: FunctionalTestInstance[] = []) {
		return tests
			.map(
				({ name, purpose }) =>
					name + ' - ' + purpose.map((label: string) => this.#transalteService.instant(label)).join(', ')
			)
			.join('\n\n');
	}
}
