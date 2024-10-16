import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Customer, Injury, InjuryAssessment } from '@iterpro/shared/data-access/sdk';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { filter } from 'rxjs/operators';

/** LEVELS */
export const LEVELS = {
	normal: 'medical.infirmary.injury.assessment.normal',
	abnormal: 'medical.infirmary.injury.assessment.abnormal',
	notApplicable: 'medical.infirmary.injury.assessment.notApplicable'
} as const;
export type LevelType = (typeof LEVELS)[keyof typeof LEVELS];

/** SWELLING */
export const SWELLINGS = {
	none: 'medical.infirmary.injury.assessment.none',
	mild: 'medical.infirmary.injury.assessment.mild',
	moderate: 'medical.infirmary.injury.assessment.moderate',
	severe: 'medical.infirmary.injury.assessment.severe'
} as const;
export type SwellingType = (typeof SWELLINGS)[keyof typeof SWELLINGS];

@UntilDestroy()
@Component({
	templateUrl: './edit-assessment.component.html',
	styleUrls: ['./edit-assessment.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditAssessmentComponent implements OnInit {
	assessmentForm: FormGroup;
	injury: Injury | undefined;
	assessment: InjuryAssessment | undefined;
	today: Date = new Date();
	tomorrow: Date = new Date();
	customers: Customer[];
	currentUserId: string;
	// OPTIONS
	levelItems: SelectItem<string>[];
	swellingItems: SelectItem<string>[];

	constructor(
		private readonly dialogRef: DynamicDialogRef,
		private readonly config: DynamicDialogConfig,
		private readonly fb: FormBuilder,
		private readonly translateService: TranslateService
	) {
		this.assessment = this.config.data.assessment as InjuryAssessment;
		this.injury = this.config.data.injury as Injury;
		this.customers = this.config.data.customers as Customer[];
		this.currentUserId = this.config.data.currentUserId as string;
		this.levelItems = this.initLevelItems();
		this.swellingItems = this.initSwellingItems();
		this.tomorrow.setDate(this.today.getDate() + 1);
	}

	ngOnInit(): void {
		this.createForm();
	}

	reset(): void {
		this.assessmentForm.reset();
	}

	discard(): void {
		this.dialogRef.close();
	}

	save(): void {
		const assessment: InjuryAssessment = this.fromFormGroup();
		this.dialogRef.close(assessment);
	}

	// --> TEXTAREA
	// putAtBeginning() {
	// 	const input = document.getElementById('$notes');
	// 	input.scrollTop = 0;
	// 	return input;
	// }

	private fromFormGroup(): InjuryAssessment {
		const isNew = !this.assessment?.id;
		return Object.assign(this.assessmentForm.value, {
			id: !isNew ? this.assessment.id : null,
			injuryId: this.injury.id,
			authorId: this.assessmentForm.getRawValue()?.authorId
		});
	}

	private createForm(): void {
		// Assessment form
		this.assessmentForm = this.fb.group({
			date: [new Date(), Validators.required],
			authorId: [this.currentUserId],
			rom: [],
			strength: [],
			stability: [],
			swelling: [],
			pain: [0, Validators.required],
			functionality: [0, Validators.required],
			notes: [],
			next: [],
			highPriority: [],
			available: ['yes', Validators.required],
			further: [],
			expectation: []
		});

		// Check on value changes
		this.onFurtherChange();
		this.onExpectationChange();
		this.onAvailableChange();

		// Init with assessment
		if (this.assessment) this.initFormValues();
	}

	private initFormValues(): void {
		this.assessmentForm.patchValue(this.assessment);
	}

	private onFurtherChange(): void {
		this.assessmentForm
			.get('further')
			.valueChanges.pipe(untilDestroyed(this))
			.subscribe(further =>
				this.assessmentForm.patchValue({
					expectation: further ? null : this.tomorrow
				})
			);
	}

	private onExpectationChange(): void {
		this.assessmentForm
			.get('expectation')
			.valueChanges.pipe(
				untilDestroyed(this),
				filter(expectation => !!expectation)
			)
			.subscribe(() =>
				this.assessmentForm.patchValue({
					further: false
				})
			);
	}

	private onAvailableChange(): void {
		this.assessmentForm
			.get('available')
			.valueChanges.pipe(untilDestroyed(this))
			.subscribe(available =>
				this.assessmentForm.patchValue({
					further: available === 'no'
				})
			);
	}

	private initLevelItems(): SelectItem<string>[] {
		return [
			...Object.values(LEVELS).map(level => ({
				label: this.translateService.instant(level),
				value: level
			}))
		];
	}

	private initSwellingItems(): SelectItem<string>[] {
		return [
			...Object.values(SWELLINGS).map(swelling => ({
				label: this.translateService.instant(swelling),
				value: swelling
			}))
		];
	}
}
