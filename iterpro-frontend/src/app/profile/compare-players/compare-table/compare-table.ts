import { AttributeCategory } from '@iterpro/shared/data-access/sdk';
import { convertToNumber } from '@iterpro/shared/utils/common-utils';
import { attributesToItem, metrics as metricsTransformer, robustness } from './transforms';

export default class CompareTable {
	private left: any = null;
	private right: any = null;
	private metrics: any = [];
	private type = '';

	title = '';
	data: any = [];

	constructor(left, right, type, metrics = []) {
		this.left = left;
		this.right = right;
		this.type = type;
		this.metrics = metrics;
		this.setup();
	}

	setup() {
		switch (this.type) {
			case 'offensive':
			case 'defensive':
			case 'attitude':
				this.attributes(this.type);
				break;
			case 'tactical':
				this.tactical();
				break;
			case 'physical':
				this.physical();
				break;
			case 'robustness':
				this.robustness();
				break;
		}
	}

	attributes(category: AttributeCategory) {
		this.title = category;
		const data = attributesToItem(this.left, this.right, category);
		this.setData(data);
	}

	physical() {
		this.title = 'Physical';
		this.setData(metricsTransformer(this.left, this.right, 'performanceMetrics', this.metrics));
	}

	tactical() {
		this.title = 'Tactical';
		this.setData(metricsTransformer(this.left, this.right, 'tacticalMetrics', this.metrics));
	}

	robustness() {
		this.title = 'Robustness';
		this.setData(robustness(this.left, this.right));
	}

	setData(data) {
		this.data = data;
	}

	getPercentDiff(first, second) {
		first = convertToNumber(first);
		second = convertToNumber(second);
		if (first > second) {
			if (second && !isNaN(second) && second !== 0) {
				return `${Math.round((first / second) * 100 - 100)}%`;
			} else {
				return '';
			}
		}
		return '';
	}

	export(t) {
		return {
			title: this.title,
			data: this.data.map(item =>
				Object.assign(item, {
					label: t(item.key)
				})
			)
		};
	}
}
