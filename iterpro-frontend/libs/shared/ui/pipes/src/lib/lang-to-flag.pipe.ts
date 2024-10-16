import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	standalone: true,
	name: 'langToFlag'
})
export class LangToFlagPipe implements PipeTransform {
	transform(lang: string): string {
		switch (lang) {
			case 'en-US':
				return 'fi-gb';
			case 'ja-JP':
				return 'fi-jp';
			case 'ar-SA':
				return 'fi-sa';
			default:
				return `fi-${lang.split('-')[0]}`;
		}
	}
}
