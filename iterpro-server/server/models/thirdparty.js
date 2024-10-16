const ObjectID = require('mongodb').ObjectID;
const { flatten, uniq } = require('lodash');
const moment = require('moment-timezone');
const momentDurationFormatSetup = require('moment-duration-format');
momentDurationFormatSetup(moment);

const { FromAxiosError, InternalError } = require('../../common/modules/error');
const instatWyscoutWrapper = require('./thirdparty-connectors/instat');
const tacticalInfoProvider = require('./thirdparty-connectors/tacticalInfoProvider');
const catapult = require('./thirdparty-connectors/catapult');
const fieldwiz = require('./thirdparty-connectors/fieldwiz');
const gpexe = require('./thirdparty-connectors/gpexe');
const statsport = require('./thirdparty-connectors/statsport');
const sonra = require('./thirdparty-connectors/sonra');
const wyscout = require('./thirdparty-connectors/wyscout');
const wimu = require('./thirdparty-connectors/wimu');

const gpsProviderIds = ['statsportId', 'gpexeId', 'wimuId', 'sonraId'];

// pick all possible fields from every provider, since we don't have the document yet
const tacticalProviderIds = [
	tacticalInfoProvider.getProviderField('wyscout', 'id'),
	tacticalInfoProvider.getProviderField('wyscout', 'competitionId'),
	tacticalInfoProvider.getProviderField('instat', 'id'),
	tacticalInfoProvider.getProviderField('instat', 'competitionId')
];

module.exports = function (Thirdparty) {
	Thirdparty.getGPSPlayers = async function (teamId) {
		try {
			const [team, seasons] = await Promise.all([
				Thirdparty.app.models.Team.findById(teamId, {
					fields: ['id', 'device', 'providerTeam', 'thirdPartyCredentials', ...gpsProviderIds, ...tacticalProviderIds]
				}),
				Thirdparty.app.models.TeamSeason.find({ where: { teamId } })
			]);
			const currentSeason = (seasons || []).find(({ offseason, inseasonEnd }) =>
				moment().isBetween(offseason, inseasonEnd)
			);
			return getGPSPlayersByProvider(team, currentSeason);
		} catch (e) {
			console.error(e);
			throw e.isAxiosError ? FromAxiosError(e) : InternalError(e.message);
		}
	};

	Thirdparty.getTacticalPlayers = async function (teamId) {
		try {
			const team = await Thirdparty.app.models.Team.findById(teamId, {
				fields: [
					'id',
					'clubId',
					'device',
					'providerTeam',
					'providerPlayer',
					'thirdPartyCredentials',
					...gpsProviderIds,
					...tacticalProviderIds
				]
			});
			const provider = tacticalInfoProvider.extractProvider(team);
			const providerPromises = [
				Thirdparty.app.models.TeamSeason.getDataSource()
					.connector.collection(Thirdparty.app.models.TeamSeason.modelName)
					.find({ teamId: ObjectID(teamId) })
					.toArray(),
				Thirdparty.app.models.Player.find(tacticalInfoProvider.getTacticalPlayerQuery(provider, teamId)),
				Thirdparty.app.models.Team.getDataSource()
					.connector.collection(Thirdparty.app.models.Team.modelName)
					.find({ clubId: team.clubId }, { fields: { wyscoutId: true } })
					.toArray()
			];
			const [seasons, providerPlayers, clubTeamsWyscoutIds] =
				provider === 'wyscout' || provider === 'instat' ? await Promise.all(providerPromises) : [null, null];
			const players = await getTacticalPlayersByProvider(
				team,
				seasons,
				providerPlayers,
				uniq((clubTeamsWyscoutIds || []).map(({ wyscoutId }) => wyscoutId))
			);
			return players;
		} catch (error) {
			console.error(error);
			throw error.isAxiosError ? FromAxiosError(error) : InternalError(error.message);
		}
	};

	Thirdparty.getThirdpartyGPSSessions = async function (teamId, teamSeasonId, date, gdType, req) {
		req.setTimeout(0);
		try {
			const [team, { playerIds }] = await Promise.all([
				Thirdparty.app.models.Team.findById(teamId),
				Thirdparty.app.models.TeamSeason.findById(teamSeasonId, { fields: ['playerIds'] })
			]);
			const players = await Thirdparty.app.models.Player.find({
				where: { id: { inq: uniq(flatten(playerIds)).map(x => ObjectID(x)) }, archived: false }
			});
			const seasons = await Thirdparty.app.models.TeamSeason.find({
				where: { teamId: ObjectID(teamId) },
				fields: { id: true, name: true, offseason: true, inseasonEnd: true, thirdPartyCredentials: true }
			});
			date = moment(date, 'YYYY-MM-DDTHH:mm:ss ZZ').toDate();
			const sessions = await getGPSSessions(team, date, gdType, players, seasons);
			return sessions;
		} catch (e) {
			console.error(e);
			throw e.isAxiosError ? FromAxiosError(e) : InternalError(e.message);
		}
	};

	Thirdparty.updateThirdpartyPlayerIds = async function (playerArray) {
		if (playerArray?.length > 0) {
			const playerCollection = Thirdparty.app.models.Player.getDataSource().connector.collection(
				Thirdparty.app.models.Player.modelName
			);
			const promiseArray = [];
			for (const element of playerArray) {
				if (element.playerId) {
					promiseArray.push(
						playerCollection.update(
							{
								_id: ObjectID(element.playerId)
							},
							{
								$set: {
									wyscoutId: element.wyscoutId,
									gpexeId: element.gpexeId,
									statsportId: element.statsportId,
									sonraId: element.sonraId,
									catapultId: element.catapultId,
									wyscoutSecondaryTeamId: element.wyscoutSecondaryTeamId
								}
							}
						)
					);
				}
			}
			try {
				await Promise.all(promiseArray);
				return true;
			} catch (error) {
				console.error(error);
				return false;
			}
		}
		return true;
	};
};

async function getGPSSessions(team, date, gdType, players, seasons) {
	switch (team.device) {
		case 'Gpexe': {
			return await gpexe.getSessions(team, date, gdType, players, seasons);
		}
		case 'StatsportAPI': {
			return await statsport.getSessions(team, date, gdType, players);
		}
		case 'Sonra': {
			return await sonra.getSessions(team, date, gdType, players);
		}
		case 'Catapult': {
			return await catapult.getSessions(team, date, gdType, players);
		}
		case 'Fieldwiz': {
			return await fieldwiz.getSessions(team, date, gdType, players);
		}
		case 'Wimu': {
			return await wimu.getSessions(team, date, gdType, players);
		}
		default:
			return [];
	}
}

async function getGPSPlayersByProvider(team, currentSeason) {
	switch (team.device) {
		case 'Catapult': {
			return await catapult.getPlayers(team);
		}
		case 'Gpexe': {
			return await gpexe.getPlayers(team, currentSeason);
		}
		case 'StatsportAPI': {
			return await statsport.getPlayers(team);
		}
		case 'Fieldwiz': {
			return await fieldwiz.getPlayers(team);
		}
		case 'Wimu': {
			return await wimu.getPlayers(team);
		}
		default: {
			return [];
		}
	}
}

async function getTacticalPlayersByProvider(team, seasons, providerPlayers, clubTeamsWyscoutIds) {
	const currentTeamSeason = seasons.find(({ offseason, inseasonEnd }) =>
		moment().isBetween(moment(offseason), moment(inseasonEnd))
	);
	const { providerTeam, wyscoutId } = team;

	switch (providerTeam.toLowerCase()) {
		case 'wyscout': {
			if (wyscoutId) {
				return await wyscout.getPlayers(team, currentTeamSeason, clubTeamsWyscoutIds);
			} else {
				throw new Error('No wyscoutId provided!');
			}
		}
		case 'instat': {
			return await instatWyscoutWrapper.getPlayers(team, currentTeamSeason, providerPlayers);
		}
		default: {
			return [];
		}
	}
}
