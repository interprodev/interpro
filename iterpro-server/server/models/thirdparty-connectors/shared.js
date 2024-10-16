const mjs = require('mathjs');
const moment = require('moment');

const utils = (module.exports = {
	mapDefaultMetrics: function (sessionPlayerData, team) {
		if (team._gpsProviderMapping?._gpsMetricsMapping) {
			for (const defaultMetric of team._gpsProviderMapping._gpsMetricsMapping) {
				sessionPlayerData[defaultMetric.columnName] = utils.evaluateDefaultMetric(defaultMetric, sessionPlayerData);
			}
		}
		return sessionPlayerData;
	},

	evaluateDefaultMetric: function (defaultMetric, sessionPlayerData) {
		const value = defaultMetric.expression ? evaluateExpression(defaultMetric.expression, sessionPlayerData) : null;
		return value;
	},

	isCustomRpeTl: function (defaultMetric, scope) {
		return defaultMetric.expression && evaluateExpression(defaultMetric.expression, scope);
	},

	seasonAtDate: function (seasons, date) {
		return date
			? seasons.find(({ offseason, inseasonEnd }) => moment(date).isBetween(offseason, inseasonEnd, 'day', '[]'))
			: null;
	},

	seasonAtDateIndex: function (seasons, date) {
		return date
			? seasons.findIndex(season => moment(date).isBetween(season.offseason, season.inseasonEnd, 'day', '[]'))
			: null;
	}
});

function evaluateExpression(formulaInput, scopeInput) {
	const scope = {};
	for (const key in scopeInput) {
		const valueScope = scopeInput[key];
		// if (valueScope === undefined || valueScope === null) valueScope = 0;
		const cleaned = cleanField(`{${key}}`);
		scope[cleaned] = valueScope;
	}
	const formula = formulaInput.replace(/\{(.+?)\}/g, metric => {
		metric = metric.replace(/[{}]+/g, '');
		metric = metric.normalize('NFD');
		metric = metric.replace(/[\u0300-\u036f]/g, '');
		return metric.replace(/[\s{([\]Â²)}/:%.°\-<>]+/g, '_');
	});
	const matchesString = formulaInput.match(/\{([^}]+)\}/g);
	if (matchesString) {
		for (const mStr of matchesString) {
			let scopeVar = mStr.substring(1, mStr.length - 1);
			scopeVar = scopeVar.replace(/[\s{([\]Â²)}/:%.\-<>]+/g, '_');
			if (!(scopeVar in scopeInput) || !scopeInput[scopeVar]) scopeInput[scopeVar] = 0;
		}
	}
	let valueCalculated;
	try {
		valueCalculated = mjs.evaluate(formula, scope) || scope[formula];
	} catch (error) {
		// console.debug(error);
		valueCalculated = null;
	}
	return valueCalculated;
}

function cleanField(field) {
	return field.replace(/\{(.+?)\}/g, m => {
		m = m.replace(/[{}]+/g, '');
		m = m.normalize('NFD');
		m = m.replace(/[\u0300-\u036f]/g, '');
		return m.replace(/[\s{([\]Â²)}/:%.°\-<>]+/g, '_');
	});
}
