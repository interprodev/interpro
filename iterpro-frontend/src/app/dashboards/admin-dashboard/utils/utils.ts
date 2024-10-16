import { getDefaultPieConfig } from '@iterpro/shared/utils/common-utils';

export const getHealthTooltip = status => {
	switch (status) {
		case 'notAvailable': {
			return 'tooltip.notAvailable';
		}
		case 'careful': {
			return 'tooltip.beCareful';
		}
		case 'injury': {
			return 'tooltip.injured';
		}
		case 'complaint': {
			return 'tooltip.complaint';
		}
		case 'illness': {
			return 'tooltip.illness';
		}
		case 'fit': {
			return 'tooltip.fit';
		}
		default:
			return 'emptyString';
	}
};

const palette = ['#FF4040', '#8100FF', '#ffff00', '#008000'];
const paletteBorder = ['rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.6)'];

export const getChart = (playerData, translate) => {
	const datasets = [
		{
			data: [
				Number(playerData.breakdown.injured).toFixed(0),
				Number(playerData.breakdown.illness).toFixed(0),
				Number(playerData.breakdown.complaint).toFixed(0),
				Number(playerData.breakdown.fit).toFixed(0)
			],
			backgroundColor: palette,
			borderColor: paletteBorder,
			borderWidth: 0,
			labels: [
				translate.instant('injured'),
				translate.instant('illness'),
				translate.instant('complaint'),
				translate.instant('fit')
			]
		}
	];
	const data = {
		datasets,
		labels: ['injured', 'illness', 'complaint', 'fit']
	};

	const options = {
		...getDefaultPieConfig(),
		responsive: true,
		maintainAspectRatio: true,
		cutout: '75%'
	};
	options.elements = {
		center: {
			text: playerData.injuriesNumber,
			color: '#ddd',
			fontStyle: 'Gotham',
			sidePadding: 15
		}
	};
	options.plugins.legend = {
		position: 'bottom',
		labels: {
			color: '#ddd'
		}
	};
	options.plugins.tooltip = {
		callbacks: {
			label: ({ label, formattedValue }) => `${translate.instant(label)}: ${Number(formattedValue).toFixed(0)}%`
		}
	};
	options.plugins.datalabels = {
		...options.plugins.datalabels,
		formatter: (value, context) => `${Math.round(value)}%`,
		display: context => context.dataset.data[context.dataIndex] > 0,
		font: {
			weight: 'bold',
			size: 12
		}
	};
	return [data, options];
};
