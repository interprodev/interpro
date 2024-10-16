const { ObjectID } = require('mongodb');

module.exports = function (TeamTableFilterTemplate) {
	try {
		TeamTableFilterTemplate.observe('before delete', async ctx => {
			console.log('[TEAM TABLE FILTER TEMPLATE] Deleting %s matching %j');
			const template = await TeamTableFilterTemplate.findById(ctx.where.id);
			const templateTeamId = template.teamId;
			const activeTeamSettings = await TeamTableFilterTemplate.app.models.CustomerTeamSettings.find({
				where: { teamId: ObjectID(templateTeamId) }
			});
			for (const teamSetting of activeTeamSettings) {
				const tableFilterTemplateIds = (teamSetting?.tableFilterTemplateIds || []).filter(
					id => String(id) !== String(ctx.where.id)
				);
				await teamSetting.updateAttributes({ tableFilterTemplateIds });
			}
			return true;
		});
	} catch (e) {
		throw console.error(e);
	}

	try {
		TeamTableFilterTemplate.observe('before save', async ctx => {
			console.log('[TEAM TABLE FILTER TEMPLATE] before save');
			if (ctx.isNewInstance || ctx.data) {
				// Check if it's a new instance being created or an existing instance being updated
				const teamId = ctx.isNewInstance ? ctx.instance.teamId : ctx.data.teamId;
				const tableId = ctx.isNewInstance ? ctx.instance.tableId : ctx.data.tableId;
				const count = await TeamTableFilterTemplate.count({ and: [{ teamId }, { tableId }] });
				if (count >= 3) {
					const error = new Error('alert.filterTemplateLimitReached');
					error.statusCode = 400;
					throw error;
				}
			}
		});
	} catch (e) {
		throw console.error(e);
	}
};
