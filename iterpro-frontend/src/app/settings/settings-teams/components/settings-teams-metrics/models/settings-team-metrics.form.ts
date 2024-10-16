import {
	AbstractControl,
	FormArray,
	FormControl,
	FormGroup,
	ValidationErrors,
	ValidatorFn,
	Validators
} from '@angular/forms';
import { CustomMetric, DeviceMetricDescriptor, TestMetric, TreatmentMetric } from '@iterpro/shared/data-access/sdk';
import {
	CustomMetricFormControl,
	DeviceMetricDescriptorFormControl,
	DeviceMetricDescriptorMapped,
	DrillMetricMapped,
	FormRequiredPayload,
	MAX_METRICS,
	MAX_PROFILE_ATTRIBUTES_PER_CATEGORY,
	MAX_TESTS,
	MIN_METRICS,
	MIN_PROFILE_ATTRIBUTES_PER_CATEGORY,
	MIN_TESTS,
	TeamMetricsForm,
	TeamMetricsMapped,
	TestMetricFormControl,
	TestMetricsMapped,
	TreatmentMetricFormControl,
	TreatmentMetricsMapped
} from './settings-team-metrics.type';

export function toTeamMetricsForm(mapping: TeamMetricsMapped, requiredPayload: FormRequiredPayload): TeamMetricsForm {
	const permissions = requiredPayload.permissions
	return {
		metricsPerformance: toDeviceMetricDescriptorFormGroup(mapping.metricsPerformance, permissions.importData && requiredPayload.isAdmin),
		metricsTeamTactical: toDeviceMetricDescriptorFormGroup(mapping.metricsTeamTactical, permissions.tactics && requiredPayload.isAdmin),
		metricsIndividualTactical: toDeviceMetricDescriptorFormGroup(mapping.metricsIndividualTactical, permissions.tactics && requiredPayload.isAdmin),
		drillThemes: toDrillMetricFormGroup(mapping.drillThemes, requiredPayload.isAdmin),
		drillTacticalGoals: toDrillMetricFormGroup(mapping.drillTacticalGoals, requiredPayload.isAdmin),
		drillPhysicalGoals: toDrillMetricFormGroup(mapping.drillPhysicalGoals, requiredPayload.isAdmin),
		drillTechnicalGoals: toDrillMetricFormGroup(mapping.drillTechnicalGoals, requiredPayload.isAdmin),
		playerAttributes: toPlayerAttributesMetricFormGroup(mapping.playerAttributes, requiredPayload),
		metricsTests: toMetricTestFormGroup(mapping.metricsTests, requiredPayload.isAdmin && permissions.tests),
		treatmentMetrics: toTreatmentMetricFormGroup(mapping.treatmentMetrics, requiredPayload.isAdmin),
	}

	function toDeviceMetricDescriptorFormGroup(item: DeviceMetricDescriptorMapped, required: boolean): FormGroup<DeviceMetricDescriptorFormControl> {
		const validators = required ? [Validators.required, Validators.minLength(MIN_METRICS), Validators.maxLength(MAX_METRICS)] : [];
		return new FormGroup(
			{
				available: new FormArray<FormControl<DeviceMetricDescriptor>>(item.available
					.map((metric) => new FormControl({value: metric, disabled: true}))),
				active: new FormArray<FormControl<DeviceMetricDescriptor>>(item.active
						.map((metric) => new FormControl({value: metric, disabled: true})),
					validators),
			}
		);
	}

	function toDrillMetricFormGroup(item: DrillMetricMapped, required: boolean): FormGroup<CustomMetricFormControl> {
		const validators = required ? [Validators.required] : [];
		return new FormGroup(
			{
				available: new FormArray<FormControl<CustomMetric>>(item.available
					.map((metric) => new FormControl({value: metric, disabled: true}))),
				active: new FormArray<FormControl<CustomMetric>>(item.active
						.map((metric) => new FormControl({value: metric, disabled: true})),
					validators),
			}
		);
	}

	function toMetricTestFormGroup(item: TestMetricsMapped, required: boolean): FormGroup<TestMetricFormControl> {
		const validators = required ? [Validators.required, Validators.minLength(MIN_TESTS), Validators.maxLength(MAX_TESTS)] : [];
		return new FormGroup(
			{
				available: new FormArray<FormControl<TestMetric>>(item.available
					.map((metric) => new FormControl({value: metric, disabled: true}))),
				active: new FormArray<FormControl<TestMetric>>(item.active
						.map((metric) => new FormControl({value: metric, disabled: true})),
					validators),
			}
		);
	}

	function toTreatmentMetricFormGroup(item: TreatmentMetricsMapped, required: boolean): FormGroup<TreatmentMetricFormControl> {
		const validators = required ? [Validators.required] : [];
		return new FormGroup(
			{
				available: new FormArray<FormControl<TreatmentMetric>>(item.available
					.map((metric) => new FormControl({value: metric, disabled: true}))),
				active: new FormArray<FormControl<TreatmentMetric>>(item.active
						.map((metric) => new FormControl({value: metric, disabled: true})),
					validators),
			}
		);
	}
}

export function toPlayerAttributesMetricFormGroup(item: DrillMetricMapped, requiredPayload: FormRequiredPayload, disable = true): FormGroup<CustomMetricFormControl> {
	const isTipss = requiredPayload.playerDescription === 'tipss';
	const validators = !requiredPayload.isAdmin ? null : isTipss ? [Validators.required] : [Validators.required, profileAttributesValidators()];
	return new FormGroup(
		{
			available: new FormArray<FormControl<CustomMetric>>(item.available
				.map((metric) => new FormControl({value: metric, disabled: disable}))),
			active: new FormArray<FormControl<CustomMetric>>(item.active
					.map((metric) => new FormControl({value: metric, disabled: disable})),
				validators),
		}
	);
}

export function profileAttributesValidators(): ValidatorFn {
	return (formGroup: AbstractControl): ValidationErrors | null => {
		const controls = formGroup as FormArray<FormControl<CustomMetric>>;
		const active = controls.controls.filter((control) => control.value);
		const attributes = active.map((control) => control.value);
		const categories = attributes.reduce((acc, attribute) => {
			if (!acc[attribute.category]) {
				acc[attribute.category] = 0;
			}
			acc[attribute.category]++;
			return acc;
		}, {});
		const invalidCategories = Object.keys(categories).filter((category) => categories[category] > MAX_PROFILE_ATTRIBUTES_PER_CATEGORY || categories[category] < MIN_PROFILE_ATTRIBUTES_PER_CATEGORY);
		if (invalidCategories.length) {
			return {customError: invalidCategories[0]};
		}
		return null;
	};
}


