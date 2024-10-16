const { getCustomerName } = require('./common-utils');
const playerReportUtils = require('./player-report-template-utils');
const { ObjectID } = require('mongodb');
module.exports = {
	getEventPlayerReport: async function (Model, eventId, playerId, staffId) {
		const event = await Model.app.models.Event.findById(eventId, {
			fields: ['format', 'teamId', 'teamReport', '_attachments']
		});
		const reportModel =
			event.format === 'training' ? Model.app.models.PlayerTrainingReport : Model.app.models.PlayerGameReport;
		let playerReport = await reportModel.findOne({
			where: { eventId: ObjectID(eventId), playerId: ObjectID(playerId) },
			fields: {
				id: 1,
				notes: 1,
				authorId: 1,
				reportData: 1,
				templateId: 1,
				templateVersion: 1,
				reportDataShareWithPlayer: 1,
				notesShareWithPlayer: 1
			}
		});
		if (!playerReport) return null;
		const videosPipeline = [
			{
				$match: {
					linkedId: String(eventId),
					linkedModel: 'Event',
					playerIds: ObjectID(playerId),
					...(staffId && { sharedStaffIds: ObjectID(staffId) }) // add staff filter if staffId is provided
				}
			},
			{
				$project: {
					id: 1,
					title: 1,
					subtitle: 1,
					_videoFile: 1
				}
			}
		];
		const videos = await Model.app.models.VideoAsset.getDataSource()
			.connector.collection(Model.app.models.VideoAsset.modelName)
			.aggregate(videosPipeline)
			.toArray();
		let _documents = (event?._attachments || []).filter(({ sharedPlayerIds }) =>
			(sharedPlayerIds || []).map(String).includes(String(playerId))
		);
		if (staffId) {
			_documents = _documents.filter(({ sharedStaffIds }) =>
				(sharedStaffIds || []).map(String).includes(String(staffId))
			);
		}
		playerReport = {
			...playerReport.__data,
			author: await getCustomerName(Model, playerReport.authorId),
			_videos: videos,
			_documents: _documents
		};
		const teamTemplates =
			event.format === 'training'
				? await playerReportUtils.getTrainingReportTemplates(event.teamId, Model.app.models.Team)
				: await playerReportUtils.getGameReportTemplates(event.teamId, Model.app.models.Team);
		return await playerReportUtils.getMappedReportData(playerReport, teamTemplates);
	}
};
