import { Pipe, PipeTransform } from '@angular/core';
import { SelectItem } from 'primeng/api';
@Pipe({
	name: 'selectItemValue',
	standalone: true
})
export class SelectItemValuePipe implements PipeTransform {
	transform(value: string, items: SelectItem[], matchingValue: string, fieldToReturn: string): string | undefined {
		if (!value) return undefined;
		const item = (items || []).find(({ value: itemValue }) => itemValue[matchingValue] === value);
		return item?.value[fieldToReturn];
	}
}
