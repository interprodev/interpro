import { TeamPreferenceGeneralForm, TeamPreferenceUser, TeamPreferenceUserForm } from './settings-team-general.type';
import { FormControl, Validators } from '@angular/forms';

const valueDefault = { value: null, disabled: true };
export const teamPreferenceGeneralForm: TeamPreferenceGeneralForm = {
	name: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required])
	}),
	gender: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required])
	}),
	landingPage: new FormControl(valueDefault),
	activeGameReportTemplate: new FormControl(valueDefault, {
		nonNullable: false,
		validators: Validators.compose([Validators.required])
	}),
	activeTrainingReportTemplate: new FormControl(valueDefault, {
		nonNullable: false,
		validators: Validators.compose([Validators.required])
	})
};

export const teamPreferenceUserForm: TeamPreferenceUserForm = {
	landingPage: new FormControl(valueDefault)
};
