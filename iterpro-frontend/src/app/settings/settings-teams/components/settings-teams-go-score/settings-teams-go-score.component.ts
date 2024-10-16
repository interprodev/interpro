import { NgStyle, NgTemplateOutlet } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthActions, AuthState } from '@iterpro/shared/data-access/auth';
import { Team, TeamApi, TeamSeason } from '@iterpro/shared/data-access/sdk';
import {
	ActionButtonsComponent,
	FormFeedbackComponent,
	IconButtonComponent,
	SkeletonTableComponent
} from '@iterpro/shared/ui/components';
import { PlusDropdownComponent, PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AlertService,
	BlockUiInterceptorService,
	CanComponentDeactivate,
	ErrorService
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { sortBy } from 'lodash';
import { SelectItem } from 'primeng/api';
import { DropdownChangeEvent } from 'primeng/dropdown';
import { first } from 'rxjs';
import { SettingsStore } from '../../../+state/settings.store';
import { SettingsHeaderComponent } from '../../../components/settings-header/settings-header.component';
import { SettingsTeamsDropdownComponent } from '../settings-teams-dropdown/settings-teams-dropdown.component';
import {
	toCommonWellnessFormElement,
	toGoScoreTestFormElement,
	totalGoWeightValidator
} from './models/settings-go-score.form';
import {
	CommonForm,
	GoScoreTestRule,
	GoScoreTestRuleFormElement,
	GoScoreWellnessRule
} from './models/settings-go-score.type';
import { BackgroundColorPipe } from './utils/settings-go-score-color.pipe';

@UntilDestroy()
@Component({
	standalone: true,
	selector: 'iterpro-teams-go-score',
	templateUrl: './settings-teams-go-score.component.html',
	imports: [
		FormsModule,
		ReactiveFormsModule,
		TranslateModule,
		ActionButtonsComponent,
		PrimeNgModule,
		PlusDropdownComponent,
		IconButtonComponent,
		FormFeedbackComponent,
		BackgroundColorPipe,
		SkeletonTableComponent,
		NgStyle,
		NgTemplateOutlet,
		SettingsHeaderComponent,
		SettingsTeamsDropdownComponent
	],
	providers: [BackgroundColorPipe]
})
export class SettingsTeamsGoScoreComponent implements CanComponentDeactivate {
	// Services
	readonly #authStore = inject(Store<AuthState>);
	readonly #error = inject(ErrorService);
	readonly #teamApi = inject(TeamApi);
	readonly #alertService = inject(AlertService);
	readonly #fb = inject(FormBuilder);
	readonly #blockUiInterceptorService = inject(BlockUiInterceptorService);
	readonly settingsStore = inject(SettingsStore);
	// Variables
	readonly flagArray: string[] = ['Green', 'Yellow', 'Red'];
	#selectedTeam: Team;
	currentSeason: TeamSeason;
	testItems: SelectItem[] = [];
	goSettings: Array<GoScoreWellnessRule | GoScoreTestRule>;
	goscoreSettingsForm: FormGroup<CommonForm>;
	saveClicked = false;
	isLoading = true;
	editMode = false;

	constructor() {
		effect(() => {
			if (this.settingsStore.selectedTeam() && this.#selectedTeam?.id !== this.settingsStore.selectedTeam().id) {
				this.isLoading = true;
				if (!this.settingsStore.selectedTeamSeason()) {
					this.#selectedTeam = undefined;
					this.currentSeason = undefined;
					this.goscoreSettingsForm = undefined;
					return this.#alertService.notify('warn', 'preferences', 'alert.noSeasonsFound');
				}
				this.#alertService.clearAll();
				this.#selectedTeam = this.settingsStore.selectedTeam();
				this.goSettings = this.#selectedTeam.goSettings;
				this.extractTestItems();
				this.loadForm();
				this.disableForm();
				setTimeout(() => (this.isLoading = false), 300);
			}
		});
	}

	canDeactivate(): boolean {
		return !this.goscoreSettingsForm.dirty;
	}

	private extractTestItems() {
		const goSettingNames: string[] = (this.#selectedTeam?.goSettings || []).map(
			({ testName, metricName }) => `${testName} - ${metricName}`
		);
		this.testItems = (this.#selectedTeam?.metricsTests || [])
			.filter(({ metricLabel }) => !goSettingNames.includes(metricLabel))
			.map((value: any) => ({ label: value.metricLabel, value }));
	}

	private loadForm(): void {
		const wellness = <GoScoreWellnessRule>{
			...this.#selectedTeam.goSettings.find(({ metricName }) => metricName === 'wellness')
		};
		const others = <Array<GoScoreTestRule>>[
			...this.#selectedTeam.goSettings.filter(({ metricName }) => metricName !== 'wellness')
		];
		this.goscoreSettingsForm = this.#fb.group(toCommonWellnessFormElement(wellness, others));
		this.goscoreSettingsForm.setValidators(totalGoWeightValidator());
	}

	private disableForm(): void {
		if (!this.editMode) {
			this.goscoreSettingsForm.disable();
		}
	}

	edit(): void {
		this.editMode = true;
		this.goscoreSettingsForm.controls.wellnessForm.enable();
		this.goscoreSettingsForm.controls.testForms.enable();
		// disable all weights if not enabled
		this.goscoreSettingsForm.controls.testForms.controls.forEach((element: FormGroup<GoScoreTestRuleFormElement>) => {
			this.toggleRuleSettings(element);
		});
	}

	discard(): void {
		this.saveClicked = false;
		this.editMode = false;
		this.extractTestItems();
		this.goscoreSettingsForm.markAsPristine();
		this.loadForm();
		this.disableForm();
	}

	private getGoSettingsToSave(): Array<GoScoreWellnessRule | GoScoreTestRule> {
		const wellnessValue = this.goscoreSettingsForm.controls.wellnessForm.value as GoScoreWellnessRule;
		const testValues = this.goscoreSettingsForm.controls.testForms.value as GoScoreTestRule[];
		return [wellnessValue, ...testValues];
	}

	save(): void {
		this.saveClicked = true;
		if (!this.goscoreSettingsForm.valid)
			return this.#alertService.notify('warn', 'Settings', 'alert.formNotValid', false);
		this.editMode = false;
		const payload: Array<GoScoreWellnessRule | GoScoreTestRule> = this.getGoSettingsToSave();
		this.goscoreSettingsForm.disable();
		this.goscoreSettingsForm.markAsPristine();
		this.#blockUiInterceptorService
			.disableOnce(this.#teamApi.patchAttributes(this.#selectedTeam.id, { goSettings: payload }))
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.editMode = false;
					this.syncStore({ goSettings: payload });
					this.#alertService.notify('success', 'club.settings', 'alert.recordUpdated', false);
				},
				error: (error: Error) => this.#error.handleError(error)
			});
	}

	removeRule(element: FormGroup<GoScoreTestRuleFormElement>, index: number) {
		// re-add the test to the dropdown - only if still exists
		const metric = this.#selectedTeam.metricsTests.find(
			({ metricName, testName }) => metricName === element.value.metricName && testName === element.value.testName
		);
		if (metric) {
			this.testItems = sortBy([...this.testItems, { label: metric.metricLabel, value: metric }], 'label');
		}
		// remove from form
		this.goscoreSettingsForm.controls.testForms.removeAt(index);
		this.goscoreSettingsForm.markAsDirty();
	}

	addRule(event: DropdownChangeEvent) {
		const testItemToAdd: GoScoreTestRule = event.value;
		this.testItems = [...this.testItems.filter(({ label }) => label !== testItemToAdd.metricLabel)];

		const toAdd: GoScoreTestRule = {
			testId: testItemToAdd.testId,
			metricName: testItemToAdd.metricName,
			testName: testItemToAdd.testName,
			enabled: false,
			weights: {
				go_weight: 0,
				inner: [0, 0, 0]
			}
		};
		const group: FormGroup<GoScoreTestRuleFormElement> = this.#fb.group(toGoScoreTestFormElement(toAdd));
		group.enable();
		this.toggleRuleSettings(group);
		this.goscoreSettingsForm.controls.testForms.push(group);
		this.goscoreSettingsForm.markAsDirty();
	}

	toggleRuleSettings(element: FormGroup<GoScoreTestRuleFormElement>) {
		const enabled = element.get('enabled').value;
		enabled ? element.get('weights').enable() : element.get('weights').disable();
	}

	private syncStore(teamPayload: Partial<Team>) {
		this.settingsStore.updateTeamById(this.settingsStore.selectedTeamId(), teamPayload);
		this.#authStore.dispatch(
			AuthActions.performPatchTeam({ teamId: this.settingsStore.selectedTeamId(), team: teamPayload })
		);
	}
}
