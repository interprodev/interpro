import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	standalone: true,
	name: 'millions'
})
export class MillionsPipe implements PipeTransform {
	transform(value: number, suffix = false): string {
		if (value) {
			const fixed = Math.round(value / 1000000) !== value / 1000000 ? 1 : 0;
			return suffix ? (value / 1000000 === 1 ? 'million' : 'millions') : Number(value / 1000000).toFixed(fixed);
		}

		return '';
	}
}
