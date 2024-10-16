import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	standalone: true,
	name: 'sanitizeCsvHeaders'
})
export class SanitizeCsvHeadersPipe implements PipeTransform {
	transform(items: string[]): string[] {
		return items.map(s => s.replace(/\./g, '_'));
	}
}
