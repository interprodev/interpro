import { Pipe, PipeTransform } from '@angular/core';
import { SelectItem } from 'primeng/api';

@Pipe({
	name: 'selectItemLabel',
	standalone: true
})
export class SelectItemLabelPipe implements PipeTransform {
	transform(value: string | number, items: SelectItem[], matchingValue?: string): string | undefined {
		if (!value) return undefined;
		const item = matchingValue
			? (items || []).find(({ value: itemValue }) => itemValue[matchingValue] === value)
			: (items || []).find(({ value: itemValue }) => itemValue === value);
		return item ? item?.label : String(value);
	}
}
