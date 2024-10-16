import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { PasswordEdit } from './password-edit.type';

const valueDefault = {value: null, disabled: true};
export const passwordEditForm: PasswordEdit = {
	current_password: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required])
	}),
	passwords: new FormGroup({
		new_password: new FormControl(valueDefault, [Validators.required, Validators.minLength(10)]),
		repeat_new_password: new FormControl(valueDefault, [Validators.required, matchPasswordFunc])
	})
};

function matchPasswordFunc(AC: AbstractControl): {matchPassword: boolean} | null {
	const formGroup = AC.parent;
	if (formGroup) {
		const passwordControl = formGroup.get('new_password'); // to get value in input tag
		const confirmPasswordControl = formGroup.get('repeat_new_password'); // to get value in input tag

		if (passwordControl && confirmPasswordControl) {
			const password = passwordControl.value;
			const confirmPassword = confirmPasswordControl.value;
			if (password !== confirmPassword) {
				return { matchPassword: true };
			} else {
				return null;
			}
		}
	}
	return null;
}
