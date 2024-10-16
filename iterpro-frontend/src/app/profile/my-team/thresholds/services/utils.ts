import { getThresholdActiveValue } from '@iterpro/shared/utils/common-utils';
import { MetricThreshold } from '../interfaces';

export function convertFromPercIntervals(dialogModel: MetricThreshold) {
	return dialogModel.intervals
		? dialogModel.intervals.map(percValue =>
				percValue ? Math.round(getThresholdActiveValue(dialogModel) * (percValue + 100)) / 100 : null
		  )
		: dialogModel.intervals;
}

export function convertFromAbsIntervals(dialogModel: MetricThreshold) {
	return dialogModel.absIntervals
		? dialogModel.absIntervals.map(absValue =>
				absValue ? Number(((((absValue / getThresholdActiveValue(dialogModel)) * 10000) / 100) - 100).toFixed(2)) : null
		  )
		: dialogModel.absIntervals;
}

export function getPossibleGTCombination(): string[] {
	return [
		'GEN',
		'GD',
		'GD+1',
		'GD+2',
		'GD+3',
		'GD-7',
		'GD-6',
		'GD-5',
		'GD-4',
		'GD-3',
		'GD-2',
		'GD-1',
		'GD+1-7',
		'GD+1-6',
		'GD+1-5',
		'GD+1-4',
		'GD+1-3',
		'GD+1-2',
		'GD+1-1',
		'GD+2-7',
		'GD+2-6',
		'GD+2-5',
		'GD+2-4',
		'GD+2-3',
		'GD+2-2',
		'GD+2-1',
		'GD+3-7',
		'GD+3-6',
		'GD+3-5',
		'GD+3-4',
		'GD+3-3',
		'GD+3-2',
		'GD+3-1',
		'GD+4-7',
		'GD+4-6',
		'GD+4-5',
		'GD+4-4',
		'GD+4-3',
		'GD+4-2',
		'GD+4-1',
		'GD+5-7',
		'GD+5-6',
		'GD+5-5',
		'GD+5-4',
		'GD+5-3',
		'GD+5-2',
		'GD+5-1',
		'GD+6-7',
		'GD+6-6',
		'GD+6-5',
		'GD+6-4',
		'GD+6-3',
		'GD+6-2',
		'GD+6-1',
		'GD+7-7',
		'GD+7-6',
		'GD+7-5',
		'GD+7-4',
		'GD+7-3',
		'GD+7-2',
		'GD+7-1',
		'GD+8-7',
		'GD+8-6',
		'GD+8-5',
		'GD+8-4',
		'GD+8-3',
		'GD+8-2',
		'GD+8-1'
	];
}
