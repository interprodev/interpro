import { Component, inject } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AlertService } from '@iterpro/shared/utils/common-utils';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { toDrillAttributeForm } from './models/attribute.form';
import { DrillAttributeBlackList, DrillAttributeForm } from './models/attribute.type';
import { DialogFooterButtonsComponent, FormFeedbackComponent } from '@iterpro/shared/ui/components';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { SelectItem } from 'primeng/api';
import { CustomMetric } from '@iterpro/shared/data-access/sdk';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UniqueValuesErrorPipe } from '@iterpro/shared/ui/pipes';

@UntilDestroy()
@Component({
	selector: 'iterpro-attribute-edit',
	standalone: true,
	imports: [
		FormFeedbackComponent,
		ReactiveFormsModule,
		TranslateModule,
		PrimeNgModule,
		DialogFooterButtonsComponent,
		UniqueValuesErrorPipe
	],
	templateUrl: './attribute-edit.component.html'
})
export class AttributeEditComponent {
	// Services
	readonly #ref: DynamicDialogRef = inject(DynamicDialogRef);
	readonly #config: DynamicDialogConfig = inject(DynamicDialogConfig);
	readonly #alertService: AlertService = inject(AlertService);
	readonly #translateService: TranslateService = inject(TranslateService);
	readonly #fb: FormBuilder = inject(FormBuilder);
	// Input Properties
	#attribute: CustomMetric;
	editMode: boolean;
	attributeLabel: string;
	attributeValue: string;
	alreadyUsedValues: DrillAttributeBlackList[] = [];
	alreadyUsedLabels: DrillAttributeBlackList[] = [];
	// Variables
	attributeForm: FormGroup<DrillAttributeForm>;
	saveClicked = false;
	attributesCategoriesOptions: SelectItem[];
	constructor() {
		this.loadCategoryOptions();
		if (this.#config.data) {
			this.#attribute = this.#config.data.attribute;
			this.editMode = this.#config.data.editMode;
			this.attributeLabel = this.#config.data.attributeLabel;
			this.attributeValue = this.#config.data.attributeValue;
			this.alreadyUsedValues = this.#config.data.alreadyUsedValues;
			this.alreadyUsedLabels = this.#config.data.alreadyUsedLabels;
		}
		this.loadForm();
	}

	private loadCategoryOptions() {
		this.attributesCategoriesOptions = [
			{
				label: this.#translateService.instant('profile.attributes.offensive'),
				value: 'offensive'
			},
			{
				label: this.#translateService.instant('profile.attributes.defensive'),
				value: 'defensive'
			},
			{
				label: this.#translateService.instant('profile.attributes.attitude'),
				value: 'attitude'
			}
		]
	}


	private loadForm() {
		this.attributeForm = this.#fb.group(toDrillAttributeForm(this.alreadyUsedValues, this.alreadyUsedLabels));
		this.#attribute ? this.attributeForm.patchValue(this.#attribute) : this.attributeForm.reset();
		if (this.editMode) {
			this.attributeForm.enable();
		}
		this.listenForAttributeValueValidation();
		this.listenForAttributeLabelValidation();
	}

	onConfirm() {
		this.saveClicked = true;
		if (!this.attributeForm.valid)
			return this.#alertService.notify('warn', 'Settings', 'alert.formNotValid', false);
		this.#ref.close(this.fromFormGroup());
	}

	onDiscard() {
		this.#ref.close();
	}

	private fromFormGroup(): CustomMetric {
		const jsonPayload = this.attributeForm.getRawValue();
		return Object.assign(jsonPayload, {
			custom: this.#attribute?.custom,
			active: this.#attribute?.active,
		});
	}

	private listenForAttributeValueValidation() {
		const categoryControl = this.attributeForm.controls.category;
		const valueControl = this.attributeForm.controls.value;
		categoryControl.valueChanges.pipe(untilDestroyed(this)).subscribe({
			next: () => valueControl.updateValueAndValidity()
		});
	}

	private listenForAttributeLabelValidation() {
		const categoryControl = this.attributeForm.controls.category;
		const labelControl = this.attributeForm.controls.label;
		categoryControl.valueChanges.pipe(untilDestroyed(this)).subscribe({
			next: () => labelControl.updateValueAndValidity()
		});
	}
}
