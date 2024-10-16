import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function mustBeUniqueValidator(blackList: string[]): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => {
		const value = control.value;
		if (!value) return null;
		if (blackList.includes(value) || blackList.includes(value.toLowerCase() || blackList.includes(value.toUpperCase()))) {
			return { mustBeUnique: true, mustBeUniqueValue: value };
		}
		return null;
	};
}
