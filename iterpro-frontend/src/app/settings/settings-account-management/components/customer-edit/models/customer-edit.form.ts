import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CustomerEditForm } from './customer-edit.type';
import { mustBeUniqueValidator } from '@iterpro/shared/utils/common-utils';

const valueDefault = { value: null, disabled: true };
export function toCustomerEditForm(
	blackListFirstNames: string[],
	blackListLastNames: string[],
	blacklistEmails: string[]
): CustomerEditForm {
	return {
		firstName: new FormControl(valueDefault, {
			nonNullable: true,
			validators: Validators.compose([
				Validators.required,
				mustBeUniqueCoupleValidator(blackListFirstNames, blackListLastNames)
			])
		}),
		lastName: new FormControl(valueDefault, {
			nonNullable: true,
			validators: Validators.compose([
				Validators.required,
				mustBeUniqueCoupleValidator(blackListFirstNames, blackListLastNames)
			])
		}),
		email: new FormControl(valueDefault, {
			nonNullable: true,
			validators: Validators.compose([Validators.required, mustBeUniqueValidator(blacklistEmails)])
		}),
		admin: new FormControl({ value: false, disabled: true })
	};
}

function mustBeUniqueCoupleValidator(blackListFirstNames: string[], blackListLastNames: string[]): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => {
		const parent = control.parent as FormGroup<CustomerEditForm>;
		const firstName = parent?.controls?.firstName?.value;
		const lastName = parent?.controls?.lastName?.value;
		if (!firstName || !lastName) return null;
		const mustBeUniqueValue =
			(blackListFirstNames || []).find(item => item?.toLowerCase() === firstName?.toLowerCase()) &&
			blackListLastNames.find(item => item?.toLowerCase() === lastName?.toLowerCase());
		if (mustBeUniqueValue) {
			return { mustBeUnique: true, uniqueValues: [firstName, lastName] };
		}
		return null;
	};
}
