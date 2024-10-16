import { FormControl, Validators } from '@angular/forms';

export interface BasicInputDialogForm {
	value: FormControl<string | null>;
}

const valueDefault = {value: null, disabled: true};
export const basicInputDialogForm: BasicInputDialogForm = {
	value: new FormControl<string | null>(valueDefault, [Validators.required])
}
