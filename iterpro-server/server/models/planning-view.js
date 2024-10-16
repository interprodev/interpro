const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const { groupBy } = require('lodash');

/**
 * Holding...
 * 1. planningViewPlan
 */
module.exports = function (PlanningView) {
	PlanningView.planningViewPlan = async function (teamId, dateFrom, dateTo) {
		const eventCollection = PlanningView.app.models.Event.getDataSource().connector.collection(
			PlanningView.app.models.Event.modelName
		);

		const pipelinePlanningViewPlan = PlanningView.pipelinePlanningViewPlan(teamId, dateFrom, dateTo);
		const resultsAggr = await eventCollection.aggregate(pipelinePlanningViewPlan).toArray();

		const groupedByIdResults = groupBy(resultsAggr, 'day');

		const groupedJson = JSON.parse(JSON.stringify(groupedByIdResults));
		const dataset = [];
		for (const keyDate in groupedJson) {
			const objDataset = {};
			objDataset['label'] = keyDate;
			objDataset['training'] = [];
			objDataset['game'] = [];
			objDataset['friendly'] = [];
			objDataset['format'] = [];
			objDataset['theme'] = [];
			objDataset['subtheme'] = [];
			objDataset['opponent'] = [];
			const events = groupedJson[keyDate];
			events.sort((d1, d2) => moment(d1.start).toDate().getTime() - moment(d2.start).toDate().getTime());
			for (const ev of events) {
				if (ev.format === 'training') {
					objDataset['training'].push(ev.workload);
				} else if (ev.format === 'game') {
					if (ev.subformat === 'friendly') {
						objDataset['friendly'].push(ev.workload);
					} else {
						objDataset['game'].push(ev.workload);
					}
				} else if (ev.format === 'friendly') {
					objDataset['friendly'].push(ev.workload);
				}
				objDataset['format'].push(ev.subformat === 'friendly' ? 'friendly' : ev.format);
				objDataset['theme'].push(ev.theme);
				objDataset['subtheme'].push(ev.subtheme);
				objDataset['opponent'].push(ev.opponent);
			}
			dataset.push(objDataset);
		}

		return dataset;
	};

	// Helper pipeline method of planningViewPlan
	PlanningView.pipelinePlanningViewPlan = function (teamId, dateFrom, dateTo) {
		const pipelineStages = [];

		const matchStage = {
			$match: {
				teamId: ObjectID(teamId),
				format: { $in: ['game', 'friendly', 'training'] },
				start: { $gte: dateFrom, $lte: dateTo },
				individual: false
			}
		};
		const projectStage = {
			$project: {
				format: 1,
				theme: 1,
				subtheme: 1,
				opponent: 1,
				subformat: 1,
				start: 1,
				workload: 1,
				day: { $dateToString: { format: '%d/%m/%Y', date: '$start' } }
			}
		};

		pipelineStages.push(matchStage);
		pipelineStages.push(projectStage);
		return pipelineStages;
	};

	// Helper remote method of planningViewPlan
	PlanningView.remoteMethod('planningViewPlan', {
		accepts: [
			{
				arg: 'teamId',
				type: 'string',
				http: { source: 'form' }
			},
			{
				arg: 'dateFrom',
				type: 'date',
				http: { source: 'form' }
			},
			{
				arg: 'dateTo',
				type: 'date',
				http: { source: 'form' }
			}
		],
		returns: {
			arg: 'response',
			type: 'object',
			root: true
		},
		http: {
			path: '/planningViewPlan',
			verb: 'post'
		}
	});
	// -----END of planningViewPlan----//
};
