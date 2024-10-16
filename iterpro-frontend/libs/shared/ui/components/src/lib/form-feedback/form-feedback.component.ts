import { Component, inject, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormGroupDirective } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
	standalone: true,
	imports: [TranslateModule],
	selector: 'iterpro-form-feedback',
	template: `
		@if (control && control.invalid && (clickedCondition || control.dirty || control.touched)) {
			<div class="tw-text-xs tw-text-red-400">
				@if (type === 'required') {
					{{ 'formField.isRequired' | translate: { value: label } }}
				}
				@if (type === 'custom') {
					{{ label }}
				}
			</div>
		}
	`
})
export class FormFeedbackComponent implements OnInit {
	//Services
	readonly #rootFormGroup = inject(FormGroupDirective);
	@Input({ required: true }) label!: string;
	@Input() field!: string;
	@Input() type: FormFeedbackType = 'required';
	@Input() groupName!: string;
	@Input() clickedCondition = true;
	@Input() control!: FormControl; // If not provided, it will be fetched from the form group

	ngOnInit() {
		if (!this.control) {
			this.updateForm();
		}
	}

	private updateForm() {
		if (this.groupName) {
			this.control = (this.#rootFormGroup.control.get(this.groupName) as FormGroup).get(this.field) as FormControl;
		} else {
			this.control = this.#rootFormGroup.control.get(this.field) as FormControl;
		}
	}
}

export type FormFeedbackType = 'required' | 'custom';
