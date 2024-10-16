import {Customer,
	CustomerTeamSettings, CustomMetric,
	DeviceMetricDescriptor,
	Team,
	TestMetric, TreatmentMetric
} from '@iterpro/shared/data-access/sdk';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { IterproTeamModule, IterproUserPermission } from '@iterpro/shared/data-access/permissions';

export type TeamMetricsForm = {
	// CustomerTeamSettings Metrics
	metricsPerformance: FormGroup<DeviceMetricDescriptorFormControl>
	metricsTeamTactical: FormGroup<DeviceMetricDescriptorFormControl>
	metricsIndividualTactical: FormGroup<DeviceMetricDescriptorFormControl>
	// Team Metrics
	drillThemes: FormGroup<CustomMetricFormControl>
	drillTacticalGoals: FormGroup<CustomMetricFormControl>
	drillPhysicalGoals: FormGroup<CustomMetricFormControl>
	drillTechnicalGoals: FormGroup<CustomMetricFormControl>
	playerAttributes: FormGroup<CustomMetricFormControl>
	metricsTests: FormGroup<TestMetricFormControl>
	treatmentMetrics: FormGroup<TreatmentMetricFormControl>
};

export type TeamMetricsMapped = {
	// CustomerTeamSettings Metrics
	metricsPerformance: DeviceMetricDescriptorMapped;
	metricsTeamTactical: DeviceMetricDescriptorMapped;
	metricsIndividualTactical: DeviceMetricDescriptorMapped;
	// Team Metrics
	drillThemes: DrillMetricMapped;
	drillTacticalGoals: DrillMetricMapped;
	drillPhysicalGoals: DrillMetricMapped;
	drillTechnicalGoals: DrillMetricMapped;
	playerAttributes: DrillMetricMapped;
	metricsTests: TestMetricsMapped;
	treatmentMetrics: TreatmentMetricsMapped;
}

export type DeviceMetricDescriptorFormControl = {
	available: FormArray<FormControl<DeviceMetricDescriptor>>;
	active: FormArray<FormControl<DeviceMetricDescriptor>>;
}

export type CustomMetricFormControl = {
	available: FormArray<FormControl<CustomMetric>>;
	active: FormArray<FormControl<CustomMetric>>;
}

export type TestMetricFormControl = {
	available: FormArray<FormControl<TestMetric>>;
	active: FormArray<FormControl<TestMetric>>;
}
export type TreatmentMetricFormControl = {
	available: FormArray<FormControl<TreatmentMetric>>;
	active: FormArray<FormControl<TreatmentMetric>>;
}

export type TeamMetricsFormControls = DeviceMetricDescriptorFormControl | CustomMetricFormControl | TestMetricFormControl | TreatmentMetricFormControl;

export type CustomerTeamMetrics = Pick<CustomerTeamSettings, 'metricsPerformance' | 'metricsTeamTactical' | 'metricsIndividualTactical'>;
export type CustomerTeamMetricType = 'metricsPerformance' | 'metricsTeamTactical' | 'metricsIndividualTactical';

export type TeamMetrics = Pick<Team, 'drillThemes' | 'drillTacticalGoals' | 'drillPhysicalGoals'
	| 'drillTechnicalGoals' | 'playerAttributes' | 'metricsTests' | 'treatmentMetrics'>;

export type TeamMetricType = 'drillThemes' | 'drillTacticalGoals' | 'drillPhysicalGoals' | 'drillTechnicalGoals' | 'playerAttributes' | 'metricsTests' | 'treatmentMetrics';

export type TeamMetricState = 'available' | 'active';

export interface DeviceMetricDescriptorMapped {available: DeviceMetricDescriptor[], active: DeviceMetricDescriptor[]}
export interface DrillMetricMapped {available: CustomMetric[], active: CustomMetric[]}
export interface TestMetricsMapped {available: TestMetric[], active: TestMetric[]}
export interface TreatmentMetricsMapped {available: TreatmentMetric[], active: TreatmentMetric[]}
export type SectionTitleType = 'preferences.metrics.gps' | 'preferences.metrics.tactical'
| 'preferences.metrics.drillsAttributes' | 'preferences.testMetrics' | 'preferences.treatments';

export interface MetricTypeBase {
	sectionTitle: SectionTitleType;
	applyTo?: {
		onlyAdmin?: boolean;
		userPermission?: IterproUserPermission;
		selectedTypes: TeamMetricType[] | CustomerTeamMetricType[]
	},
	items: {
		teamPermission?: IterproTeamModule;
		title: string,
		value: TeamMetricType | CustomerTeamMetricType,
		filterLabel: 'label' | 'metricLabel',
		filterValue: 'value' | 'metricName',
		description: string,
		availableLabel: string;
		activeGroupBy?: string;
		editable?: boolean;
		validators?: {
			minMetrics: number,
			maxMetrics: number,
			suffixLabel?: string,
			minError?: string,
			maxError?: string,
			customError?: string
		}
	}[]
}
export const MAX_METRICS = 28;
export const MIN_METRICS = 10;
export const MAX_TESTS = 15;
export const MIN_TESTS = 5;

export const MAX_PROFILE_ATTRIBUTES_PER_CATEGORY = 10;
export const MIN_PROFILE_ATTRIBUTES_PER_CATEGORY = 6;

export const MAX_PROFILE_ATTRIBUTES_TIPSS = 10;
export const MIN_PROFILE_ATTRIBUTES_TIPSS = 5;

export const customerTeamMetricGroup: MetricTypeBase[] = [
	{
		sectionTitle: 'preferences.metrics.gps',
		applyTo: {
			onlyAdmin: true,
			userPermission: 'import-data',
			selectedTypes: ['metricsPerformance'],
		},
		items: [
			{
				title: 'preferences.performanceMetrics',
				value: 'metricsPerformance',
				teamPermission: 'import-data',
				description: 'preferences.performanceMetrics.description',
				filterLabel: 'metricLabel',
				filterValue: 'metricName',
				availableLabel: 'tooltip.available',
				validators: {
					minMetrics: MIN_METRICS,
					maxMetrics: MAX_METRICS,
					minError: 'alert.minPerfMetrics',
					maxError: 'alert.maxPerfMetrics',
				}
			}
		]
	},
	{
		sectionTitle: 'preferences.metrics.tactical',
		applyTo: {
			onlyAdmin: true,
			userPermission: 'tactics',
			selectedTypes: ['metricsIndividualTactical', 'metricsTeamTactical']
		},
		items: [
			{
				title: 'preferences.individualTacticalMetrics',
				value: 'metricsIndividualTactical',
				teamPermission: 'tactics',
				description: 'preferences.individualTacticalMetrics.description',
				filterLabel: 'metricLabel',
				filterValue: 'metricName',
				availableLabel: 'tooltip.available',
				validators: {
					minMetrics: MIN_METRICS,
					maxMetrics: MAX_METRICS,
					minError: 'alert.minIndTacticsMetrics',
					maxError: 'alert.maxIndTacticsMetrics',
				}
			},
			{
				title: 'preferences.teamTacticalMetrics',
				value: 'metricsTeamTactical',
				teamPermission: 'tactics',
				description: 'preferences.teamTacticalMetrics.description',
				filterLabel: 'metricLabel',
				filterValue: 'metricName',
				availableLabel: 'tooltip.available',
				validators: {
					minMetrics: MIN_METRICS,
					maxMetrics: MAX_METRICS,
					minError: 'alert.minTeamTacticsMetrics',
					maxError: 'alert.maxTeamTacticsMetrics',
				}
			}
		]
	},
];

// The Swiss (tipss) logic can be removed because it is not used in the application since the new Game Report Template Logic
export function toTeamMetricGroup(playerDescription: 'attributes' | 'tipss'): MetricTypeBase[] {
	const isTipss = playerDescription === 'tipss';
	return [
		{
			sectionTitle: 'preferences.metrics.drillsAttributes',
			applyTo: {
				onlyAdmin: true,
				selectedTypes: ['drillThemes', 'drillTacticalGoals', 'drillPhysicalGoals', 'drillTechnicalGoals', 'playerAttributes'],
			},
			items: [
				{
					title: 'preferences.drillThemes',
					value: 'drillThemes',
					filterLabel: 'label',
					filterValue: 'value',
					description: 'preferences.drillThemes.description',
					availableLabel: 'tooltip.available',
					editable: true
				},
				{
					title: 'preferences.drillTacticalGoals',
					value: 'drillTacticalGoals',
					filterLabel: 'label',
					filterValue: 'value',
					description: 'preferences.drillTacticalGoals.description',
					availableLabel: 'tooltip.available',
					editable: true
				},
				{
					title: 'preferences.drillPhysicalGoals',
					value: 'drillPhysicalGoals',
					filterLabel: 'label',
					filterValue: 'value',
					description: 'preferences.drillPhysicalGoals.description',
					availableLabel: 'tooltip.available',
					editable: true
				},
				{
					title: 'preferences.drillTechnicalGoals',
					value: 'drillTechnicalGoals',
					filterLabel: 'label',
					filterValue: 'value',
					description: 'preferences.drillTechnicalGoals.description',
					availableLabel: 'tooltip.available',
					editable: true
				},
				{
					title: 'preferences.attributes',
					value: 'playerAttributes',
					filterLabel: 'label',
					filterValue: 'value',
					description: isTipss ? null : 'preferences.attributes.description',
					availableLabel: 'tooltip.available',
					activeGroupBy: isTipss ? null : 'category',
					editable: false,
					validators: {
						minMetrics: isTipss ? MIN_PROFILE_ATTRIBUTES_TIPSS : MIN_PROFILE_ATTRIBUTES_PER_CATEGORY,
						maxMetrics: isTipss ? MAX_PROFILE_ATTRIBUTES_TIPSS : MAX_PROFILE_ATTRIBUTES_PER_CATEGORY,
						suffixLabel: isTipss ? null : 'preferences.attributes.perCategory',
						minError: isTipss ? 'alert.minTipssAttributes' : null,
						maxError: isTipss ? 'alert.maxTipssAttributes' : null,
						customError: isTipss ? null : 'alert.checkThisCategory',
					}
				}
			]
		},
		{
			sectionTitle: 'preferences.testMetrics',
			applyTo: {
				onlyAdmin: true,
				selectedTypes: ['metricsTests'],
			},
			items: [
				{
					title: 'preferences.testMetrics',
					teamPermission: 'tests',
					value: 'metricsTests',
					filterLabel: 'metricLabel',
					filterValue: 'metricName',
					description: null,
					availableLabel: 'tooltip.available',
					editable: false,
					validators: {
						minMetrics: MIN_TESTS,
						maxMetrics: MAX_TESTS,
						minError: 'alert.minTestMetrics',
						maxError: 'alert.maxTestMetrics',
					}
				},
			]
		},
		{
			sectionTitle: 'preferences.treatments',
			applyTo: {
				onlyAdmin: true,
				selectedTypes: ['treatmentMetrics'],
			},
			items: [
				{
					title: 'preferences.treatments',
					value: 'treatmentMetrics',
					filterLabel: 'label',
					filterValue: 'value',
					description: 'preferences.treatments.description',
					availableLabel: 'tooltip.available',
					editable: true
				},
			]
		}
	];
}


export interface CustomerToDialog extends Customer {
	tempTargetTeamSettings: CustomerTeamSettings;
}

export interface FormRequiredPayload {
	isAdmin: boolean;
	permissions: {
		importData: boolean;
		tactics: boolean;
		tests: boolean;
	}
	playerDescription: 'attributes' | 'tipss';
}
