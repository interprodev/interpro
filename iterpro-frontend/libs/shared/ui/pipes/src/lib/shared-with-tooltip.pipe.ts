import { Pipe, PipeTransform } from '@angular/core';
import { SelectItemGroup } from 'primeng/api';
import { getAllSelectItemGroupValues } from '@iterpro/shared/utils/common-utils';
import { flatten } from 'lodash';

@Pipe({
	name: 'sharedWithTooltip',
	standalone: true
})
export class SharedWithTooltipPipe implements PipeTransform {
	transform(ids: string[][], options: SelectItemGroup[]): string {
		if (!ids || !options) {
			return '';
		}
		const sharedWith: string[] = getAllSelectItemGroupValues(options)
			.filter(({ value }) => flatten(ids).includes(value))
			.map(({ label }) => label);
		if (!sharedWith || sharedWith.length === 0) {
			return '';
		}
		if (sharedWith.length === 1) {
			return sharedWith[0] as string;
		}
		return sharedWith.join(', ');
	}
}
