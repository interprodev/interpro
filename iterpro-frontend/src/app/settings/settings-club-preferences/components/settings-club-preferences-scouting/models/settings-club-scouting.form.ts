import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ClubPreferenceScoutingForm } from './settings-club-scouting.type';

const valueDefault = { value: null, disabled: true };
export const clubPreferenceScoutingForm: ClubPreferenceScoutingForm = {
	profileCreation: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required])
	}),
	activeGameReportTemplate: new FormControl(valueDefault, {
		nonNullable: false,
		validators: Validators.compose([Validators.required])
	})
};
