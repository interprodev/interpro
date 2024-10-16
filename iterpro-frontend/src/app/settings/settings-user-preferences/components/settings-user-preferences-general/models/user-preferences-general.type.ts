import { FormControl, FormGroup } from '@angular/forms';
import { Customer } from '@iterpro/shared/data-access/sdk';

export type UserPreferencesContacts = {
	firstName: FormControl<string>;
	lastName: FormControl<string>;
	telephone: FormControl<string>;
	email: FormControl<string>;
	currentLanguage: FormControl<string>;
	currentDateFormat: FormControl<number>;
	teamSettings: FormGroup;
	downloadUrl: FormControl<string>;
	profilePhotoUrl: FormControl<string>;
	profilePhotoName: FormControl<string>;
};

export type CustomerPreferenceGeneral = Pick<Customer,
	'id' | 'firstName' | 'lastName' | 'telephone' | 'email' | 'currentLanguage' | 'currentDateFormat' | 'downloadUrl' | 'profilePhotoUrl' | 'profilePhotoName' | 'teamSettings' | 'clubId'>;
