import { ClubPreferenceGeneralForm } from './settings-club-general.type';
import { FormControl, FormGroup, Validators } from '@angular/forms';

const valueDefault = {value: null, disabled: true};
export const clubPreferenceGeneralForm: ClubPreferenceGeneralForm = {
	name: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required])
	}),
	foundation: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required])
	}),
	crest: new FormControl(valueDefault, {
		nonNullable: true
	}),
	nation: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required])
	}),
	landingPage: new FormControl(valueDefault),
};
