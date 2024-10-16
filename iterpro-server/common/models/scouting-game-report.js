module.exports = function (ScoutingGameReport) {
	ScoutingGameReport.observe('before save', async ctx => {
		if (!ctx.instance?.completed) return;
		try {
			const report = await ScoutingGameReport.findById(ctx.instance.id);
			if (!report?.completed || report?.completed === false)
				await ScoutingGameReport.app.models.Notification.checkForGameReportCompletion(ctx.instance);
			return;
		} catch (e) {
			throw console.error(e);
		}
	});
};
