const wyscoutConnector = require('./wyscout');
const instatConfig = require('../../../config/instat.config.json');
const wyscoutConfig = require('../../../config/wyscout.config.json');
const instat = require('./instat');
const { fields: instatFields } = instatConfig;
const { fields: wyscoutFields } = wyscoutConfig;
const providers = [instatConfig, wyscoutConfig];

/** This provider acts as a gateway for all player info provider services such as Wyscout */
module.exports = {
	getPlayers: (provider, team, currentSeason, players) => {
		switch (provider.toLowerCase()) {
			case 'instat':
				return instat.getPlayers(team, currentSeason, players);
			case 'wyscout':
			default:
				return wyscoutConnector.getPlayers(team, currentSeason, players);
		}
	},
	getTeamHistory: (provider, providerTeamId, providerToken) => {
		switch (provider.toLowerCase()) {
			case 'instat':
				return instat.getTeamHistory(providerTeamId);
			case 'wyscout':
			default:
				return wyscoutConnector.getTeamHistory(providerTeamId, providerToken);
		}
	},
	getCompetitionPlayers: (provider, competitionProviderId, providerToken) => {
		switch (provider.toLowerCase()) {
			case 'instat':
				return instat.getCompetitionPlayers(competitionProviderId);
			case 'wyscout':
			default:
				return wyscoutConnector.getCompetitionPlayers(competitionProviderId, providerToken);
		}
	},
	getSquadSeasonPlayers: (provider, squadId, seasonId, token) => {
		switch (provider.toLowerCase()) {
			case 'instat':
				return instat.getSquadSeasonPlayers(squadId, seasonId);
			case 'wyscout':
			default:
				return wyscoutConnector.getSquadSeasonPlayers(squadId, seasonId, token);
		}
	},
	getMatchesForSeason: (provider, seasonId, token) => {
		switch (provider.toLowerCase()) {
			case 'instat':
				return instat.getMatchesForSeason(seasonId);
			case 'wyscout':
			default:
				return wyscoutConnector.getMatchesForSeason(seasonId, token);
		}
	},
	getTeamStatsForMatch: (provider, seasonId, token) => {
		switch (provider.toLowerCase()) {
			case 'instat':
				return instat.getTeamStatsForMatch(seasonId);
			case 'wyscout':
			default:
				return wyscoutConnector.getTeamStatsForMatch(seasonId, token);
		}
	},
	getPlayerActiveTransfer: (provider, seasonId, token) => {
		switch (provider.toLowerCase()) {
			case 'instat':
				return instat.getPlayerActiveTransfer(seasonId);
			case 'wyscout':
			default:
				return wyscoutConnector.getPlayerActiveTransfer(seasonId, token);
		}
	},
	getPlayerCareer: (provider, seasonId, token) => {
		switch (provider.toLowerCase()) {
			case 'instat':
				return instat.getPlayerCareer(seasonId);
			case 'wyscout':
			default:
				return wyscoutConnector.getPlayerCareer(seasonId, token);
		}
	},
	getPlayerTransfers: (provider, seasonId, token) => {
		switch (provider.toLowerCase()) {
			case 'instat':
				return instat.getPlayerTransfers();
			case 'wyscout':
			default:
				return wyscoutConnector.getPlayerTransfers(seasonId, token);
		}
	},
	getPlayerImage: (provider, providerId, token) => {
		switch (provider.toLowerCase()) {
			case 'instat':
				return instat.getPlayerImage(providerId);
			case 'wyscout':
			default:
				return wyscoutConnector.getPlayerImage(providerId, token);
		}
	},
	getTeamWithImage: (provider, providerId, token) => {
		switch (provider.toLowerCase()) {
			case 'instat':
				return instat.getTeamWithImage(providerId);
			case 'wyscout':
			default:
				return wyscoutConnector.getTeamWithImage(providerId, token);
		}
	},
	getCareerTransfers: (provider, playerProviderId) => {
		switch (provider.toLowerCase()) {
			case 'instat':
				return instat.careerTransfers(playerProviderId);
			case 'wyscout':
			default:
				return wyscoutConnector.careerTransfers(playerProviderId);
		}
	},
	syncClubEventWithProvider: (provider, Event, event, lineup) => {
		switch (provider.toLowerCase()) {
			case 'instat':
				return instat.syncSingleClubEventWithInstat(Event, event, lineup);
			case 'wyscout':
			default:
				return wyscoutConnector.syncSingleClubEventWithWyscout(Event, event, lineup);
		}
	},
	syncEventWithProvider: (provider, Event, event, providerId, lineup, isNational) => {
		switch (provider.toLowerCase()) {
			case 'instat':
				return instat.syncSingleEventWithInstat(Event, event, providerId, lineup);
			case 'wyscout':
			default:
				return wyscoutConnector.syncSingleEventWithWyscout(Event, event, providerId, lineup, isNational);
		}
	},
	getProviderField: (provider, field) => {
		switch (provider.toLowerCase()) {
			case 'instat':
				return instatFields[field];
			case 'wyscout':
			default:
				return wyscoutFields[field];
		}
	},
	/** @see Match.updateMatchWithWyscoutData */
	parseProviderEventObject: function (provider, eventObject) {
		switch (provider.toLowerCase()) {
			case 'instat': // same as wyscout, It will be converted before
			case 'wyscout':
			default: {
				const { dateutc, label, winner } = eventObject;
				const [, result] = label.split(',');
				return {
					dateutc,
					result,
					winner
				};
			}
		}
	},
	getTacticalPlayerQuery: function (provider, teamId) {
		const commonWhereAndArgs = { teamId, archived: false };
		const commonProjectionFields = {
			id: 1,
			displayName: 1,
			firstName: 1,
			lastName: 1,
			birthDate: 1
		};
		switch (provider.toLowerCase()) {
			case 'instat': {
				return {
					where: { ...commonWhereAndArgs, instatId: { neq: null } },
					fields: {
						...commonProjectionFields,
						instatId: 1,
						instatTeamId: 1,
						instatSecondaryTeamId: 1
					}
				};
			}
			case 'wyscout':
			default: {
				return {
					where: { ...commonWhereAndArgs, wyscoutId: { neq: null } },
					fields: {
						...commonProjectionFields,
						wyscoutId: 1,
						wyscoutTeamId: 1,
						wyscoutSecondaryTeamId: 1
					}
				};
			}
		}
	},
	// return the name of provider according to document settings (supporting Wyscout and Instat)
	extractProvider: function (document) {
		if (document) {
			const { providerTeam, providerPlayer } = document;
			const documentProvider = providers.find(
				({ name, fields: { id: idField } }) =>
					(providerTeam === name || providerPlayer === name) && document[idField] !== null
			);
			if (documentProvider) return documentProvider.identifier;
		}
		// default case
		return '';
	}
};
