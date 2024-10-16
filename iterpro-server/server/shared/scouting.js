const { cloneDeep, sortBy } = require('lodash');
const { playerAttributes } = require('../../common/constants/commonConstants');
const gameReportUtils = require('./player-report-template-utils');
module.exports = {
	addAggregateData: async function (player, teamPlayerAttributes, { gameReport, survey }, clubTemplates) {
		const { gameReports } = player;
		const isWatfordGameReport = gameReport === 'watford';
		const isSwissGameReport = survey === 'swiss';
		const gameReportsCloned = cloneDeep(gameReports);
		const mappedItems = await Promise.all(
			gameReportsCloned.map(async item => gameReportUtils.getMappedReportData(item, clubTemplates))
		);
		const reportDataAvg = await Promise.resolve(
			gameReportUtils.getReportDataAvg(mappedItems, clubTemplates, isSwissGameReport, isWatfordGameReport)
		);
		const { prognosis, prognosisColor, prognosisTooltip } = getPrognosis(player);
		const playerAttributesMapped = teamPlayerAttributes ? getPlayerAttributes(player, teamPlayerAttributes) : {};
		const scaffoldedPlayer = {
			...player,
			...playerAttributesMapped,
			reportDataAvg,
			prognosis,
			prognosisColor,
			prognosisTooltip,
			wageRange: getMillionsRange(player.wageFrom, player.wageTo),
			feeRange: getMillionsRange(player.feeFrom, player.feeTo),
			associatedPlayerName: player.associatedPlayer ? player.associatedPlayer.displayName : '',
			archivedStatus: !player.archived ? 'bonus.active' : 'bonus.archived'
		};
		return scaffoldedPlayer;
	}
};

function getPrognosis({ attributes }) {
	const sorted = sortBy(attributes, 'date').reverse();
	const prognosisScore = (sorted[0]?.values || []).find(({ metric }) => metric === 'prognosisScore')?.value;
	const prognosisDescription = (sorted[0]?.values || []).find(({ metric }) => metric === 'prognosisDescription')?.value;

	const levelIndex = ['-', 'C', 'B', 'A'].indexOf(prognosisScore || '-');
	const prognosisColor = levelIndex > -1 ? ['#dddddd', 'red', 'yellow', 'green'][levelIndex] : '#dddddd';
	return { prognosis: prognosisScore || '-', prognosisTooltip: prognosisDescription || '-', prognosisColor };
}

function getPlayerAttributes({ attributes }, teamPlayerAttributes) {
	const attributesMetrics = teamPlayerAttributes || playerAttributes;
	const offensiveMetrics = attributesMetrics.filter(({ active, category }) => active && category === 'offensive');
	const defensiveMetrics = attributesMetrics.filter(({ active, category }) => active && category === 'defensive');
	const attitudeMetrics = attributesMetrics.filter(({ active, category }) => active && category === 'attitude');

	const sorted = sortBy(attributes, 'date').reverse();
	const selectedSeasonAttributes = sorted[0];
	const values =
		(selectedSeasonAttributes?.values || []).reduce((acc, { metric, value }) => ({ ...acc, [metric]: value }), {}) ||
		{};

	return {
		offensive: getAttributeSetMeanValue(values, offensiveMetrics) || '-',
		defensive: getAttributeSetMeanValue(values, defensiveMetrics) || '-',
		attitude: getAttributeSetMeanValue(values, attitudeMetrics) || '-'
	};
}

function getAttributeSetMeanValue(attributes, selectedAttributes) {
	const sum = selectedAttributes
		.map(({ value }) => attributes[value])
		.reduce((total, a) => Number(total) + Math.pow(Number(a || 1), 2), 0);
	return Math.sqrt(sum / selectedAttributes.length)?.toFixed(0);
}

function getMillionsRange(from, to) {
	const fromString = !!from || from === 0 ? from + '' : '';
	const toString = !!to || to === 0 ? to + '' : '';
	const middleString = !!fromString && !!toString ? ' - ' : '';
	const millions = middleString ? ' M' : '';
	return fromString + middleString + toString + millions;
}
