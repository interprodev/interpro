import { cloneDeep, max } from 'lodash';

const PERC = 5;

export const getMax = (...args) => {
	const maxs = [];
	args.forEach(arr => {
		arr.forEach((v, i) => {
			if (!maxs[i]) maxs[i] = 0;
			if (v) {
				try {
					maxs[i] += parseFloat(v);
				} catch (e) {}
			}
		});
	});
	return (max(maxs) / 100) * PERC;
};

export const sortData = (data, categories, metric, order) => {
	const local = cloneDeep(data);
	if (order) {
		local
			.map((v, i) => ({
				c: categories[i],
				d: v[1]
			}))
			.sort((a, b) => {
				let i;
				let j;
				if (metric === 'contractCost' || metric === 'purchaseCost' || metric === 'roi') {
					i = Array.from(Object.values(a.d[metric])).reduce((x: any, y: any) => x + y, 0);
					j = Array.from(Object.values(b.d[metric])).reduce((x: any, y: any) => x + y, 0);
				} else if (metric === 'totalInvestmentValue') {
					i = a.d['contractCostOverall'] + a.d['purchaseCostOverall'];
					j = b.d['contractCostOverall'] + b.d['purchaseCostOverall'];
				} else {
					i = a.d[metric];
					j = b.d[metric];
				}
				return i < j ? -1 : i === j ? 0 : 1;
			})
			.forEach((v, i) => {
				local[i] = v.d;
				categories[i] = v.c;
			});
	} else {
		local
			.map((v, i) => ({
				c: categories[i],
				d: v[1]
			}))
			.sort((a, b) => {
				return a.c < b.c ? -1 : a.c === b.c ? 0 : 1;
			})
			.forEach((v, i) => {
				local[i] = v.d;
				categories[i] = v.c;
			});
	}

	return [local, categories];
};
