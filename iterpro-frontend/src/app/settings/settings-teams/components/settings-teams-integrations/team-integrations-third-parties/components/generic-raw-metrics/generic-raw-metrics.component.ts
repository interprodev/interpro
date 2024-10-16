import { Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { FormArray, FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { RawMetricsForm } from '../../models/integrations-third-parties.type';
import { SelectItem } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RawMetricFormat, RawMetricType } from '@iterpro/shared/data-access/sdk';
import { FormFeedbackComponent } from '@iterpro/shared/ui/components';

@Component({
	selector: 'iterpro-generic-raw-metrics',
	standalone: true,
	imports: [
		PrimeNgModule,
		ReactiveFormsModule,
		TranslateModule,
		FormFeedbackComponent
	],
	templateUrl: './generic-raw-metrics.component.html',
})
export class GenericRawMetricsComponent implements OnInit, OnChanges {
	@Input({required: true}) name: string;
	@Input({required: true}) editMode: boolean;
	@Input({required: true}) saveClicked: boolean;
	// Services
	readonly #translateService = inject(TranslateService);
	readonly #rootFormGroup = inject(FormGroupDirective);
	// Variables
	rawMetricForm: FormArray<FormGroup<RawMetricsForm>>
	rawMetricsTypesOptions: SelectItem[];
	rawMetricsFormatDurationOptions: SelectItem[];
	rawMetricsFormatDateOptions: SelectItem[];
	ngOnInit() {
		this.initOptions();
		this.rawMetricForm = this.#rootFormGroup.control.get(this.name).get('rawMetrics') as FormArray<FormGroup<RawMetricsForm>>;
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes.editMode && this.rawMetricForm) {
			this.rawMetricForm = this.#rootFormGroup.control.get(this.name).get('rawMetrics') as FormArray<FormGroup<RawMetricsForm>>;
		}
	}

	// region Options
	private initOptions() {
		this.rawMetricsTypesOptions = this.getRawMetricsTypesOptions();
		this.rawMetricsFormatDurationOptions = this.getRawMetricFormatDurationOptions();
		this.rawMetricsFormatDateOptions = this.getRawMetricFormatDateOptions();
	}

	private getRawMetricsTypesOptions(): SelectItem[] {
		return [
			{ label: this.#translateService.instant(RawMetricType.number), value: RawMetricType.number },
			{ label: this.#translateService.instant(RawMetricType.duration), value: RawMetricType.duration },
			{ label: this.#translateService.instant(RawMetricType.date), value: RawMetricType.date },
			{ label: this.#translateService.instant(RawMetricType.string), value: RawMetricType.string }
		];
	}

	private getRawMetricFormatDurationOptions(): SelectItem[] {
		return [
			{ label: this.#translateService.instant(RawMetricFormat.hhmmss), value: RawMetricFormat.hhmmss },
			{ label: this.#translateService.instant(RawMetricFormat.mmss), value: RawMetricFormat.mmss },
			{
				label: this.#translateService.instant(RawMetricFormat.minutesFloat),
				value: this.#translateService.instant(RawMetricFormat.minutesFloat)
			},
			{ label: this.#translateService.instant(RawMetricFormat.minutes), value: RawMetricFormat.minutes },
			{ label: this.#translateService.instant(RawMetricFormat.seconds), value: RawMetricFormat.seconds },
			{ label: this.#translateService.instant(RawMetricFormat.decimalExcelSeconds), value: RawMetricFormat.decimalExcelSeconds }
		];
	}

	private getRawMetricFormatDateOptions(): SelectItem[] {
		return  [
			{ label: this.#translateService.instant(RawMetricFormat.microsoftTime), value: RawMetricFormat.microsoftTime },
			{ label: this.#translateService.instant(RawMetricFormat.microsoftTimeFloat), value: RawMetricFormat.microsoftTimeFloat },
			{ label: this.#translateService.instant(RawMetricFormat.unixTime), value: RawMetricFormat.unixTime },
			{ label: this.#translateService.instant(RawMetricFormat.ddmmyyyy), value: RawMetricFormat.ddmmyyyy },
			{ label: this.#translateService.instant(RawMetricFormat.ddmmyy), value: RawMetricFormat.ddmmyy },
			{ label: this.#translateService.instant(RawMetricFormat.hhmmss), value: RawMetricFormat.hhmmss },
			{ label: this.#translateService.instant(RawMetricFormat.yyyyddhhmmss), value: RawMetricFormat.yyyyddhhmmss }
		];
	}
	// endregion
}
