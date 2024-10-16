import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AlertService } from '@iterpro/shared/utils/common-utils';
import { BasicInputDialogForm, basicInputDialogForm } from './models/basic-input-dialog.form';
import { NgStyle } from '@angular/common';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { DialogFooterButtonsComponent, FormFeedbackComponent } from '@iterpro/shared/ui/components';

@Component({
	selector: 'iterpro-basic-input-dialog',
	standalone: true,
	imports: [
		TranslateModule,
		NgStyle,
		ReactiveFormsModule,
		PrimeNgModule,
		FormFeedbackComponent,
		DialogFooterButtonsComponent
	],
	templateUrl: './basic-input-dialog.component.html',
})
export class BasicInputDialogComponent {
	// Services
	readonly #ref: DynamicDialogRef = inject(DynamicDialogRef);
	readonly #config: DynamicDialogConfig = inject(DynamicDialogConfig);
	readonly #alertService: AlertService = inject(AlertService);
	readonly #fb: FormBuilder = inject(FormBuilder);
	// Input Properties
	label!: string;
	value!: string;
	editMode!: boolean;
	// Variables
	basicForm: FormGroup<BasicInputDialogForm> = this.#fb.nonNullable.group(basicInputDialogForm);
	saveClicked = false;

	constructor() {
		if (this.#config.data) {
			this.label = this.#config.data.label;
			this.value = this.#config.data.value;
			this.editMode = this.#config.data.editMode;
		}
		this.loadForm();
	}

	private loadForm() {
		this.value ? this.basicForm.patchValue({value: this.value}) : this.basicForm.reset();
		if (this.editMode) {
			this.basicForm.enable();
		}
	}

	onConfirm() {
		this.saveClicked = true;
		if (!this.basicForm.valid)
			return this.#alertService.notify('warn', 'Form', 'alert.formNotValid', false);
		this.#ref.close(this.basicForm.getRawValue().value);
	}

	onDiscard() {
		this.basicForm.reset();
	}
}
