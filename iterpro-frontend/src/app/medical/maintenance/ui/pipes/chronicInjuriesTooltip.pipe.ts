import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform, inject } from '@angular/core';
import { Injury } from '@iterpro/shared/data-access/sdk';
import { getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
	name: 'chronicInjuriesTooltip'
})
export class ChronicInjuriesTooltipPipe implements PipeTransform {
	readonly #datePipe = inject(DatePipe);
	readonly #translateService = inject(TranslateService);

	transform(value: Injury[] = []): string {
		return value
			.map(
				({ date, location }) =>
					this.#datePipe.transform(date, getMomentFormatFromStorage()) +
					':\n' +
					this.#translateService.instant(location)
			)
			.join('\n\n');
	}
}
