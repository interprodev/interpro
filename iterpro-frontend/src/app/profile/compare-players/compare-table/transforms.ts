import { AttributeCategory } from '@iterpro/shared/data-access/sdk';
import { convertToNumber, playerAttributes } from '@iterpro/shared/utils/common-utils';

/**
 * Players => Compare Players UI
 *
 * While comparing one player with another the thresholds of TACTICAL, PHYSICAL, ROBUSTNESS, OFFENSIVE, DEFENSIVE AND ATTITUDE will be displayed with
 * many displayed metrics.
 *
 * The orange background of box indicates the "best" one in comparison showing which player is the best in displayed metrics.
 *
 * 		Meaning of ‘-‘ : Data / value is not available or null or undefined or ''
 * 		Meaning of 0 : value is 0
 *
 * Clicking on icon "%" (ddisplayed at right side) allows to display the percentage in comparison. Calculated with formula (left/right * 100) - 100
 *
 * 		if left = undefined or null (‘-‘) or 0 and right is having some value then right value will be orange color box. For percentage  show RIGHT box with orange color as ‘100%’
 * 		if right = undefined or null (‘-‘) or 0 and left is having some value then left value will be orange color box.  For percentage  show LEFT box with orange color as ‘100%’
 * 		if left = right then NO color , only value in the box.
 *
 * Special Cases:
 * Consider the meaning of each case. Example ROBUSTNESS > Training missed or Game missed, more missed means less robust.
 * Example: If LEFT player game missed = 36 and RIGHT player game missed = 18 then RIGHT player will be -50% with orange color box.
 *
 * @param first
 * @param second
 */
const getPercentDiff = (first, second) => {
	first = convertToNumber(first);
	second = convertToNumber(second);
	if (!isNaN(second) && second !== 0 && first !== 0) {
		return `${Math.round((first / second) * 100 - 100)}%`;
	} else if (first === 0 || second === 0) {
		return '100%';
	} else {
		return '-';
	}
};

const toItem = (key, legend: string, hasLeft, left, hasRight, right, inverse = false) => {
	// const leftValue = hasLeft ? new DecimalPipe('en-US').transform(left, '1.0-1') : '';
	// const rightValue = hasRight ? new DecimalPipe('en-US').transform(right, '1.0-1') : '';

	const leftValue = hasLeft && left !== null ? left : '';
	const rightValue = hasRight && right !== null ? right : '';
	let leftMax = false;
	let rightMax = false;
	let leftPerc = null;
	let rightPerc = null;

	if (hasLeft && left !== null) {
		leftMax = isNaN(right) ? true : inverse ? right > left : left > right;
	}
	if (hasRight && right !== null) {
		rightMax = isNaN(left) ? true : inverse ? left > right : right > left;
	}

	if (isNaN(right) && isNaN(left)) {
		leftMax = false;
		rightMax = false;
	}

	leftPerc = leftMax ? getPercentDiff(left, right) : ''; // negative perc
	rightPerc = rightMax ? getPercentDiff(right, left) : ''; // negative perc

	return {
		left,
		right,
		leftValue,
		rightValue,
		hasLeft,
		hasRight,
		leftMax,
		rightMax,
		key,
		legend,
		leftPerc,
		rightPerc
	};
};

export const fixed2 = (leftSelected, rightSelected, key) => {
	const hasLeft = leftSelected !== null;
	const hasRight = rightSelected !== null;

	return playerAttributes
		.filter(x => x.category === key)
		.map(field => {
			const left = hasLeft && leftSelected.attributes && leftSelected.attributes[field.value];
			const right = hasRight && rightSelected.attributes && rightSelected.attributes[field.value];
			return toItem(field.label, null, hasLeft, left, hasRight, right);
		});
};

export const attributesToItem = (leftSelected, rightSelected, attributeCategory: AttributeCategory) => {
	return (leftSelected.attributes || [])
		.filter(({ category }) => category === attributeCategory)
		.map(({ metric: metricItem, metricName }) => {
			const left = (leftSelected?.attributes || []).find(
				({ category, metric }) => category === attributeCategory && metric === metricItem
			)?.value;
			const right = (rightSelected?.attributes || []).find(
				({ category, metric }) => category === attributeCategory && metric === metricItem
			)?.value;
			return toItem(metricName, null, true, left, true, right);
		});
};

export const robustness = (leftSelected, rightSelected) => {
	const keys = [
		{ k: 'player.robustness.apps', legend: 'player.robustness.legend.apps', i: false },
		{ k: 'player.robustness.availability', legend: 'player.robustness.legend.availability', i: false },
		{ k: 'player.robustness.playing_time', legend: 'player.robustness.legend.playing_time', i: false },
		{
			k: 'player.robustness.performance_reliability',
			legend: 'player.robustness.legend.performance_reliability',
			i: false
		},
		{ k: 'player.robustness.robustness', legend: 'player.robustness.legend.robustness', i: false },
		{ k: 'player.robustness.days_absence', legend: null, i: true },
		{ k: 'player.robustness.game_missed', legend: 'player.robustness.legend.game_missed', i: true },
		{ k: 'player.robustness.training_missed', legend: 'player.robustness.legend.training_missed', i: true },
		{ k: 'player.robustness.n_injuries', legend: 'player.robustness.legend.n_injuries', i: true },
		{ k: 'player.robustness.injury_severity', legend: 'player.robustness.legend.injury_severity', i: true },
		{ k: 'player.robustness.reinjury_rate', legend: 'player.robustness.legend.reinjury_rate', i: true }
	];

	return keys.map(({ k, legend, i }) => {
		const hasLeft = leftSelected !== null && leftSelected.robustness && leftSelected.robustness[k] !== undefined;
		const hasRight = rightSelected !== null && rightSelected.robustness && rightSelected.robustness[k] !== undefined;
		const left = hasLeft && leftSelected.robustness[k];
		const right = hasRight && rightSelected.robustness[k];
		return toItem(k, legend, hasLeft, left, hasRight, right, i);
	});
};

export const metrics = (leftSelected, rightSelected, key, m) => {
	return m.map(({ metric, label }) => {
		const hasLeft = leftSelected !== null && leftSelected[key] && leftSelected[key][metric] !== undefined;
		const hasRight = rightSelected !== null && rightSelected[key] && rightSelected[key][metric] !== undefined;
		const left = hasLeft && leftSelected[key][metric];
		const right = hasRight && rightSelected[key][metric];
		return toItem(label, null, hasLeft, left, hasRight, right);
	});
};
