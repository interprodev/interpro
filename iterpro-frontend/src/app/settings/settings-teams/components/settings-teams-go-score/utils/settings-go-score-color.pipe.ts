import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	standalone: true,
	name: 'backgroundColor'
})
export class BackgroundColorPipe implements PipeTransform {
	transform(status: string): { [key: string]: string } {
		let color: string;
		switch (status) {
			case 'Green': {
				color = '#3bf100';
				break;
			}
			case 'Yellow': {
				color = '#fcee21';
				break;
			}
			case 'Red': {
				color = '#c1272d';
				break;
			}
			default: {
				color = 'transparent';
				break;
			}
		}
		return { 'background-color': color };
	}
}
