import { FormArray, FormControl, Validators } from '@angular/forms';
import { ClubPreferenceSeasonForm, TransferWindowEdit, TransferWindowForm } from './seasons.type';
import { IterproOrgType } from '@iterpro/shared/data-access/permissions';

const valueDefault = {value: null, disabled: true};
export const clubPreferenceSeasonForm: ClubPreferenceSeasonForm = {
	id: new FormControl(valueDefault),
	name: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required])
	}),
	start: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required])
	}),
	end: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required])
	}),
	_transferWindows: new FormArray([])
};


export function toTransferWindowFormElement(transferWindow: TransferWindowEdit, orgType: IterproOrgType): TransferWindowForm {
	const validators = orgType === 'agent' ? [] : [Validators.required];
	return {
		id: new FormControl({ value: transferWindow.id, disabled: true }, {
			nonNullable: true,
			validators: Validators.compose(validators)
		}),
		name: new FormControl({ value: transferWindow.name, disabled: true }, {
			nonNullable: true,
			validators: Validators.compose(validators)
		}),
		budget: new FormControl({ value: transferWindow.budget, disabled: true }, {
			nonNullable: true,
			validators: Validators.compose([...validators, Validators.min(0)])
		}),
		start: new FormControl({ value: transferWindow.start, disabled: true }, {
			nonNullable: true,
			validators: Validators.compose(validators)
		}),
		end: new FormControl({ value: transferWindow.end, disabled: true }, {
			nonNullable: true,
			validators: Validators.compose(validators)
		})
	};
}
