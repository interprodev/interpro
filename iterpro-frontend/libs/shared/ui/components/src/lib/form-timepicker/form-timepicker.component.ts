import { Component, inject, Input, OnInit } from '@angular/core';
import { ControlContainer, FormControl, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { SelectItem } from 'primeng/api';
import { generateTimeOptions } from '@iterpro/shared/utils/common-utils';

@Component({
	selector: 'iterpro-form-timepicker',
	standalone: true,
	templateUrl: './form-timepicker.component.html',
	imports: [
		DropdownModule,
		ReactiveFormsModule
	],
	viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }]
})
export class FormTimepickerComponent implements OnInit {
	@Input ({required: true}) controlName!: string;
	@Input() minTime!: string;
	@Input() stepMinutes = 30;
	formControl!: FormControl<string>;
	#formGroupDirective = inject(FormGroupDirective);
	timeOptions!: SelectItem[];
	ngOnInit(): void {
		if (this.stepMinutes < 1 || this.stepMinutes > 60) {
			throw new Error('Step minutes must be between 1 and 60');
		}
		this.timeOptions = generateTimeOptions(this.minTime, this.stepMinutes);
		this.formControl = this.#formGroupDirective.form.get(this.controlName) as FormControl<string>;
	}
}
