import { FormControl, Validators } from '@angular/forms';
import { ClubPreferenceFinanceForm } from './settings-club-finance.type';

const valueDefault = {value: null, disabled: true};
export const clubPreferenceFinanceForm: ClubPreferenceFinanceForm = {
	currency: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required])
	}),
	taxes: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required, Validators.max(100), Validators.min(0)])
	}),
	vat: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required, Validators.max(100), Validators.min(0)])
	}),
	paymentFrequency: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required])
	}),
};
