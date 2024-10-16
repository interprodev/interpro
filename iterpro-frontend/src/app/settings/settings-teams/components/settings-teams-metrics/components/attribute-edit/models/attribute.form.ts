import { DrillAttributeBlackList, DrillAttributeForm } from './attribute.type';
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AttributeCategory } from '@iterpro/shared/data-access/sdk';

const valueDefault = {value: null, disabled: true};
export function toDrillAttributeForm(blackListValues: DrillAttributeBlackList[], blackListLabels: DrillAttributeBlackList[]): DrillAttributeForm {
	return {
		label: new FormControl<string>(valueDefault, [Validators.required, mustBeUniqueCoupleValidator(blackListLabels, 'label')]),
		value: new FormControl<string>(valueDefault, [Validators.required, mustBeUniqueCoupleValidator(blackListValues, 'value')]),
		category: new FormControl<AttributeCategory>(valueDefault, [Validators.required]),
		description: new FormControl<string>(valueDefault, [Validators.required])
	}
}


function mustBeUniqueCoupleValidator(blackList: DrillAttributeBlackList[], field: 'label' | 'value'): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => {
		const value = control.parent?.get(field)?.value;
		const category = control.parent?.get('category')?.value;
		if (!category || !value) return null;
		const mustBeUniqueValue = blackList.find(item => (item.value.toLowerCase()) === (value.toLowerCase()) && (item.category.toLowerCase()) === (category.toLowerCase()));
		if (mustBeUniqueValue) {
			return { mustBeUnique: true, uniqueValues: [mustBeUniqueValue.category, mustBeUniqueValue.value]};
		}
		return null;
	};
}
