import { TreatmentMetricBlackList, TreatmentMetricForm } from './treatment-edit.type';
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Attachment, TreatmentMetricType } from '@iterpro/shared/data-access/sdk';

const valueDefault = {value: null, disabled: true};
export function toTreatmentMetricEditForm(blackListValues: TreatmentMetricBlackList[], blackListLabels: TreatmentMetricBlackList[]): TreatmentMetricForm {
	return {
		label: new FormControl<string>(valueDefault, [Validators.required, mustBeUniqueCoupleValidator('label', blackListLabels)]),
		value: new FormControl<string>(valueDefault, [Validators.required, mustBeUniqueCoupleValidator('value', blackListValues)]),
		type: new FormControl<TreatmentMetricType>(valueDefault, [Validators.required]),
		category: new FormControl<string>(valueDefault, [Validators.required]),
		description: new FormControl<string>(valueDefault, [Validators.required]),
		video: new FormControl<Attachment>(valueDefault),
		doc: new FormControl<Attachment>(valueDefault)
	}
}


function mustBeUniqueCoupleValidator(field: 'label' | 'value', blackList: TreatmentMetricBlackList[]): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => {
		const value = control.parent?.get(field)?.value;
		const category = control.parent?.get('category')?.value;
		const type = control.parent?.get('type')?.value as TreatmentMetricType;
		if (type === 'physiotherapy' && value && category) {
			const mustBeUniqueValue = blackList.find(item => (item.value.toLowerCase()) === (value.toLowerCase()) && (item.category.toLowerCase()) === (category.toLowerCase()));
			if (mustBeUniqueValue) {
				return { mustBeUnique: true, uniqueValues: [type, mustBeUniqueValue.category, mustBeUniqueValue.value]};
			}
		} else if (type === 'sec' && value) {
			const mustBeUniqueValue = blackList.find(item => (item.value.toLowerCase()) === (value.toLowerCase()) && (item.type.toLowerCase()) === (type.toLowerCase()));
			if (mustBeUniqueValue) {
				return { mustBeUnique: true, uniqueValues: [type, mustBeUniqueValue.value]};
			}
		}
		return null;
	};
}
