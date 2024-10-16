const { getMinutesField } = require('./providerUtils');
const getInternationalGames = require('./getInternationalGames');
const getStatistics = require('./getStatistics');
const getCounters = require('./getCounters');
const dayjs = require('dayjs');
const moment = require('moment');
const { getId } = require('../db.utils');

module.exports = {
	setPrefetchedDataIfNotExist: async function (Model, prefetchDataContainer, data) {
		const { currentSeason, teamData } = data;
		const teamId = getId(teamData);
		if (teamId === undefined || teamId === 'undefined') {
			console.error('undefined teamId');
		}
		const alreadyExist = false;
		if (!alreadyExist) {
			const prefetchedData = await getPrefetchedData(Model, teamData, currentSeason);
			const item = {
				id: teamId,
				...prefetchedData
			};
			const { resource } = await prefetchDataContainer.items.upsert(item);
			console.log(`'${resource.id}' inserted`);
		}
	}
};

async function getPrefetchedData(Model, teamData, currentSeason) {
	const dateFrom = dayjs(currentSeason.offseason).startOf('day').toDate();
	const dateTo = dayjs().isAfter(moment(currentSeason.inseasonEnd))
		? dayjs(currentSeason.inseasonEnd).endOf('day').toDate()
		: dayjs().endOf('day').toDate();
	const minutesField = getMinutesField(teamData);
	const teamId = getId(teamData);
	const [internationalGames, teamStatistics] = await Promise.all([
		getInternationalGames(Model, teamId, dateFrom, dateTo),
		getStatistics(Model, teamId, null, dateFrom, dateTo, minutesField)
	]);
	const response = {
		internationalGames,
		teamStatistics,
		counters: {}
	};
	const eventTypes = ['ALL', 'INDIVIDUAL', 'NOTINDIVIDUAL'];
	await Promise.all(
		eventTypes.map(async eventType => {
			const individualFlag = eventType === 'ALL' ? null : eventType === 'INDIVIDUAL';
			response.counters[eventType] = await getCounters(Model, teamId, dateFrom, dateTo, eventType, individualFlag);
		})
	);
	console.log(`[PrefetchData] Done for team ${teamId}!`);
	return response;
}
