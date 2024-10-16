import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserPreferencesContacts } from './user-preferences-general.type';

const valueDefault = {value: null, disabled: true};
export const userPreferencesContactsForm: UserPreferencesContacts = {
	firstName: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required, Validators.minLength(2)])
	}),
	lastName: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required, Validators.minLength(2)])
	}),
	telephone: new FormControl(valueDefault),
	email: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required, Validators.email])
	}),
	currentLanguage: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required])
	}),
	currentDateFormat: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required])
	}),
	teamSettings: new FormGroup({
		id: new FormControl(null),
		position: new FormControl(null),
		landingPage: new FormControl(null)
	}),
	downloadUrl: new FormControl(valueDefault),
	profilePhotoUrl: new FormControl(valueDefault),
	profilePhotoName: new FormControl(valueDefault)
};
