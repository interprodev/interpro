module.exports = function (Playerstat) {
	Playerstat.importFromCsv = async function (playerStats, matchId, csvData) {
		const feedbackErrors = [];
		const matchRelated = await Playerstat.app.models.Match.findOne({ where: { id: matchId } });
		const { clubId } = await Playerstat.app.models.Team.findById(matchRelated.teamId, { clubId: 1 });
		matchRelated._playerStats = [];
		const eventLinked = await Playerstat.app.models.Event.findOne({ where: { id: matchRelated.eventId } });
		for (const ps of playerStats) {
			const foundPlayerStatEvent = eventLinked._playerMatchStats.find(p => p.playerName === ps.playerName);
			if (eventLinked.playerIds.find(pId => pId.toString() === ps.playerId.toString()) && foundPlayerStatEvent) {
				foundPlayerStatEvent.enabled = true;
				foundPlayerStatEvent.minutesPlayed = ps.minutesPlayed ? ps.minutesPlayed : foundPlayerStatEvent.minutesPlayed;
				foundPlayerStatEvent.substituteInMinute = ps.substituteInMinute
					? ps.substituteInMinute
					: foundPlayerStatEvent.substituteInMinute;
				foundPlayerStatEvent.substituteOutMinute = ps.substituteOutMinute
					? ps.substituteOutMinute
					: foundPlayerStatEvent.substituteOutMinute;
				foundPlayerStatEvent.yellowCard = ps.yellowCard ? ps.yellowCard : foundPlayerStatEvent.yellowCard;
				foundPlayerStatEvent.redCard = ps.redCard ? ps.redCard : foundPlayerStatEvent.redCard;
				matchRelated._playerStats.push(ps);
			} else {
				feedbackErrors.push('Player with displayName ' + ps.playerName + ' is not present in the event');
			}
		}
		eventLinked.playersSessionLoaded = true;
		const r = await Playerstat.app.models.Storage.uploadFile(String(clubId), csvData);
		if (r) eventLinked.csvPlayer = r;
		await Promise.all([eventLinked.save(), matchRelated.save()]);
		return {
			errors: feedbackErrors
		};
	};
};
