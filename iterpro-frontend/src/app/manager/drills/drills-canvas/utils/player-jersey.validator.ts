import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const playerJerseyValidator = (): ValidatorFn => {
	return (control: AbstractControl): ValidationErrors | null => {
		const value = control.value;
		if (value.length > 2) {
			return { maxLenght: true };
		}

		if (/^[a-zA-Z]*$/.test(value)) {
			return null;
		}

		if (/^\d*$/.test(value)) {
			return null;
		}

		return { invalidCharacter: true };
	};
};
