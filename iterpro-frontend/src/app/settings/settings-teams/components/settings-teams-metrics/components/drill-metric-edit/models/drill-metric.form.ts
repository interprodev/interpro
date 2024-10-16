import { DrillMetricForm } from './drill-metric.type';
import {
	FormControl,
	Validators
} from '@angular/forms';
import { mustBeUniqueValidator } from '@iterpro/shared/utils/common-utils';

const valueDefault = {value: null, disabled: true};
export function toDrillMetricForm(blackListValues: string[], blackListLabels: string[]): DrillMetricForm {
	return {
		value: new FormControl<string>(valueDefault, [Validators.required, mustBeUniqueValidator(blackListValues)]),
		label: new FormControl<string>(valueDefault, [Validators.required, mustBeUniqueValidator(blackListLabels)])
	}
}
