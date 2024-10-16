import { clearAndCopyCircularJSON } from '@iterpro/shared/utils/common-utils';
import { FitnessComponent } from './fitness.component';

const getVal1 = (field, reportService) => {
	if (!field.valueCurrent) return '-';
	return reportService.number(field.valueCurrent, '0.0-2');
};

const getVal2 = (field, reportService) => {
	if (!field.valuePrev) return '-';
	const val = (field.valueCurrent - field.valuePrev) / field.valueCurrent;
	return reportService.percent(val);
};

const getVal3 = (field, reportService) => {
	if (field.valueCurrent && field.date) {
		return reportService.date(field.date, 'dd/MM/yy');
	}
	return '-';
};

const getReport = (component) => {
	const {
		dataTimeline,
		optionsTimeline,
		dataRadar,
		optionsRadar,
		player,
		table,
		metrics,
		selectedMetrics,
		selectedSeason,
		translate,
		reportService
	} = component;
	const t = translate.instant.bind(translate);
	return {
		title: player.displayName,
		image: player.downloadUrl,
		season: selectedSeason.name,
		metrics: metrics && selectedMetrics.map(s => s.metricLabel).join(', '),
		chart: {
			data: clearAndCopyCircularJSON(dataTimeline),
			options: optionsTimeline
		},
		radar: {
			data: clearAndCopyCircularJSON(dataRadar),
			options: optionsRadar
		},
		tables: {
			title: t('fitness.lastOutcomes'),
			tables: Object.entries(table).map(([title, values]: [string, any[]]) => ({
				title,
				rows: (values || []).map(field => ({
					label: `${field.testName} - ${field.metricName}`,
					point: field.diffThresholdColor,
					val1: getVal1(field, reportService),
					val2: getVal2(field, reportService),
					val3: getVal3(field, reportService)
				}))
			}))
		}
	};
};

export default getReport;
