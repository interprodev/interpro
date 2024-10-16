import { Injectable, Pipe, PipeTransform } from '@angular/core';

export const toShortNumber = (input: number, showSuffix: boolean = false, fixed?: number): string => {
	let exp: number;
	const isNegative = input < 0 ? -1 : 1;
	const suffixes = ['k', 'M', 'B', 'T'];
	input = Math.abs(input);

	if (Number.isNaN(input) || input === null || input === undefined) {
		return '';
	} else if (Number(input) === 0) {
		return '0';
	} else if (Number(input) < 1000 && Number(input) > -1000) {
		return Number(input).toFixed(fixed);
	} else {
		exp = Math.floor(Math.log(Number(input)) / Math.log(1000));
		if (!fixed) fixed = Math.round(Number(input) / Math.pow(1000, exp)) !== Number(input) / Math.pow(1000, exp) ? 1 : 0;
		return (isNegative * (Number(input) / Math.pow(1000, exp))).toFixed(fixed) + (showSuffix ? suffixes[exp - 1] : '');
	}
};

@Pipe({
	name: 'shortNumber',
	standalone: true
})
@Injectable({
	providedIn: 'root'
})
export class ShortNumberPipe implements PipeTransform {
	transform(input: number | string, showSuffix = false, fixed?: number): string {
		return toShortNumber(Number(input), showSuffix, fixed);
	}
}
