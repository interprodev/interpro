import { Statistics, ThresholdFormElement } from './settings-thresholds-team.type';
import { FormControl, Validators } from '@angular/forms';
import { Threshold } from '@iterpro/shared/data-access/sdk';

export function toThresholdFormElement(threshold: Threshold, metricLabel: string, statistics: Statistics): ThresholdFormElement {
	const last30 = statistics.last30[threshold.name]?.toFixed(1);
	const lastSeason = statistics.lastSeason[threshold.name]?.toFixed(1);
	return {
		name: new FormControl({ value: threshold.name, disabled: true}, {
			nonNullable: true,
			validators: Validators.compose([Validators.required]),
		}),
		metricLabel: new FormControl({ value: metricLabel, disabled: true}, {
			nonNullable: true,
			validators: Validators.compose([Validators.required]),
		}),
		value: new FormControl({ value: threshold.value, disabled: false }, {
			nonNullable: true,
			validators: Validators.compose([Validators.required, Validators.min(0)]),
		}),
		last30: new FormControl({ value: last30 || '-', disabled: true }, {
			nonNullable: true,
			validators: []
		}),
		lastSeason: new FormControl({ value: lastSeason || '-', disabled: true }, {
			nonNullable: true,
			validators: []
		}),
	}
}
