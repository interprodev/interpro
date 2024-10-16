import { FormArray, FormControl, FormGroup } from '@angular/forms';

type GoScoreWellnessWeight = {
	go_weight: number;
	sleep: [number, number, number, number, number];
	stress: [number, number, number, number, number];
	fatigue: [number, number, number, number, number];
	soreness: [number, number, number, number, number];
	mood: [number, number, number, number, number];
};

export type GoScoreWellnessRule = {
	metricName: string;
	enabled: boolean;
	weights: GoScoreWellnessWeight;
};

type GoScoreTestWeight = {
	go_weight: number;
	inner: [number, number, number];
};

export type GoScoreTestRule = {
	testId?: string;
	testName: string;
	metricName: string;
	enabled: boolean;
	weights: GoScoreTestWeight;
	metricLabel?: string;
};

export type GoScoreTestRuleFormElement = {
	testId?: FormControl<string>;
	testName: FormControl<string>;
	metricName: FormControl<string>;
	enabled: FormControl<boolean>;
	weights: FormGroup;
};

export type GoScoreWellnessRuleFormElement = {
	metricName: FormControl<string>;
	enabled: FormControl<boolean>;
	weights: FormGroup;
};

export type CommonForm = {
	wellnessForm: FormGroup<GoScoreWellnessRuleFormElement>;
	testForms: FormArray<FormGroup<GoScoreTestRuleFormElement>>;
};
