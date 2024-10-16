module.exports = function (PlayerReport) {
	PlayerReport.observe('before delete', async ctx => {
		try {
			console.log(
				`[PLAYER REPORT] Deleting ${ctx.Model.name} matching ${ctx.where.id}. Removing attachments from Cloud Storage...`
			);
			const report = await PlayerReport.findById(ctx.where.id);
			const { clubId } = await PlayerReport.app.models.Team.findById(report.teamId);
			await Promise.all([
				...(report._videos || []).map(({ url }) => PlayerReport.app.models.Storage.deleteFile(clubId, url)),
				...(report._documents || []).map(({ url }) => PlayerReport.app.models.Storage.deleteFile(clubId, url))
			]);
		} catch (e) {
			throw console.error(e);
		}
	});
};
