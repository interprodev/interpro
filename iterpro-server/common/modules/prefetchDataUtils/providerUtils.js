const { wyscoutMetrics } = require('./wyscout');

module.exports = {
	getMinutesField: function (teamData) {
		switch (teamData.providerPlayer) {
			case 'Wyscout': {
				return 'minutesPlayed';
			}
			default: {
				return teamData._playerProviderMapping.durationField;
			}
		}
	},
	getMetricPlayerStats: function (teamData) {
		switch (teamData.providerPlayer) {
			case 'Wyscout': {
				return wyscoutMetrics;
			}
			default: {
				return [...teamData._playerProviderMapping.rawMetrics.map(({ name }) => name)];
			}
		}
	}
};
