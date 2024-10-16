import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({ name: 'locationsLabel' })
export class LocationsPipe implements PipeTransform {
	constructor(private readonly translateService: TranslateService) {}

	transform(value: string[]): string {
		if (value) {
			return value
				.map(label =>
					this.translateService.instant(
						label === 'general' || label === 'none' ? label : `medical.infirmary.details.location.${label}`
					)
				)
				.join(', ');
		}
	}
}
