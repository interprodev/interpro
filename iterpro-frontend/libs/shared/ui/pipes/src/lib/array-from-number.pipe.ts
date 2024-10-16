import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	standalone: true,
	name: 'arrayFromNumber'
})
export class ArrayFromNumberPipe implements PipeTransform {
	transform(value: number): number[] {
		return Array.from({ length: value }, (_, index) => index);
	}
}
