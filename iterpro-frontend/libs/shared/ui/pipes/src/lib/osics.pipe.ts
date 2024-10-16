import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	standalone: true,
	name: 'osics'
})
export class OsicsPipe implements PipeTransform {
	transform(value: any, args?: any): any {
		if (value && args) {
			const { code, diagnosis } = (args || []).find(({ code }) => code === value);
			return `${code} - ${diagnosis}`;
		}
	}
}
