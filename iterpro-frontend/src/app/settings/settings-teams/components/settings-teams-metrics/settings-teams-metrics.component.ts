import { NgStyle, NgTemplateOutlet } from '@angular/common';
import { Component, Injector, effect, inject } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthActions, AuthState } from '@iterpro/shared/data-access/auth';
import { ChangelogService } from '@iterpro/shared/data-access/changelog';
import {
	CustomMetric,
	Customer,
	CustomerApi,
	CustomerTeamSettings,
	CustomerTeamSettingsApi,
	DeviceMetricDescriptor,
	EntityChangelog,
	Team,
	TeamApi,
	Test,
	TestApi,
	TestMetric,
	TreatmentMetric
} from '@iterpro/shared/data-access/sdk';
import {
	ActionButtonsComponent,
	EntityChangelogTableComponent,
	FormFeedbackComponent,
	IconButtonComponent,
	ItemsGroup,
	SelectionDialogComponent,
	SkeletonAccordionComponent
} from '@iterpro/shared/ui/components';
import { ArrayFromNumberPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AlertService,
	AzureStoragePipe,
	BlockUiInterceptorService,
	CanComponentDeactivate,
	CustomTreatmentService,
	DEFAULT_PERSON_IMAGE_BASE64,
	ErrorService,
	algoMetrics,
	attributes,
	drillsThemeMetrics,
	getTeamSettings,
	physicalGoalsMetrics,
	sortByName,
	tacticalGoalsMetrics,
	tipss
} from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { cloneDeep, flatten, sortBy, values } from 'lodash';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { DynamicDialogRef } from 'primeng/dynamicdialog/dynamicdialog-ref';
import { PickListMoveToTargetEvent } from 'primeng/picklist';
import { Observable, first, forkJoin, pairwise } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { CustomerTeam, SettingsStore } from '../../../+state/settings.store';
import { SettingsHeaderComponent } from '../../../components/settings-header/settings-header.component';
import { SettingsTeamsDropdownComponent } from '../settings-teams-dropdown/settings-teams-dropdown.component';
import { AttributeEditComponent } from './components/attribute-edit/attribute-edit.component';
import { DrillAttributeBlackList } from './components/attribute-edit/models/attribute.type';
import { DrillMetricEditComponent } from './components/drill-metric-edit/drill-metric-edit.component';
import { TreatmentMetricBlackList } from './components/treatment-metric-edit/models/treatment-edit.type';
import { TreatmentMetricEditComponent } from './components/treatment-metric-edit/treatment-metric-edit.component';
import { toPlayerAttributesMetricFormGroup, toTeamMetricsForm } from './models/settings-team-metrics.form';
import {
	CustomMetricFormControl,
	CustomerTeamMetricType,
	CustomerTeamMetrics,
	CustomerToDialog,
	DeviceMetricDescriptorMapped,
	DrillMetricMapped,
	FormRequiredPayload,
	MetricTypeBase,
	SectionTitleType,
	TeamMetricState,
	TeamMetricType,
	TeamMetrics,
	TeamMetricsForm,
	TeamMetricsFormControls,
	TestMetricsMapped,
	TreatmentMetricFormControl,
	TreatmentMetricsMapped,
	customerTeamMetricGroup,
	toTeamMetricGroup
} from './models/settings-team-metrics.type';
import { PicklistHeaderLabelPipePipe } from './pipes/picklist-header-label.pipe';

@UntilDestroy()
@Component({
	standalone: true,
	selector: 'iterpro-teams-metrics',
	templateUrl: './settings-teams-metrics.component.html',
	imports: [
		PrimeNgModule,
		TranslateModule,
		FormFeedbackComponent,
		ReactiveFormsModule,
		ActionButtonsComponent,
		IconButtonComponent,
		NgTemplateOutlet,
		PicklistHeaderLabelPipePipe,
		NgStyle,
		ArrayFromNumberPipe,
		SkeletonAccordionComponent,
		SettingsHeaderComponent,
		SettingsTeamsDropdownComponent
	],
	providers: [CustomTreatmentService]
})
export class SettingsTeamsMetricsComponent extends EtlBaseInjectable implements CanComponentDeactivate {
	// Services
	readonly #errorService = inject(ErrorService);
	readonly #teamApi = inject(TeamApi);
	readonly #testApi = inject(TestApi);
	readonly #customerTeamSettingsApi = inject(CustomerTeamSettingsApi);
	readonly #customerApi = inject(CustomerApi);
	readonly #translateService = inject(TranslateService);
	readonly #confirmationService = inject(ConfirmationService);
	readonly #dialogService = inject(DialogService);
	readonly #alertService = inject(AlertService);
	readonly #customTreatmentService = inject(CustomTreatmentService);
	readonly #changelogService = inject(ChangelogService);
	readonly #azureStoragePipe = inject(AzureStoragePipe);
	readonly #authStore = inject(Store<AuthState>);
	readonly #fb = inject(FormBuilder);
	readonly #blockUiInterceptorService = inject(BlockUiInterceptorService);
	readonly settingsStore = inject(SettingsStore);
	// Variables
	teamMetricsForm: FormGroup<TeamMetricsForm>;
	#selectedTeam: Team;
	currentCustomer: CustomerTeam;
	customerTeamMetricGroup: MetricTypeBase[] = customerTeamMetricGroup;
	teamMetricGroup: MetricTypeBase[];
	#globalTests: Test[] = [];
	editMode = false;
	isLoading = true;
	menuItems: MenuItem[] = [
		{ label: 'settings.yourMetrics', command: () => (this.activeMenu = this.menuItems[0]), id: 'yourMetrics' },
		{
			label: 'settings.globalTeamMetrics',
			command: () => (this.activeMenu = this.menuItems[1]),
			id: 'globalTeamMetrics'
		}
	];
	activeMenu: MenuItem = this.menuItems[0];
	#formRequiredPayload: FormRequiredPayload;
	constructor(injector: Injector) {
		super(injector);
		effect(() => {
			if (
				this.settingsStore.selectedTeam() &&
				this.#selectedTeam?.id !== this.settingsStore.selectedTeam()?.id &&
				this.settingsStore.currentCustomer() &&
				this.settingsStore.scoutingSettings()
			) {
				this.isLoading = true;
				this.#selectedTeam = this.settingsStore.selectedTeam();
				this.currentCustomer = this.settingsStore.currentCustomer();
				this.initAll();
			}
		});
	}

	canDeactivate(): boolean {
		return !this.teamMetricsForm.dirty;
	}

	private initAll() {
		this.teamMetricGroup = toTeamMetricGroup(this.settingsStore.scoutingSettings().playerDescription);
		this.initTestMetrics();
	}

	//region Init Form
	private loadForm(metricsTests: TestMetricsMapped) {
		const customerTeamSettings = this.getCurrentUserTeamSettings();
		const drillsMetrics = this.initDrillsMetrics();
		const playerAttributes = this.initPlayerProfileAttributes(drillsMetrics.drillTechnicalGoals.active);
		const treatmentMetrics = this.initTreatmentMetrics();
		this.#formRequiredPayload = {
			isAdmin: this.currentCustomer.admin,
			permissions: {
				importData: this.settingsStore.teamHasPermission('import-data'),
				tactics: this.settingsStore.teamHasPermission('tactics'),
				tests: this.settingsStore.teamHasPermission('tests')
			},
			playerDescription: this.settingsStore.scoutingSettings().playerDescription
		};
		this.teamMetricsForm = this.#fb.group<TeamMetricsForm>(
			toTeamMetricsForm(
				{
					metricsPerformance: this.initGPSMetrics(customerTeamSettings),
					metricsTeamTactical: this.initTeamTacticalMetrics(customerTeamSettings),
					metricsIndividualTactical: this.initIndividualTacticalMetrics(customerTeamSettings),
					drillThemes: drillsMetrics.drillThemes,
					drillTacticalGoals: drillsMetrics.drillTacticalGoals,
					drillPhysicalGoals: drillsMetrics.drillPhysicalGoals,
					drillTechnicalGoals: drillsMetrics.drillTechnicalGoals,
					metricsTests,
					treatmentMetrics,
					playerAttributes
				},
				this.#formRequiredPayload
			)
		);
		this.listenForDrillTechnicalGoalsChanges();
		this.isLoading = false;
	}
	//endregion

	//region GPS Metrics
	private initGPSMetrics(customerTeamSettings: CustomerTeamSettings): DeviceMetricDescriptorMapped {
		const errorMappingsMetrics = [];
		let availablePerformanceMetrics = this.getGPSRawMetricsForTeam(this.settingsStore.selectedTeam());
		const activePerformanceMetrics = (customerTeamSettings.metricsPerformance || []).map(metric => {
			const found = this.etlGpsService.getMetricsMapping().find(({ metricName }) => metricName === metric);
			if (!found) {
				errorMappingsMetrics.push(metric);
			}
			return found;
		});
		availablePerformanceMetrics = availablePerformanceMetrics.filter(
			item => !(customerTeamSettings.metricsPerformance || []).includes(item.metricName)
		);
		if (errorMappingsMetrics.length > 0) {
			console.error(
				`There is an error on mapping these metrics: ${errorMappingsMetrics.map(metric => metric).join(' , ')}`
			);
		}
		return { available: availablePerformanceMetrics, active: activePerformanceMetrics };
	}

	private getGPSRawMetricsForTeam(team: Team): any[] {
		return [
			...team._gpsProviderMapping.rawMetrics.map(
				({ label, name }) =>
					new DeviceMetricDescriptor({
						metricLabel: label,
						algo: false,
						metricName: name.replace(/\./g, '_'),
						defaultValue: 1
					})
			),
			...this.getAlgorithmsMetrics()
		];
	}

	private getAlgorithmsMetrics(): DeviceMetricDescriptor[] {
		algoMetrics.forEach(metric => {
			metric.metricName = metric.metricName.replace(/\./g, '_');
		});
		return algoMetrics;
	}
	//endregion

	//region Team Tactical Metrics
	private initTeamTacticalMetrics(customerTeamSettings: CustomerTeamSettings): {
		available: DeviceMetricDescriptor[];
		active: DeviceMetricDescriptor[];
	} {
		let availableTeamTacticalMetrics = this.etlTeamService.getMetricsMapping();
		const activeTeamTacticalMetrics = (customerTeamSettings.metricsTeamTactical || []).map(metric =>
			availableTeamTacticalMetrics.find(({ metricName }) => metricName === metric)
		);
		availableTeamTacticalMetrics = availableTeamTacticalMetrics.filter(
			item => !(customerTeamSettings.metricsTeamTactical || []).includes(item.metricName)
		);
		return { available: availableTeamTacticalMetrics, active: activeTeamTacticalMetrics };
	}
	//endregion

	//region Individual Tactical Metrics
	private initIndividualTacticalMetrics(customerTeamSettings: CustomerTeamSettings): {
		available: DeviceMetricDescriptor[];
		active: DeviceMetricDescriptor[];
	} {
		let availableIndividualTacticalMetrics = this.etlPlayerService.getMetricsMapping();
		const activeIndividualTacticalMetrics = (customerTeamSettings.metricsIndividualTactical || []).map(metric =>
			availableIndividualTacticalMetrics.find(({ metricName }) => metricName === metric)
		);
		availableIndividualTacticalMetrics = availableIndividualTacticalMetrics.filter(
			item => !(customerTeamSettings.metricsIndividualTactical || []).includes(item.metricName)
		);
		return { available: availableIndividualTacticalMetrics, active: activeIndividualTacticalMetrics };
	}
	//endregion

	//region Drill Metrics
	private initDrillsMetrics(): {
		drillThemes: DrillMetricMapped;
		drillPhysicalGoals: DrillMetricMapped;
		drillTacticalGoals: DrillMetricMapped;
		drillTechnicalGoals: DrillMetricMapped;
	} {
		let team = this.settingsStore.selectedTeam();
		if (!team.drillThemes || team.drillThemes.length === 0) {
			team = { ...team, drillThemes: drillsThemeMetrics };
		}
		if (!team.drillTacticalGoals || team.drillTacticalGoals.length === 0) {
			team = { ...team, drillTacticalGoals: tacticalGoalsMetrics };
		}
		if (!team.drillPhysicalGoals || team.drillPhysicalGoals.length === 0) {
			team = { ...team, drillPhysicalGoals: physicalGoalsMetrics };
		}
		if (!team.drillTechnicalGoals || team.drillTechnicalGoals.length === 0) {
			team = {
				...team,
				drillTechnicalGoals: sortBy(
					[
						...flatten(values(attributes)).map(x => ({
							value: x.name,
							label: x.title,
							custom: false,
							active: true,
							category: x.category,
							description: x.tooltip
						})),
						...(team.playerAttributes || []).filter(({ custom }) => custom)
					],
					'category'
				)
			};
		}
		return {
			drillThemes: {
				available: team.drillThemes.filter(({ active }) => !active),
				active: team.drillThemes.filter(({ active }) => active)
			},
			drillPhysicalGoals: {
				available: team.drillPhysicalGoals.filter(({ active }) => !active),
				active: team.drillPhysicalGoals.filter(({ active }) => active)
			},
			drillTacticalGoals: {
				available: team.drillTacticalGoals.filter(({ active }) => !active),
				active: team.drillTacticalGoals.filter(({ active }) => active)
			},
			drillTechnicalGoals: {
				available: team.drillTechnicalGoals.filter(({ active }) => !active),
				active: team.drillTechnicalGoals.filter(({ active }) => active)
			}
		};
	}
	//endregion

	//region Player Profile Attributes
	private listenForDrillTechnicalGoalsChanges() {
		const activeTechnicalGoals = this.teamMetricsForm.controls.drillTechnicalGoals.controls.active;
		activeTechnicalGoals.valueChanges
			.pipe(
				untilDestroyed(this),
				// Emit the previous and current values as pairs
				pairwise(),
				// Only proceed if the lengths of the previous and current values are different
				distinctUntilChanged(([prev, curr]) => prev.length === curr.length)
			)
			.subscribe({
				next: ([previous, drillTechnicalActiveGoals]) => {
					const playerAttributes = this.initPlayerProfileAttributes(drillTechnicalActiveGoals);
					this.teamMetricsForm.controls.playerAttributes = toPlayerAttributesMetricFormGroup(
						playerAttributes,
						this.#formRequiredPayload,
						false
					);
					this.teamMetricsForm.markAsDirty();
				}
			});
	}
	private initPlayerProfileAttributes(drillTechnicalActiveGoals: CustomMetric[]): DrillMetricMapped {
		const teamPlayerAttributes: CustomMetric[] = this.#selectedTeam?.playerAttributes || [];
		const filteredTeamPlayerAttributes = teamPlayerAttributes.filter(({ value }) =>
			drillTechnicalActiveGoals.map(x => x.value).includes(value)
		);
		const filteredDrillTechnicalGoals: CustomMetric[] = drillTechnicalActiveGoals.filter(
			({ active, value }) => active && !teamPlayerAttributes.map(x => x.value).includes(value)
		);
		const playerAttributes: CustomMetric[] = sortBy(
			[...filteredTeamPlayerAttributes, ...filteredDrillTechnicalGoals],
			'category'
		);
		return this.scaffoldPlayerProfileAttributes(playerAttributes, drillTechnicalActiveGoals);
	}

	private scaffoldPlayerProfileAttributes(
		playerAttributes: CustomMetric[],
		drillTechnicalActiveGoals: CustomMetric[]
	): DrillMetricMapped {
		const scoutingSettings = this.settingsStore.scoutingSettings();
		if (scoutingSettings.playerDescription === 'tipss') {
			const activeTipss = tipss.filter(({ value }) => scoutingSettings.tipssSettings.enabled.includes(value));
			const availableTipss = tipss.filter(({ value }) => !scoutingSettings.tipssSettings.enabled.includes(value));
			return { active: activeTipss, available: availableTipss };
		} else {
			let activeAttributes = playerAttributes.filter(({ active }) => active);
			const inactiveAttributes = playerAttributes.filter(({ active }) => !active);
			const filteredActive = activeAttributes.filter(metric =>
				drillTechnicalActiveGoals.map(({ value }) => value).includes(metric.value)
			);
			activeAttributes = [...sortBy(filteredActive, 'category')];
			const filteredInactive = inactiveAttributes.filter(metric =>
				drillTechnicalActiveGoals.map(({ value }) => value).includes(metric.value)
			);

			const availableAttributes = [...sortBy(filteredInactive, 'category')];
			return { active: activeAttributes, available: availableAttributes };
		}
	}
	//endregion

	//region Test Metrics
	private initTestMetrics() {
		this.#blockUiInterceptorService
			.disableOnce(this.#testApi.find({ where: { teamId: { inq: [this.#selectedTeam.id, 'GLOBAL'] } } }))
			.pipe(
				first(),
				untilDestroyed(this),
				map((result: Test[]) => {
					if (!this.settingsStore.teamHasPermission('examination')) {
						result = result.filter(({ medical }) => !medical);
					}
					this.#globalTests = sortByName(
						(result || []).filter(({ teamId }) => teamId === 'GLOBAL'),
						'name'
					);
					let availableTestMetrics = this.testToMetrics(result);
					const activeTestMetrics: TestMetric[] = [];
					let metricsTests = this.#selectedTeam.metricsTests || [];
					metricsTests.forEach((metric: TestMetric) => {
						const found = availableTestMetrics.find(({ metricLabel }) => metricLabel === metric.metricLabel);
						if (found && !this.hasTestMetric(activeTestMetrics, found)) activeTestMetrics.push(found);
					});
					availableTestMetrics = availableTestMetrics.filter(
						item => !metricsTests.find(({ metricLabel }) => metricLabel === item.metricLabel)
					);
					return { availableTestMetrics, activeTestMetrics };
				})
			)
			.subscribe({
				next: ({ availableTestMetrics, activeTestMetrics }) => {
					this.loadForm({ available: availableTestMetrics, active: activeTestMetrics });
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	private testToMetrics(tests: Test[]): TestMetric[] {
		const metrics: TestMetric[] = [];
		tests.forEach(test => {
			if (test.customFields) {
				const customFields = test.customFields.map(field => (typeof field === 'string' ? field : field.value)).sort();
				customFields.forEach(field => {
					metrics.push({
						testId: test.id,
						testName: test.name,
						metricLabel: test.name + ' - ' + field,
						metricName: field,
						purpose: test.purpose
					});
				});
			}
		});
		return metrics;
	}

	private hasTestMetric(activeTestMetrics: TestMetric[], found: TestMetric): boolean {
		return activeTestMetrics.some(
			metric =>
				String(metric.testId) === String(found.testId) &&
				String(metric.testName) === String(found.testName) &&
				String(metric.metricLabel) === String(found.metricLabel) &&
				String(metric.metricName) === String(found.metricName) &&
				String(metric.purpose) === String(found.purpose)
		);
	}
	//endregion

	//region Treatment Metrics
	private initTreatmentMetrics(): TreatmentMetricsMapped {
		let treatmentMetrics: TreatmentMetric[] = this.#selectedTeam.treatmentMetrics;
		if (!treatmentMetrics || treatmentMetrics.length === 0) {
			treatmentMetrics = this.#customTreatmentService.defaultTreatments();
		}
		const activeTreatments = treatmentMetrics.filter(({ active }) => active);
		const availableTreatments = treatmentMetrics.filter(({ active }) => !active);
		return { available: availableTreatments, active: activeTreatments };
	}
	//endregion

	//region Form Utils
	onMoveTo(
		formArrayName: TeamMetricType,
		filterValue: 'value' | 'metricName',
		toTarget: boolean,
		event: PickListMoveToTargetEvent
	) {
		const selectedMetricsNames = event.items.map(a => a[filterValue]);
		const sourceField = toTarget ? 'available' : 'active';
		const targetField = toTarget ? 'active' : 'available';
		// move item from available to active formArray
		// remove item from available formArray
		const indexToRemove: number[] = [];
		const toMove: FormControl<TeamMetricsFormControls>[] = [];
		this.teamMetricsForm.controls[formArrayName].controls[sourceField].controls.forEach((control, index) => {
			if (selectedMetricsNames.includes(control.value[filterValue])) {
				(control as FormControl<CustomMetric>).patchValue({ ...control.value, active: toTarget });
				toMove.push(control);
				indexToRemove.push(index);
				return true;
			}
			return false;
		});
		this.removeSelectedControls(
			indexToRemove,
			this.teamMetricsForm.controls[formArrayName].controls[sourceField] as unknown as FormArray<
				FormControl<TeamMetricsFormControls>
			>
		);
		toMove.forEach(control => {
			(
				this.teamMetricsForm.controls[formArrayName].controls[targetField] as unknown as FormArray<
					FormControl<TeamMetricsFormControls>
				>
			).push(control);
		});
		this.teamMetricsForm.markAsDirty();
		this.teamMetricsForm.updateValueAndValidity();
	}

	removeMetric(formArrayName: TeamMetricType, metric: CustomMetric) {
		const { index, state } = this.getItemIndexAndState(formArrayName, metric);
		this.teamMetricsForm.controls[formArrayName].controls[state].removeAt(index);
		this.teamMetricsForm.markAsDirty();
	}

	private indexFromState(
		formArrayName: TeamMetricType,
		metric: CustomMetric | TreatmentMetric,
		state: TeamMetricState
	): number {
		return (
			this.teamMetricsForm.controls[formArrayName].controls[state] as FormArray<FormControl<CustomMetric>>
		).value.findIndex(({ value }) => value === metric.value);
	}

	private getItemIndexAndState(
		formArrayName: TeamMetricType,
		metric: CustomMetric | TreatmentMetric
	): { index: number; state: TeamMetricState } {
		const indexActive = this.indexFromState(formArrayName, metric, 'active');
		const indexAvailable = this.indexFromState(formArrayName, metric, 'available');
		const state = indexActive !== -1 ? 'active' : 'available';
		const index = indexActive !== -1 ? indexActive : indexAvailable;
		return { index, state };
	}

	private removeSelectedControls(
		indexesToRemove: number[],
		formArrayItems: FormArray<FormControl<TeamMetricsFormControls>>
	): void {
		// Remove controls from the FormArray based on indexesToRemove, iterating in reverse order
		for (let i = indexesToRemove.length - 1; i >= 0; i--) {
			const index = indexesToRemove[i];
			formArrayItems.removeAt(index);
		}
	}

	//endregion

	//region Drill Metric Edit Dialog / Attribute Edit Dialog
	editCustomMetric(formArrayName: TeamMetricType, metric?: CustomMetric | TreatmentMetric) {
		this.editMode = true;
		this.openCustomMetricEditDialog(formArrayName, metric);
	}

	private openCustomMetricEditDialog(formArrayName: TeamMetricType, metric?: CustomMetric | TreatmentMetric) {
		const ref = this.createMetricEditDialog(formArrayName, metric);
		ref.onClose.subscribe((editedMetric: CustomMetric | TreatmentMetric) => {
			if (editedMetric) {
				const isNew = !metric;
				if (isNew) {
					const value =
						formArrayName === 'treatmentMetrics'
							? { ...editedMetric, custom: true, id: uuid() }
							: { ...editedMetric, custom: true };
					(
						this.teamMetricsForm.controls[formArrayName].controls.available as FormArray<
							FormControl<CustomMetric | TreatmentMetric>
						>
					).push(new FormControl<CustomMetric | TreatmentMetric>({ value, disabled: false }));
				} else {
					const { index, state } = this.getItemIndexAndState(formArrayName, metric);
					this.teamMetricsForm.controls[formArrayName].controls[state].value[index] = editedMetric;
				}
				this.teamMetricsForm.markAsDirty();
			}
		});
	}

	private getCustomMetricBlacklist(
		field: 'value' | 'label',
		formArrayName: TeamMetricType,
		metric?: CustomMetric
	): string[] {
		const activeValues = (
			this.teamMetricsForm.controls[formArrayName] as FormGroup<CustomMetricFormControl>
		).value.active
			.map(item => item[field])
			.filter(value => !metric || value !== metric[field]);
		const availableValues = (
			this.teamMetricsForm.controls[formArrayName] as FormGroup<CustomMetricFormControl>
		).value.available
			.map(item => item[field])
			.filter(value => !metric || value !== metric[field]);
		return [...activeValues, ...availableValues];
	}

	private getTreatmentsBlacklist(
		field: 'value' | 'label',
		formArrayName: TeamMetricType,
		metric?: TreatmentMetric
	): TreatmentMetricBlackList[] {
		const activeValues = (
			this.teamMetricsForm.controls[formArrayName] as FormGroup<TreatmentMetricFormControl>
		).value.active
			.map(item => ({ value: item[field], category: item.category, type: item.type }))
			.filter(
				item =>
					!metric || (item.value !== metric[field] && item.category !== metric?.category && item.type !== metric?.type)
			);
		const availableValues = (
			this.teamMetricsForm.controls[formArrayName] as FormGroup<TreatmentMetricFormControl>
		).value.available
			.map(item => ({ value: item[field], category: item.category, type: item.type }))
			.filter(
				item =>
					!metric || (item.value !== metric[field] && item.category !== metric?.category && item.type !== metric?.type)
			);
		return [...activeValues, ...availableValues];
	}

	private getDrillAttributeBlacklist(
		field: 'value' | 'label',
		formArrayName: TeamMetricType,
		metric?: CustomMetric
	): DrillAttributeBlackList[] {
		const activeValues = (
			this.teamMetricsForm.controls[formArrayName] as FormGroup<CustomMetricFormControl>
		).value.active
			.map(item => ({ value: item[field], category: item.category }))
			.filter(item => !metric || (item.value !== metric[field] && item.category !== metric?.category));
		const availableValues = (
			this.teamMetricsForm.controls[formArrayName] as FormGroup<CustomMetricFormControl>
		).value.available
			.map(item => ({ value: item[field], category: item.category }))
			.filter(item => !metric || (item.value !== metric[field] && item.category !== metric?.category));
		const attributesValues = flatten(values(attributes)).map(({ name, category }) => ({
			value: this.#translateService.instant('profile.attributes.' + name),
			category
		}));
		return [...activeValues, ...availableValues, ...attributesValues];
	}

	private createMetricEditDialog(
		formArrayName: TeamMetricType,
		metric?: CustomMetric | TreatmentMetric
	): DynamicDialogRef {
		switch (formArrayName) {
			case 'drillThemes':
				const drillThemeTBlackListValues = this.getCustomMetricBlacklist(
					'value',
					formArrayName,
					metric as CustomMetric
				);
				const drillThemeTBlackListLabels = this.getCustomMetricBlacklist(
					'label',
					formArrayName,
					metric as CustomMetric
				);
				return this.createDrillMetricEditDialog(
					'preference.metric.addDrillTheme',
					'preference.metric.editDrillTheme',
					'preference.metric.drillThemeValue',
					'preference.metric.drillThemeLabel',
					metric as CustomMetric,
					drillThemeTBlackListValues,
					drillThemeTBlackListLabels
				);
			case 'drillTacticalGoals':
				const drillTacticalTBlackListValues = this.getCustomMetricBlacklist(
					'value',
					formArrayName,
					metric as CustomMetric
				);
				const drillTacticalTBlackListLabels = this.getCustomMetricBlacklist(
					'label',
					formArrayName,
					metric as CustomMetric
				);
				return this.createDrillMetricEditDialog(
					'preferences.metrics.addDrillTacticalGoal',
					'preferences.metrics.editDrillTacticalGoal',
					'preferences.metrics.tacticalGoalValue',
					'preferences.metrics.tacticalGoalLabel',
					metric as CustomMetric,
					drillTacticalTBlackListValues,
					drillTacticalTBlackListLabels
				);
			case 'drillPhysicalGoals':
				const drillPhyBlacklistValues = this.getCustomMetricBlacklist('value', formArrayName, metric as CustomMetric);
				const drillPhyBlacklistLabels = this.getCustomMetricBlacklist('label', formArrayName, metric as CustomMetric);
				return this.createDrillMetricEditDialog(
					'preferences.metrics.addDrillPhysicalGoal',
					'preferences.metrics.editDrillPhysicalGoal',
					'preferences.metrics.physicalGoalValue',
					'preferences.metrics.physicalGoalLabel',
					metric as CustomMetric,
					drillPhyBlacklistValues,
					drillPhyBlacklistLabels
				);
			case 'drillTechnicalGoals':
				const drillTechBlacklistValues = this.getDrillAttributeBlacklist(
					'value',
					formArrayName,
					metric as CustomMetric
				);
				const drillTechBlacklistLabels = this.getDrillAttributeBlacklist(
					'label',
					formArrayName,
					metric as CustomMetric
				);
				return this.createDrillAttributeEditDialog(
					'preferences.metrics.addDrillTechnicalGoal',
					'preferences.metrics.editDrillTechnicalGoal',
					'preferences.metrics.technicalGoalValue',
					'preferences.metrics.technicalGoalLabel',
					metric as CustomMetric,
					drillTechBlacklistValues,
					drillTechBlacklistLabels
				);
			case 'treatmentMetrics':
				const treatmentBlacklistValues = this.getTreatmentsBlacklist('value', formArrayName, metric as TreatmentMetric);
				const treatmentBlacklistLabels = this.getTreatmentsBlacklist('label', formArrayName, metric as TreatmentMetric);
				return this.createTreatmentMetricEditDialog(
					metric as TreatmentMetric,
					treatmentBlacklistValues,
					treatmentBlacklistLabels
				);
			default:
				console.error('not supported implementation for: ', formArrayName);
				break;
		}
	}

	private createDrillMetricEditDialog(
		newHeader: string,
		editHeader: string,
		metricValue: string,
		metricLabel: string,
		drillMetric?: CustomMetric,
		alreadyUsedValues: string[] = [],
		alreadyUsedLabels: string[] = []
	): DynamicDialogRef {
		const baseLabel = drillMetric ? editHeader : newHeader;
		const header = this.#translateService.instant(baseLabel);
		return this.#dialogService.open(DrillMetricEditComponent, {
			data: {
				drillMetric,
				editMode: this.editMode,
				metricLabel: this.#translateService.instant(metricLabel),
				metricValue: this.#translateService.instant(metricValue),
				alreadyUsedValues,
				alreadyUsedLabels
			},
			width: '50%',
			height: '40%',
			header,
			closable: true,
			modal: true,
			contentStyle: { overflowY: 'unset' },
			styleClass: 'dialog-header-padding-2 dialog-content-padding-2 dialog-shark-theme'
		});
	}

	private createDrillAttributeEditDialog(
		newHeader: string,
		editHeader: string,
		attributeValue: string,
		attributeLabel: string,
		attribute?: CustomMetric,
		alreadyUsedValues: DrillAttributeBlackList[] = [],
		alreadyUsedLabels: DrillAttributeBlackList[] = []
	): DynamicDialogRef {
		const baseLabel = attribute ? editHeader : newHeader;
		const header = this.#translateService.instant(baseLabel);
		return this.#dialogService.open(AttributeEditComponent, {
			data: {
				attribute,
				editMode: this.editMode,
				attributeLabel: this.#translateService.instant(attributeLabel),
				attributeValue: this.#translateService.instant(attributeValue),
				alreadyUsedValues,
				alreadyUsedLabels
			},
			width: '50%',
			height: '60%',
			header,
			closable: true,
			modal: true,
			contentStyle: { overflowY: 'unset' },
			styleClass: 'dialog-header-padding-2 dialog-content-padding-2 dialog-shark-theme'
		});
	}

	private createTreatmentMetricEditDialog(
		treatment?: TreatmentMetric,
		alreadyUsedValues: TreatmentMetricBlackList[] = [],
		alreadyUsedLabels: TreatmentMetricBlackList[] = []
	): DynamicDialogRef {
		const baseLabel = treatment ? 'preferences.treatments.edit' : 'preferences.treatments.add';
		const header = this.#translateService.instant(baseLabel);
		return this.#dialogService.open(TreatmentMetricEditComponent, {
			data: {
				treatment,
				currentUserId: this.settingsStore.currentCustomer().id,
				editMode: this.editMode,
				alreadyUsedValues,
				alreadyUsedLabels
			},
			width: '50%',
			height: '60%',
			header,
			closable: true,
			modal: true,
			contentStyle: { overflowY: 'unset' },
			styleClass: 'dialog-header-padding-2 dialog-content-padding-2 dialog-shark-theme'
		});
	}
	//endregion

	//#region Apply To Menu

	openApplyToCustomerMenu(selectedTypes: CustomerTeamMetricType[] | TeamMetricType[], section: SectionTitleType) {
		const sectionLabel = this.#translateService.instant(section);
		this.openApplyToCustomerDialog(sectionLabel, selectedTypes as CustomerTeamMetricType[]);
	}

	openApplyToTeamMenu(
		section?: SectionTitleType,
		selectedTypes?: TeamMetricType[] | CustomerTeamMetricType[],
		includeCurrentTeamOnSelection?: boolean,
		includeTeamCustomers?: boolean
	) {
		const sectionLabel = section ? `${this.#translateService.instant(section)}: ` : null;
		const dialogSubtitle = sectionLabel
			? sectionLabel
			: this.#translateService.instant('confirm.selectTeamsToApplyMetricsTo.subtitle');
		this.openApplyToTeamDialog(
			sectionLabel,
			dialogSubtitle,
			selectedTypes as TeamMetricType[],
			includeCurrentTeamOnSelection,
			includeTeamCustomers
		);
	}
	//endregion

	//#region Apply To Customers (gps metrics and tactical metrics)
	private openApplyToCustomerDialog(sectionLabel: string, selectedTypes: CustomerTeamMetricType[]) {
		const dialogRef = this.createCustomerSelectionDialog(sectionLabel);
		const conversation$ = dialogRef.onClose.pipe(
			untilDestroyed(this),
			filter((selectedCustomers: CustomerToDialog[]) => !!selectedCustomers)
		);
		conversation$.subscribe((customers: CustomerToDialog[]) =>
			this.applyToCustomerConfirmed(customers, selectedTypes, sectionLabel)
		);
	}

	private createCustomerSelectionDialog(sectionLabel: string): DynamicDialogRef {
		const itemsGroups: ItemsGroup[] = (this.settingsStore.teams() || []).map((team: Team) => ({
			groupName: team.name,
			groupItems:
				(this.settingsStore.clubCustomers() || [])
					.filter(
						({ id }) =>
							!(id === this.settingsStore.currentCustomer().id && team.id === this.settingsStore.selectedTeamId())
					)
					.filter(({ teamSettings }) => teamSettings.find(({ teamId }) => teamId === team.id))
					.map(customer => ({
						label:
							`${customer.firstName} ${customer.lastName}` +
							(customer.id === this.settingsStore.currentCustomer().id
								? ` (${this.#translateService.instant('settings.preferences.currentUser')})`
								: ''),
						value: {
							...customer,
							itemUrl:
								customer?.downloadUrl && this.#azureStoragePipe.transform(customer?.downloadUrl)
									? this.#azureStoragePipe.transform(customer?.downloadUrl)
									: DEFAULT_PERSON_IMAGE_BASE64,
							tempTargetTeamSettings: getTeamSettings(customer.teamSettings, team.id)
						}
					})) || []
		}));
		return this.#dialogService.open(SelectionDialogComponent, {
			header: this.#translateService.instant('confirm.selectUsersToApplyMetricsTo'),
			data: {
				isMultipleSelection: true,
				itemsGroups,
				subtitle: sectionLabel
			},
			contentStyle: { overflow: 'auto' },
			styleClass: 'dialog-header-padding-2 dialog-content-padding-2 dialog-shark-theme'
		});
	}

	private applyToCustomerConfirmed(
		customersApplyTo: CustomerToDialog[],
		selectedTypes: CustomerTeamMetricType[],
		sectionLabel: string
	) {
		if (customersApplyTo?.length === 0) return;
		const currentUserTeamSettings: CustomerTeamSettings = this.getCurrentUserTeamSettings();
		const currentTeamName = this.settingsStore.selectedTeamName();
		const currentUserName = `${this.settingsStore.currentCustomer().firstName} ${this.settingsStore.currentCustomer().lastName}`;
		this.#confirmationService.confirm({
			message: this.#translateService.instant('userMetrics.applyTo', {
				sourceValue: `${currentUserName} ${currentTeamName}`,
				targetValue: customersApplyTo.map(({ firstName, lastName }) => `${firstName} ${lastName}`).join(', ')
			}),
			header: 'IterPRO',
			accept: async () => {
				this.applyToCustomers(currentUserTeamSettings, customersApplyTo, selectedTypes, sectionLabel);
			}
		});
	}

	private applyToCustomers(
		currentUserTeamSettings: CustomerTeamSettings,
		customersApplyTo: CustomerToDialog[],
		selectedTypes: CustomerTeamMetricType[],
		sectionLabel: string
	) {
		if (customersApplyTo?.length === 0) return;
		const fieldsToUpdate: Partial<CustomerTeamSettings> = this.getCustomerFieldsToUpdate(
			currentUserTeamSettings,
			selectedTypes
		);
		const customerObs$ = [];
		customersApplyTo.forEach(targetCustomer => {
			const targetTeamSettings: CustomerTeamSettings = cloneDeep(targetCustomer.tempTargetTeamSettings);
			customerObs$.push(
				this.#customerTeamSettingsApi.patchAttributes(targetTeamSettings.id, {
					...fieldsToUpdate
				})
			);
			const customerChangelog: EntityChangelog = this.getCustomerChangelog(sectionLabel);
			customerObs$.push(this.#customerApi.createChangelog(targetCustomer.id, customerChangelog));
		});
		this.#blockUiInterceptorService
			.disableOnce(forkJoin(customerObs$))
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: result => {
					customersApplyTo.forEach(c => {
						this.settingsStore.updateClubCustomerSettingById(c.id, c.tempTargetTeamSettings.teamId, {
							...fieldsToUpdate
						});
					});
					this.#alertService.notify('success', 'preferences', 'alert.settingsUpdated');
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	private getCustomerChangelog(sectionLabel: string): EntityChangelog {
		const allCustomerMetricsLabels: string[] = ['preferences.metrics.gps', 'preferences.metrics.tactical'];
		const baseLabel = sectionLabel
			? `${sectionLabel}`
			: allCustomerMetricsLabels.map(label => this.#translateService.instant(label)).join(', ');
		return new EntityChangelog({
			date: new Date(),
			authorId: this.settingsStore.currentCustomer().id,
			description: `${baseLabel}`
		});
	}

	private getCustomerFieldsToUpdate(
		currentUserTeamSettings: CustomerTeamSettings,
		selectedTypes?: CustomerTeamMetricType[]
	): Partial<CustomerTeamSettings> {
		const types = selectedTypes
			? selectedTypes
			: ['metricsPerformance', 'metricsIndividualTactical', 'metricsTeamTactical'];
		const fieldsToUpdate: Partial<CustomerTeamSettings> = {};
		for (const type of types) {
			fieldsToUpdate[type] = currentUserTeamSettings[type];
		}
		return fieldsToUpdate;
	}

	private getCurrentUserTeamSettings(): CustomerTeamSettings {
		return getTeamSettings(this.settingsStore.currentCustomer().teamSettings, this.settingsStore.selectedTeamId());
	}
	//#endregion

	//#region Apply To Teams (drill & attributes and test & treatments)
	private openApplyToTeamDialog(
		sectionLabel?: string,
		dialogSubtitle?: string,
		selectedTypes?: TeamMetricType[],
		includeCurrentTeamOnSelection?: boolean,
		includeTeamCustomers?: boolean
	) {
		const dialogRef = this.createTeamSelectionDialog(includeCurrentTeamOnSelection, dialogSubtitle);
		const closeRef$ = dialogRef.onClose.pipe(
			untilDestroyed(this),
			filter(selectedTeam => !!selectedTeam)
		);
		closeRef$.subscribe((teams: Team[]) =>
			this.applyToTeamConfirmed(teams, selectedTypes, includeTeamCustomers, sectionLabel)
		);
	}

	private createTeamSelectionDialog(includeCurrentTeamOnSelection: boolean, dialogSubtitle: string): DynamicDialogRef {
		const itemsGroups: ItemsGroup[] = [
			{
				groupName: this.#translateService.instant('Teams'),
				groupItems:
					(this.settingsStore.teams() || [])
						.filter(({ id }) => includeCurrentTeamOnSelection || id !== this.#selectedTeam.id)
						.map(team => ({
							label:
								`${team.name}` +
								(team.id === this.settingsStore.selectedTeamId()
									? ` (${this.#translateService.instant('settings.preferences.selectedTeam')})`
									: ''),
							value: {
								...team
							}
						})) || []
			}
		];
		return this.#dialogService.open(SelectionDialogComponent, {
			header: this.#translateService.instant('confirm.selectTeamsToApplyMetricsTo'),
			data: {
				isMultipleSelection: true,
				itemsGroups,
				subtitle: dialogSubtitle
			},
			contentStyle: { overflow: 'auto' }
		});
	}

	private applyToTeamConfirmed(
		teamsApplyTo: Team[],
		selectedTypes?: TeamMetricType[],
		includeTeamCustomers?: boolean,
		sectionLabel?: string
	) {
		if (teamsApplyTo?.length === 0) return;
		this.#confirmationService.confirm({
			message: this.#translateService.instant('teamMetrics.applyTo', {
				sourceValue: `${this.#selectedTeam.name}`,
				targetValue: teamsApplyTo.map(({ name }) => `${name}`).join(', ')
			}),
			header: 'IterPRO',
			accept: async () => {
				this.applyToTeams(this.settingsStore.selectedTeam(), teamsApplyTo, selectedTypes, includeTeamCustomers, sectionLabel);
			}
		});
	}

	private applyToTeams(
		currentTeam: Team,
		teamsApplyTo: Team[],
		selectedTypes?: TeamMetricType[],
		includeTeamCustomers?: boolean,
		teamSectionLabel?: string
	) {
		if (teamsApplyTo?.length === 0) return;
		const teamObs$ = [];
		teamsApplyTo.map(targetTeam => {
			if (targetTeam.id !== this.#selectedTeam.id) {
				const fieldsToUpdate = this.getTeamFieldsToUpdate(currentTeam, targetTeam, selectedTypes);
				teamObs$.push(this.#teamApi.patchAttributes(targetTeam.id, { ...fieldsToUpdate }));
				this.settingsStore.updateTeamById(targetTeam.id, { ...fieldsToUpdate });
				const teamChangelog: EntityChangelog = this.getTeamChangelog(teamSectionLabel);
				teamObs$.push(this.#teamApi.createChangelog(targetTeam.id, teamChangelog));
			}
			if (includeTeamCustomers) {
				const fieldsToUpdate: Partial<CustomerTeamSettings> = this.getCustomerFieldsToUpdate(
					this.getCurrentUserTeamSettings(),
					undefined
				);
				const teamCustomers: CustomerTeam[] = this.settingsStore
					.clubCustomers()
					.filter(
						({ id }) =>
							!(id === this.settingsStore.currentCustomer().id && targetTeam.id === this.settingsStore.selectedTeamId())
					)
					.filter(({ teamSettings }) => teamSettings.find(({ teamId }) => teamId === targetTeam.id));
				for (const targetCustomer of teamCustomers) {
					const targetTeamSettings: CustomerTeamSettings = getTeamSettings(targetCustomer.teamSettings, targetTeam.id);
					teamObs$.push(
						this.#customerTeamSettingsApi.patchAttributes(targetTeamSettings.id, {
							...fieldsToUpdate
						})
					);
					this.settingsStore.updateClubCustomerSettingById(targetCustomer.id, targetTeamSettings.teamId, {
						...fieldsToUpdate
					});
					const customerChangelog: EntityChangelog = this.getCustomerChangelog(undefined);
					teamObs$.push(this.#customerApi.createChangelog(targetCustomer.id, customerChangelog));
				}
			}
		});
		this.#blockUiInterceptorService
			.disableOnce(forkJoin(teamObs$))
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: result => {
					this.#alertService.notify('success', 'preferences', 'alert.settingsUpdated');
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	private getTeamChangelog(sectionLabel: string): EntityChangelog {
		const allTeamMetricsLabels: string[] = [
			'preferences.metrics.drillsAttributes',
			'preferences.metrics.testsTreatments'
		];
		const currentTeamName = this.settingsStore.selectedTeamName();
		const baseLabel = sectionLabel
			? `${sectionLabel}`
			: allTeamMetricsLabels.map(label => this.#translateService.instant(label)).join(', ');
		return new EntityChangelog({
			date: new Date(),
			authorId: this.currentCustomer.id,
			description: `${baseLabel} from ${currentTeamName}`
		});
	}

	private getTeamFieldsToUpdate(currentTeam: Team, targetTeam: Team, selectedTypes?: TeamMetricType[]): Partial<Team> {
		const types = selectedTypes
			? selectedTypes
			: [
					'drillThemes',
					'drillTacticalGoals',
					'drillPhysicalGoals',
					'drillTechnicalGoals',
					'playerAttributes',
					'metricsTests',
					'treatmentMetrics'
				];
		const fieldsToUpdate: Partial<CustomerTeamSettings> = {};
		for (const type of types) {
			if (type === 'metricsTests') {
				fieldsToUpdate[type] = this.getMetricTestToCopy(currentTeam, targetTeam);
			} else {
				fieldsToUpdate[type] = currentTeam[type];
			}
		}
		return fieldsToUpdate;
	}
	private getMetricTestToCopy(currentTeam: Team, targetTeam: Team): TestMetric[] {
		const globalTestIds: string[] = this.#globalTests.map(({ id }) => id);
		const activeGlobalMetrics: TestMetric[] = (currentTeam.metricsTests || []).filter(({ testId }) =>
			globalTestIds.includes(testId)
		);
		const targetTeamTestMetrics: TestMetric[] = this.testToMetrics(targetTeam?.tests);
		const customMetrics: TestMetric[] = (targetTeamTestMetrics || [])
			.filter(({ testId }) => !globalTestIds.includes(testId))
			.filter(({ testName, metricName, metricLabel }) =>
				currentTeam.metricsTests.find(
					(currentTeamMetric: TestMetric) =>
						currentTeamMetric.testName === testName &&
						currentTeamMetric.metricName === metricName &&
						currentTeamMetric.metricLabel === metricLabel
				)
			);
		return [...activeGlobalMetrics, ...customMetrics];
	}
	//#endregion

	//#region EntityChangeLog
	openEntityChangelogDialog(): DynamicDialogRef {
		const { admin, id: userId } = this.currentCustomer;
		const changelog$: Observable<EntityChangelog[]> = admin
			? this.#changelogService.getAdminEntitiesChangelog(userId, ['Customer', 'Team'])
			: this.#changelogService.getEntitiesChangelog([userId, this.#selectedTeam.id]);
		return this.#dialogService.open(EntityChangelogTableComponent, {
			data: {
				changelog: changelog$,
				customers: this.settingsStore.clubCustomers(),
				teams: this.settingsStore.teams()
			},
			width: '70%',
			header: this.#translateService.instant('changeHistory'),
			closable: true
		});
	}
	//endregion

	//region Edit / Discard / Save
	edit() {
		this.editMode = true;
		this.teamMetricsForm.enable();
	}

	discard() {
		this.editMode = false;
		this.teamMetricsForm.markAsPristine();
		this.initAll();
	}

	save() {
		if (!this.teamMetricsForm.valid) return this.#alertService.notify('warn', 'Settings', 'alert.formNotValid', false);
		const customerTeamPayload: CustomerTeamMetrics = {
			metricsPerformance: this.teamMetricsForm.value.metricsPerformance.active.map(({ metricName }) => metricName),
			metricsTeamTactical: this.teamMetricsForm.value.metricsTeamTactical.active.map(({ metricName }) => metricName),
			metricsIndividualTactical: this.teamMetricsForm.value.metricsIndividualTactical.active.map(
				({ metricName }) => metricName
			)
		};
		const teamPayload: TeamMetrics = {
			drillThemes: [
				...this.teamMetricsForm.value.drillThemes.active,
				...this.teamMetricsForm.value.drillThemes.available
			],
			drillTacticalGoals: [
				...this.teamMetricsForm.value.drillTacticalGoals.active,
				...this.teamMetricsForm.value.drillTacticalGoals.available
			],
			drillPhysicalGoals: [
				...this.teamMetricsForm.value.drillPhysicalGoals.active,
				...this.teamMetricsForm.value.drillPhysicalGoals.available
			],
			drillTechnicalGoals: [
				...this.teamMetricsForm.value.drillTechnicalGoals.active,
				...this.teamMetricsForm.value.drillTechnicalGoals.available
			],
			playerAttributes: this.teamMetricsForm.value.playerAttributes.active,
			metricsTests: this.teamMetricsForm.value.metricsTests.active,
			treatmentMetrics: [
				...this.teamMetricsForm.value.treatmentMetrics.active,
				...this.teamMetricsForm.value.treatmentMetrics.available
			]
		};
		this.editMode = false;
		this.teamMetricsForm.markAsPristine();
		const customerTeamSettings = this.getCurrentUserTeamSettings();
		const obs$ = [
			this.#customerTeamSettingsApi.patchAttributes(customerTeamSettings.id, customerTeamPayload),
			this.#teamApi.patchAttributes(this.#selectedTeam.id, teamPayload)
		];
		this.#blockUiInterceptorService
			.disableOnce(forkJoin(obs$))
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.settingsStore.updateTeamById(this.settingsStore.selectedTeamId(), teamPayload);
					const updatedCustomer: Customer = {
						...(this.settingsStore.currentCustomer() as Customer),
						teamSettings: this.settingsStore
							.currentCustomer()
							.teamSettings.map(teamSetting =>
								teamSetting.teamId === customerTeamSettings.teamId
									? { ...teamSetting, ...customerTeamPayload }
									: teamSetting
							)
					};
					this.settingsStore.updateClubCustomer(updatedCustomer);
					this.#authStore.dispatch(
						AuthActions.performPatchTeam({
							teamId: this.settingsStore.selectedTeamId(),
							team: { ...this.#selectedTeam, ...teamPayload }
						})
					);
					this.#authStore.dispatch(AuthActions.performPatchCustomer({ customer: updatedCustomer }));
					this.#alertService.notify('success', 'preferences.metrics', 'alert.settingsUpdated', false);
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	//endregion

	stop(e: Event) {
		e.stopPropagation();
	}
}

function findInvalidFormGroups(form: FormGroup<TeamMetricsForm>): string[] {
	const invalidFormGroups: string[] = [];

	Object.keys(form).forEach((key) => {
		const formGroup = form[key as keyof TeamMetricsForm] as FormGroup;
		if (formGroup.invalid) {
			invalidFormGroups.push(key);
		}
	});

	return invalidFormGroups;
}
