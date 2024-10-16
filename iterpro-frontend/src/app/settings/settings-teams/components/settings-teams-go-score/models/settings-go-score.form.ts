import {
	AbstractControl,
	FormArray,
	FormControl,
	FormGroup,
	ValidationErrors,
	ValidatorFn,
	Validators
} from '@angular/forms';
import {
	CommonForm,
	GoScoreTestRule,
	GoScoreTestRuleFormElement,
	GoScoreWellnessRule,
	GoScoreWellnessRuleFormElement
} from './settings-go-score.type';

export function toCommonWellnessFormElement(
	wellnessSettings: GoScoreWellnessRule,
	goScoreSettings: GoScoreTestRule[]
): CommonForm {
	return {
		wellnessForm: new FormGroup(toWellnessFormElement(wellnessSettings)),
		testForms: new FormArray(goScoreSettings.map(test => new FormGroup(toGoScoreTestFormElement(test))))
	};
}

export function toWellnessFormElement(settings: GoScoreWellnessRule): GoScoreWellnessRuleFormElement {
	return {
		metricName: new FormControl(
			{ value: settings.metricName, disabled: true },
			{
				nonNullable: true,
				validators: Validators.required
			}
		),
		enabled: new FormControl(
			{ value: settings.enabled, disabled: true },
			{
				nonNullable: true,
				validators: []
			}
		),
		weights: new FormGroup({
			go_weight: new FormControl(
				{
					value: settings.weights.go_weight,
					disabled: true
				},
				{
					nonNullable: false,
					validators: Validators.compose([Validators.min(0), Validators.max(100)])
				}
			),
			sleep: toGoScoreWeight(settings.weights.sleep),
			stress: toGoScoreWeight(settings.weights.stress),
			fatigue: toGoScoreWeight(settings.weights.fatigue),
			soreness: toGoScoreWeight(settings.weights.soreness),
			mood: toGoScoreWeight(settings.weights.mood)
		})
	};
}

export function toGoScoreTestFormElement(settings: GoScoreTestRule): GoScoreTestRuleFormElement {
	return {
		testId: new FormControl(
			{ value: settings.testId, disabled: true },
			{
				nonNullable: true,
				validators: Validators.compose([Validators.required, Validators.minLength(2)])
			}
		),
		testName: new FormControl(
			{ value: settings.testName, disabled: true },
			{
				nonNullable: true,
				validators: Validators.compose([Validators.required, Validators.minLength(2)])
			}
		),
		metricName: new FormControl(
			{ value: settings.metricName, disabled: true },
			{
				nonNullable: true,
				validators: Validators.compose([Validators.required])
			}
		),
		enabled: new FormControl(
			{ value: settings.enabled, disabled: true },
			{
				nonNullable: true,
				validators: []
			}
		),
		weights: new FormGroup({
			go_weight: new FormControl(
				{
					value: settings.weights?.go_weight,
					disabled: true
				},
				{
					nonNullable: false,
					validators: Validators.compose([Validators.min(0), Validators.max(100)])
				}
			),
			inner: toGoScoreWeight(settings.weights?.inner || [])
		})
	};
}

function toGoScoreWeight(array: number[]): FormArray {
	return new FormArray(
		array.map(
			element =>
				new FormControl(
					{ value: element, disabled: true },
					{
						nonNullable: false,
						validators: Validators.compose([Validators.min(0), Validators.max(1)])
					}
				)
		)
	);
}

// Validator per controllare la somma di go_weight
export function totalGoWeightValidator(): ValidatorFn {
	return (formGroup: AbstractControl): ValidationErrors | null => {
		const controls = formGroup as FormGroup<CommonForm>;
		const wellnessWeight = controls.controls?.wellnessForm?.get('weights.go_weight')?.value || 0;
		const totalWeight = (controls.controls.testForms.controls || [])
			.filter(control => (control as FormGroup).get('enabled').value === true)
			.map(control => control.get('weights.go_weight').value || 0)
			.reduce((accumulator, currentValue) => accumulator + currentValue, wellnessWeight);
		if (totalWeight !== 100) {
			return { totalGoWeightInvalid: true, totalWeight };
		}
		return null;
	};
}
