'use strict';
/**
 * This includes expected data/responses/results/values required for PlanningView service testing.
 */
module.exports = {
	expectedEndpointUrl: '/api/PlanningView/planningViewPlan',
	expectedContentType: 'application/json; charset=utf-8',
	wrongData: '{"id":12345677asjhdajd88}',
	wrongContentType: 'text/plain',
	params: {
		teamId: '5979b5c55fe28f1a50e781b8',
		dateFrom: '2019-05-13',
		dateTo: '2019-05-14'
	}
};

module.exports.getExpectedData = function () {
	return [
		{
			label: '13/05/2019',
			training: [1, 1, 3],
			game: [],
			friendly: [],
			format: ['training', 'training', 'training'],
			theme: ['recovery', 'reconditioning', 'field'],
			subtheme: [null, null, 'endurance'],
			opponent: [null, null, null]
		}
	];
};

module.exports.getPartiallyCorrectedData = function () {
	return [
		{
			label: '08/05/2019',
			training: [3, 1],
			game: [],
			friendly: [],
			format: ['training', 'training'],
			theme: ['field', 'reconditioning'],
			subtheme: ['power_speed', null],
			opponent: [null, null]
		}
	];
};
