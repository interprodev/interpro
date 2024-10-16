import { FormControl, FormGroup } from '@angular/forms';
import { Customer } from '@iterpro/shared/data-access/sdk';

export type PasswordEdit = {
	current_password: FormControl<string>;
	passwords: FormGroup<PasswordsForm>;
};

export type PasswordsForm = {
	new_password: FormControl<string>;
	repeat_new_password: FormControl<string>;
};

export type CustomerPasswordEdit = Pick<Customer, 'password' | 'isTempPassword' | 'firstName' | 'lastName' | 'id'>

export interface PasswordValidatorInput {
	password: string;
	extraBannedWords?: string[];
}
export interface StrengthInfo {
	score: 0 | 1 | 2 | 3 | 4;
	guesses: number;
	feedback: {
		warning: string;
		suggestions: string[];
	};
	calc_time: number;
}

export interface PasswordValidatorResponse {
	valid: boolean;
	message?: string;
	missingRequirements?: string[];
	strengthInfo?: StrengthInfo;
}
