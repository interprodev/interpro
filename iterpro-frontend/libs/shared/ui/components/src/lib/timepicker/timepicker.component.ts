import {
	Component,
	Input,
	forwardRef,
	OnInit,
	Output,
	EventEmitter,
	OnChanges,
	SimpleChanges,
	inject
} from '@angular/core';
import {
	ControlValueAccessor, FormBuilder, FormControl,
	FormGroup,
	FormsModule, NG_VALUE_ACCESSOR,
	ReactiveFormsModule
} from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { SelectItem } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { generateTimeOptions } from '@iterpro/shared/utils/common-utils';

@Component({
	selector: 'iterpro-timepicker',
	templateUrl: './timepicker.component.html',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		DropdownModule,
		InputTextModule,
		FormsModule
	],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: forwardRef(() => TimepickerComponent)
		}
	]
})
export class TimepickerComponent implements OnInit, ControlValueAccessor, OnChanges {
	@Input() disabled = true;
	@Input() stepMinutes = 30;
	@Input() minTime!: string;
	@Output() timeChanged: EventEmitter<string> = new EventEmitter<string>();

	#fb: FormBuilder = inject(FormBuilder);
	form: FormGroup<{time: FormControl<string | null> }> = this.#fb.nonNullable.group({ time: new FormControl<string>('') });

	timeOptions!: SelectItem[];

	ngOnInit(): void {
		if (this.stepMinutes < 1 || this.stepMinutes > 60) {
			throw new Error('Step minutes must be between 1 and 60');
		}
		this.timeOptions = generateTimeOptions(this.minTime, this.stepMinutes);
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['minTime']) {
			this.timeOptions = generateTimeOptions(this.minTime, this.stepMinutes);
		}
	}


	writeValue(value: string): void {
		this.form.patchValue({ time: value });
	}

	registerOnChange(fn: any): void {
		this.onChange = fn;
		this.form.valueChanges.subscribe(fn);
	}

	registerOnTouched(fn: any): void {
		this.onTouch = fn;
	}

	onTimeChange(): void {
		const value = this.form.controls.time.value as string;
		this.onChange(value);
		this.onTouch();
		this.timeChanged.emit(value);
	}

	setDisabledState(isDisabled: boolean): void {
		this.disabled = isDisabled;
		isDisabled ? this.form.disable() : this.form.enable();
	}

	onChange: any = () => {};
	onTouch: any = () => {};
}
