import { Pipe, PipeTransform } from '@angular/core';
import * as numeral from 'numeral';

@Pipe({
	standalone: true,
	name: 'customCurrency'
})
export class CustomCurrencyPipe implements PipeTransform {
	transform(value: number): string {
		if (!isNaN(value)) {
			const formatted = '$ 0.0 a';
			const number = numeral(value).format(formatted);
			return number;
		}

		return '';
	}
}
