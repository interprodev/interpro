import { Directive, ElementRef, forwardRef, HostListener } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/* #region UTILS */
export const regx = new RegExp('^(-?[0-9]{1,3})(.[0-9]{3})*(,[0,9]*)?|^-$');

const chunk = (str: string, size: number): number[] => {
	const numChunks = Math.ceil(str.length / size);
	const chunks = new Array(numChunks);

	let o = str.length - size;
	if (o < 0) {
		size += o;
		o = 0;
	}
	for (let i = numChunks; i > 0; i--) {
		chunks[i - 1] = str.substr(o, size);
		o -= size;
		if (o < 0) {
			size += o;
			o = 0;
		}
	}

	return chunks;
};

const getTrailingZeros = (original: string): string => {
	if (original.length && original.indexOf(',') >= 0) {
		let trailingZeros = ',';
		for (let i = original.length - 1; i >= 0; i -= 1) {
			if (original[i] === '0') trailingZeros += '0';
			else break;
		}
		return trailingZeros;
	}

	return '';
};

const parse = (input: string): number => {
	let str = input.replace(/\./g, '');
	str = str.replace(',', '.');
	return parseFloat(str);
};

export const format = (value: string | number, original: string) => {
	let str = `${value}`;
	let sign = '';
	if (str.length && str[0] === '-') {
		str = str.substring(1);
		sign = '-';
	}
	const tokens = str.split('.');
	let display = sign;
	display += chunk(tokens[0], 3).join('.');
	if (tokens.length > 1) display = `${display},${tokens[1]}`;
	else display += getTrailingZeros(original);
	return display;
};

export const unmask = (input: string): number | null => (input && input !== '-' ? parse(input) : null);

export const mask = (value: string | number | null, original: string): string => {
	if (original === '-') return original;
	return value || value === 0 ? format(value, original) : '';
};

export const MASKED_VALUE_ACCESSOR: any = {
	provide: NG_VALUE_ACCESSOR,
	useExisting: forwardRef(() => MaskDirective),
	multi: true
};
/* #endregion */

@Directive({
	standalone: true,
	selector: '[iterproMask]',
	providers: [MASKED_VALUE_ACCESSOR]
})
export class MaskDirective implements ControlValueAccessor {
	onChange: any;
	value: number | string | null = null;
	prev = '';
	protected formElement: HTMLInputElement;

	constructor(private readonly elementRef: ElementRef) {
		this.formElement = this.elementRef.nativeElement;
	}

	writeValue(value: string): void {
		this.value = value;
		this.prev = value;
		const input = mask(value, this.prev);
		this.formElement.value = input;
	}

	registerOnChange(fn: any) {
		this.onChange = fn;
	}

	registerOnTouched(fn: any) {}

	public setDisabledState(isDisabled: boolean): void {
		this.formElement.disabled = isDisabled;
	}

	@HostListener('input', ['$event'])
	public onInput(e: KeyboardEvent): void {
		const el: HTMLInputElement = e.target as HTMLInputElement;
		const original = el.value;
		if (regx.test(original)) {
			const value = unmask(original);
			const input = mask(value, original);
			this.prev = original;
			this.onChange(value);
			this.formElement.value = input;
		} else if (original === '') {
			this.prev = original;
			this.onChange(null);
			this.formElement.value = '';
		} else {
			const value = unmask(this.prev);
			const input = mask(value, this.prev);
			this.formElement.value = input;
		}
	}
}
