import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';
@Pipe({
	standalone: true,
	name: 'marked'
})
export class MarkedPipe implements PipeTransform {
	transform(value: any): any {
		if (value && value.length > 0) {
			return marked(value);
		}
		return value;
	}
}
