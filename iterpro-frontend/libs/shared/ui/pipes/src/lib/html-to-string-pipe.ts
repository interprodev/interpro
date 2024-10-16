import { Pipe, PipeTransform } from '@angular/core';
import { parseHtmlStringToText } from '@iterpro/shared/utils/common-utils';

@Pipe({
	standalone: true,
	name: 'htmlToString'
})
export class HtmlToStringPipe implements PipeTransform {

	transform(htmlString: string): string {
		return parseHtmlStringToText(htmlString);
	}
}
