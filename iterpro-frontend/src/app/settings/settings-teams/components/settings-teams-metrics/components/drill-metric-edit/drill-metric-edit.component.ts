import { Component, inject } from '@angular/core';
import { DialogFooterButtonsComponent, FormFeedbackComponent } from '@iterpro/shared/ui/components';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DrillMetricForm } from './models/drill-metric.type';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AlertService } from '@iterpro/shared/utils/common-utils';
import { toDrillMetricForm } from './models/drill-metric.form';
import { CustomMetric } from '@iterpro/shared/data-access/sdk';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';

@Component({
	selector: 'iterpro-drill-metric-edit',
	standalone: true,
	imports: [FormFeedbackComponent, FormsModule, ReactiveFormsModule, TranslateModule, PrimeNgModule, DialogFooterButtonsComponent],
	templateUrl: './drill-metric-edit.component.html'
})
export class DrillMetricEditComponent {
	// Services
	readonly #ref: DynamicDialogRef = inject(DynamicDialogRef);
	readonly #config: DynamicDialogConfig = inject(DynamicDialogConfig);
	readonly #alertService: AlertService = inject(AlertService);
	readonly #fb: FormBuilder = inject(FormBuilder);
	// Input Properties
	#drillMetric: CustomMetric;
	editMode: boolean;
	metricLabel: string;
	metricValue: string;
	alreadyUsedValues: string[] = [];
	alreadyUsedLabels: string[] = [];
	// Variables
	drillMetricForm: FormGroup<DrillMetricForm>;
	saveClicked = false;
	constructor() {
		if (this.#config.data) {
			this.#drillMetric = this.#config.data.drillMetric;
			this.editMode = this.#config.data.editMode;
			this.metricLabel = this.#config.data.metricLabel;
			this.metricValue = this.#config.data.metricValue;
			this.alreadyUsedValues = this.#config.data.alreadyUsedValues;
			this.alreadyUsedLabels = this.#config.data.alreadyUsedLabels;
		}
		this.loadForm();
	}


	private loadForm() {
		this.drillMetricForm = this.#fb.group(toDrillMetricForm(this.alreadyUsedValues, this.alreadyUsedLabels));
		this.#drillMetric ? this.drillMetricForm.patchValue(this.#drillMetric) : this.drillMetricForm.reset();
		if (this.editMode) {
			this.drillMetricForm.enable();
		}
	}

	onConfirm() {
		this.saveClicked = true;
		if (!this.drillMetricForm.valid)
			return this.#alertService.notify('warn', 'Settings', 'alert.formNotValid', false);
		this.#ref.close(this.fromFormGroup());
	}

	onDiscard() {
		this.#ref.close();
	}

	private fromFormGroup(): CustomMetric {
		const jsonPayload = this.drillMetricForm.getRawValue();
		return Object.assign(jsonPayload, {
			custom: this.#drillMetric?.custom,
			active: this.#drillMetric?.active,
		});
	}
}
