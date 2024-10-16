import { Pipe, PipeTransform } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { flatten } from 'lodash';

@Pipe({
	name: 'uniqueValuesError',
	standalone: true
})
export class UniqueValuesErrorPipe implements PipeTransform {
	transform(values: string[], options: SelectItem[][]): string {
		const flattenOptions = flatten(options);
		return (values || []).map(value => {
			const existing = flattenOptions.find(option => option.value === value)?.label;
			return existing || value;
		}).join(' - ');
	}
}
