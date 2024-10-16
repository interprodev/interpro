module.exports = {
	getThresholdsIntervalColor,
	getThresholdsIntervalValue,
	getThresholdActiveValue
};

function getThresholdsIntervalValue(value, threshold) {
	const thresholdActiveValue = getThresholdActiveValue(threshold) || 1;
	return (value / thresholdActiveValue) * 100;
}

function getThresholdsIntervalColor(value, threshold) {
	const thresholdActiveValue = getThresholdActiveValue(threshold);
	if (!thresholdActiveValue) {
		return 'grey';
	}
	if (threshold?.semaphoreType && !!threshold?.intervals) {
		const diff = ((value - thresholdActiveValue) / thresholdActiveValue) * 100;
		switch (threshold.semaphoreType.toString()) {
			case '1': {
				if (diff <= threshold.intervals[0]) return 'red';
				if (diff < threshold.intervals[1] && diff > threshold.intervals[0]) return 'yellow';
				if (diff >= threshold.intervals[1]) return 'green';
				break;
			}
			case '2': {
				if (diff <= threshold.intervals[0]) return 'green';
				if (diff < threshold.intervals[1] && diff > threshold.intervals[0]) return 'yellow';
				if (diff >= threshold.intervals[1]) return 'red';
				break;
			}
			case '3': {
				if (diff <= threshold.intervals[2] && diff >= threshold.intervals[1]) return 'green';
				if (
					(diff < threshold.intervals[1] && diff >= threshold.intervals[0]) ||
					(diff > threshold.intervals[2] && diff <= threshold.intervals[3])
				)
					return 'yellow';
				if (diff < threshold.intervals[0] || diff > threshold.intervals[3]) return 'red';
				break;
			}
			default: {
				return null;
			}
		}
	} else {
		return 'grey';
	}
}

function getThresholdActiveValue(threshold) {
	if (!threshold) return undefined;
	switch (threshold.format) {
		case 'bestValue':
		case 'seasonValue':
		case 'customValue':
		case 'last30Value':
			return threshold[threshold.format];
		default:
			console.warn('format not supported');
	}
	return undefined;
}
