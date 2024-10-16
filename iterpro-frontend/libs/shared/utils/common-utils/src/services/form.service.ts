import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Injectable()
export class FormService {
	readonly #fb = inject(FormBuilder);

	newForm(): FormGroup {
		return this.#fb.group({
			title: ['', Validators.required],
			sections: this.#fb.array([], Validators.minLength(1))
		});
	}

	newSection(): FormGroup {
		return this.#fb.group({
			title: ['', Validators.required],
			properties: this.#fb.array([])
		});
	}

	newProperty(): FormGroup {
		return this.#fb.group({
			name: ['', Validators.required],
			type: ['', Validators.required],
			label: ['', Validators.required],
			description: [''],
			range: this.#fb.array([null, null], [Validators.minLength(2), Validators.maxLength(2)]),
			fields: this.#fb.array(['', ''], [Validators.minLength(2), Validators.maxLength(2)]),
			enum: this.#fb.control([], Validators.minLength(1)),
			operation: this.#fb.group({
				name: [''],
				parameters: this.#fb.control([])
			}),
			colorMapping: this.#fb.array([]),
			hasComment: [false]
		});
	}

	newColorMapping(): FormGroup {
		return this.#fb.group({
			color: ['', Validators.required],
			min: [null],
			max: [null],
			values: this.#fb.control([]),
			label: ['']
		});
	}
}
