import { Component, inject } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AlertService, AzureStoragePipe } from '@iterpro/shared/utils/common-utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelectItem } from 'primeng/api';
import { TreatmentMetricBlackList, TreatmentMetricForm } from './models/treatment-edit.type';
import { Attachment, MEDICAL_FIELDS, TreatmentMetric, TreatmentMetricType } from '@iterpro/shared/data-access/sdk';
import {
	DialogFooterButtonsComponent,
	FormFeedbackComponent,
	IconButtonComponent,
	IconModalPreviewComponent
} from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { NgTemplateOutlet } from '@angular/common';
import { CloudUploadComponent } from '@iterpro/shared/feature-components';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { toTreatmentMetricEditForm } from './models/treatment-edit.form';
import { UniqueValuesErrorPipe } from '@iterpro/shared/ui/pipes';

@UntilDestroy()
@Component({
	selector: 'iterpro-treatment-metric-edit',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		FormFeedbackComponent,
		PrimeNgModule,
		TranslateModule,
		AzureStoragePipe,
		IconModalPreviewComponent,
		IconButtonComponent,
		CloudUploadComponent,
		NgTemplateOutlet,
		DialogFooterButtonsComponent,
		UniqueValuesErrorPipe
	],
	templateUrl: './treatment-metric-edit.component.html'
})
export class TreatmentMetricEditComponent {
	// Services
	readonly #ref: DynamicDialogRef = inject(DynamicDialogRef);
	readonly #config: DynamicDialogConfig = inject(DynamicDialogConfig);
	readonly #alertService: AlertService = inject(AlertService);
	readonly #translateService: TranslateService = inject(TranslateService);
	// Input Properties
	#treatment: TreatmentMetric;
	#currentUserId: string;
	editMode: boolean;
	alreadyUsedValues: TreatmentMetricBlackList[] = [];
	alreadyUsedLabels: TreatmentMetricBlackList[] = [];
	// Variables
	#fb: FormBuilder = inject(FormBuilder);
	treatmentMetricForm: FormGroup<TreatmentMetricForm>;
	saveClicked = false;
	treatmentTypesOptions: SelectItem[];
	treatmentCategoriesOptions: SelectItem[] = [];
	attachmentUploadStatus: {
		video: boolean,
		doc: boolean
	} = {
		video: false,
		doc: false
	};

	constructor() {
		this.loadTreatmentTypesOptions();
		this.loadTreatmentCategoryOptions();
		if (this.#config.data) {
			this.#treatment = this.#config.data.treatment;
			this.editMode = this.#config.data.editMode;
			this.#currentUserId = this.#config.data.currentUserId;
			this.alreadyUsedValues = this.#config.data.alreadyUsedValues;
			this.alreadyUsedLabels = this.#config.data.alreadyUsedLabels;
		}
		this.loadForm();
	}

	private loadTreatmentTypesOptions() {
		this.treatmentTypesOptions = [
			{ label: this.#translateService.instant('prevention.treatments.sec'), value: 'sec' },
			{ label: this.#translateService.instant('prevention.treatments.physiotherapy'), value: 'physiotherapy' }
		]
	}

	private loadTreatmentCategoryOptions() {
		const { physiotherapy } = MEDICAL_FIELDS;
		this.treatmentCategoriesOptions = physiotherapy.map(({ label, value }) => ({
			value,
			label: label ? this.#translateService.instant(label) : ''
		}));
	}


	private loadForm() {
		this.treatmentMetricForm = this.#fb.group(toTreatmentMetricEditForm(this.alreadyUsedValues, this.alreadyUsedLabels));
		this.#treatment ? this.treatmentMetricForm.patchValue(this.#treatment) : this.treatmentMetricForm.reset();
		if (this.editMode) {
			this.treatmentMetricForm.enable();
			this.onTreatmentTypeChange();
			this.handleTypeValidation(this.treatmentMetricForm.controls.type.value);
			this.listenForTreatmentValueValidation();
			this.listenForTreatmentLabelValidation();
		}
	}

	onConfirm() {
		this.saveClicked = true;
		if (!this.treatmentMetricForm.valid)
			return this.#alertService.notify('warn', 'Settings', 'alert.formNotValid', false);
		this.#ref.close(this.fromFormGroup());
	}

	onDiscard() {
		this.#ref.close();
	}

	private fromFormGroup(): TreatmentMetric {
		const jsonPayload = this.treatmentMetricForm.getRawValue();
		return Object.assign(jsonPayload, {
			id: this.#treatment?.id,
			custom: this.#treatment?.custom,
			active: this.#treatment?.active,
		});
	}

	//region Attachment upload
	startUploadAttachment(formControlName: 'doc' | 'video') {
		this.attachmentUploadStatus[formControlName] = true;
	};

	addAttachment(formControlName: 'doc' | 'video', downloadUrl: string, url: string, name: string) {
		const attachment = this.createAttachment(downloadUrl, url, name);
		this.treatmentMetricForm.controls[formControlName].setValue(attachment);
		this.attachmentUploadStatus[formControlName] = false;
	};

	private createAttachment(downloadUrl: string, url: string, name: string): Attachment {
		return new Attachment({
			name,
			downloadUrl,
			url,
			date: new Date(),
			authorId: this.#currentUserId
		});
	}

	deleteAttachment(formControlName: 'doc' | 'video') {
		this.treatmentMetricForm.patchValue({ [formControlName]: null });
	}
	// endregion

	private onTreatmentTypeChange(): void {
		this.treatmentMetricForm
			.controls.type
			.valueChanges.pipe(
			untilDestroyed(this),
			filter(treatmentType => !!treatmentType)
		).subscribe({
				next: (value: TreatmentMetricType) => {
					this.handleTypeValidation(value);
				}
			});
	}

	private handleTypeValidation(type: TreatmentMetricType) {
		if (type === 'physiotherapy') {
			this.treatmentMetricForm.controls.category?.setValidators([Validators.required]);
		} else {
			this.treatmentMetricForm.controls.category.patchValue(null);
			this.treatmentMetricForm.controls.category?.clearValidators();
			this.treatmentMetricForm.controls.category?.updateValueAndValidity();
		}
	}

	private listenForTreatmentValueValidation() {
		const typeControl = this.treatmentMetricForm.controls.type;
		const categoryControl = this.treatmentMetricForm.controls.category;
		const valueControl = this.treatmentMetricForm.controls.value;
		typeControl.valueChanges.pipe(untilDestroyed(this)).subscribe({
			next: () => valueControl.updateValueAndValidity()
		});
		categoryControl.valueChanges.pipe(untilDestroyed(this)).subscribe({
			next: () => valueControl.updateValueAndValidity()
		});
	}

	private listenForTreatmentLabelValidation() {
		const typeControl = this.treatmentMetricForm.controls.type;
		const categoryControl = this.treatmentMetricForm.controls.category;
		const labelControl = this.treatmentMetricForm.controls.label;
		typeControl.valueChanges.pipe(untilDestroyed(this)).subscribe({
			next: () => labelControl.updateValueAndValidity()
		});
		categoryControl.valueChanges.pipe(untilDestroyed(this)).subscribe({
			next: () => labelControl.updateValueAndValidity()
		});
	}
}
