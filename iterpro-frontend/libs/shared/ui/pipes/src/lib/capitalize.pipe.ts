import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'capitalize', standalone: true })
export class CapitalizePipe implements PipeTransform {
	transform(value: string): string {
		if (value) {
			return value.replace(/\w\S*/g, (txt: string): string => {
				return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
			});
		}
		return value;
	}
}
