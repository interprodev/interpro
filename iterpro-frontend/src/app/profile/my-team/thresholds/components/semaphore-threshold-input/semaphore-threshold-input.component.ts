import { Component, Input, OnInit } from '@angular/core';
import { SelectItem } from 'primeng/api';
import {
	MetricThreshold,
	ThresholdActiveFormatLabel,
	ThresholdCategory,
	thresholdActiveFormats
} from '../../interfaces';

@Component({
	selector: 'iterpro-semaphore-threshold-input',
	templateUrl: './semaphore-threshold-input.component.html',
	styleUrls: ['./semaphore-threshold-input.component.css']
})
export class SemaphoreThresholdInputComponent implements OnInit {
	@Input() category: ThresholdCategory;
	@Input() model: MetricThreshold;

	private readonly thresholdTypeLabels: ThresholdActiveFormatLabel[] = ['Custom', 'Last Month', 'Season', 'Best Score'];

	selectableThresholdTypes: SelectItem[] = thresholdActiveFormats.map((value, index) => ({
		value,
		label: this.thresholdTypeLabels[index]
	}));

	ngOnInit() {
		if (`${this.model.semaphoreType}` === `3`) {
			// remove Best Score option from semaphore 3 -> red-yellow-green-yellow-red
			this.selectableThresholdTypes.pop();
		}
	}

	get thresholdValue(): number {
		switch (this.model.format) {
			case 'seasonValue':
				return this.model.seasonValue;
			case 'last30Value':
				return this.model.last30Value;
			case 'bestValue':
				return this.model.bestValue;
			case 'customValue':
				return this.model.customValue;
			default:
				return this.model.value;
		}
	}

	set thresholdValue(value) {
		if (this.isCustom()) {
			this.model.customValue = value;
			this.model.value = value;
		}
	}

	isCustom(): boolean {
		return this.model.format === 'customValue';
	}

	updateModelValue({ value }) {
		this.model.value = this.model[value];
	}
}
