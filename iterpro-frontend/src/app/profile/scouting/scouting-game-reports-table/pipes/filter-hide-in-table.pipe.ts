import { Pipe, PipeTransform } from '@angular/core';
import { Column } from '../interfaces/table.interfaces';

@Pipe({
	name: 'filterHideInTable'
})
export class FilterHideInTablePipe implements PipeTransform {
	transform(columns: Column[]): Column[] {
		return columns.filter(({ hideInTable }) => !hideInTable);
	}
}
