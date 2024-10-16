module.exports = function (Wellness) {
	Wellness.observe('before delete', async function (ctx) {
		const inst = await Wellness.findById(ctx.where.id, { include: { player: 'team' } });
		const wellnessJson = JSON.parse(JSON.stringify(inst));

		await Wellness.app.models.GOScore.checkForGoScore(
			wellnessJson.date,
			[wellnessJson.player.id],
			String(wellnessJson.player.team.id),
			wellnessJson.id,
			null
		);
	});

	Wellness.observe('after save', async function (ctx) {
		const linkedPlayer = await Wellness.app.models.Player.findById(ctx.instance.playerId, { include: 'team' });
		const playerJson = JSON.parse(JSON.stringify(linkedPlayer));
		await Wellness.app.models.GOScore.checkForGoScore(
			ctx.instance.date,
			[playerJson.id],
			String(playerJson.team.id),
			null,
			null
		);
	});
};
