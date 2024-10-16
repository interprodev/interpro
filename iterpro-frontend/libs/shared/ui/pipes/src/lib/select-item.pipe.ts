import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
	standalone: true,
	name: 'selectItem'
})
export class SelectItemPipe implements PipeTransform {
	readonly #translateService = inject(TranslateService);

	transform(value, translate = false) {
		if (!Array.isArray(value)) {
			value = [value];
		}
		return translate
			? value.map(key => ({
					value: key,
					label: this.#translateService.instant(key)
			  }))
			: value.map(key => ({
					value: key,
					label: String(key)
			  }));
	}
}
