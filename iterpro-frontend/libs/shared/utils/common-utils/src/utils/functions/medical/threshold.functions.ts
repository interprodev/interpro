import { Player, Threshold } from '@iterpro/shared/data-access/sdk';

export const getThresholdsIntervalValue = (value: number, threshold: Threshold): number | null => {
	const thresholdActiveValue: number | undefined = getThresholdActiveValue(threshold);
	if (threshold && thresholdActiveValue) {
		return (value / thresholdActiveValue) * 100;
	}

	return null;
};

export function getThresholdActiveValue(threshold: Threshold): number | undefined {
	if (!threshold) return undefined;
	switch (threshold.format) {
		case 'bestValue':
		case 'seasonValue':
		case 'customValue':
		case 'last30Value':
			return threshold[threshold.format];
		default:
			console.debug('format not supported');
	}
	return undefined;
}

export const getThresholdsInterval = (value: number, threshold: Threshold): string | null => {
	const thresholdActiveValue = getThresholdActiveValue(threshold);
	if (!thresholdActiveValue) {
		return 'grey';
	}

	if (threshold && threshold.semaphoreType && !!threshold.intervals) {
		const x = ((value - thresholdActiveValue) / thresholdActiveValue) * 100;
		switch (threshold.semaphoreType.toString()) {
			case '1': {
				if (x <= threshold.intervals[0]) return 'red';
				if (x < threshold.intervals[1] && x > threshold.intervals[0]) return 'yellow';
				if (x >= threshold.intervals[1]) return 'green';
				break;
			}
			case '2': {
				if (x <= threshold.intervals[0]) return 'green';
				if (x < threshold.intervals[1] && x > threshold.intervals[0]) return 'yellow';
				if (x >= threshold.intervals[1]) return 'red';
				break;
			}
			case '3': {
				if (x <= threshold.intervals[2] && x >= threshold.intervals[1]) return 'green';
				if (
					(x < threshold.intervals[1] && x >= threshold.intervals[0]) ||
					(x > threshold.intervals[2] && x <= threshold.intervals[3])
				)
					return 'yellow';
				if (x < threshold.intervals[0] || x > threshold.intervals[3]) return 'red';
				break;
			}
			default: {
				return null;
			}
		}
	} else {
		return 'grey';
	}

	return null;
};

export const getEntireTestThreshold = (player: Player, metric: string, test?: string) => {
	const found = player._thresholdsTests.find(x => x.name === test && x.metric === metric);
	if (found) return found;
};

export function getThresholdTooltip(
	thresholdActiveValue: number,
	testValue: number,
	noThresholdSetLabel: string,
	thresholdLabel: string
): string {
	if (!thresholdActiveValue || !testValue) return noThresholdSetLabel;
	const percentage: number = Math.abs(((testValue - thresholdActiveValue) / thresholdActiveValue) * 100);
	const basicLabel = thresholdLabel + ': ' + thresholdActiveValue;
	const percentageLabel = percentage.toFixed(1) + '%)';

	let tooltip = '';
	if (testValue > thresholdActiveValue) {
		tooltip = basicLabel + ' (+' + percentageLabel;
	} else if (testValue < thresholdActiveValue) {
		tooltip = basicLabel + ' (-' + percentageLabel;
	} else if (testValue === thresholdActiveValue) {
		tooltip = basicLabel;
	}

	return tooltip;
}
