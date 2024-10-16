import { FormControl, Validators } from '@angular/forms';
import { CustomerTeamSettingEdit, CustomerTeamSettingEditForm } from './customer-team-setting-edit.type';

const valueDefault = {value: null, disabled: true};
export const customerTeamSettingEditForm: CustomerTeamSettingEditForm = {
	position: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required])
	}),
	permissions: new FormControl({value: [], disabled: true}, {
		nonNullable: true,
		validators: Validators.compose([Validators.required])
	}),
	mobilePermissions: new FormControl({value: [], disabled: true}, {
		nonNullable: true
	}),
};
