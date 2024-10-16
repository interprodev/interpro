const { QueueServiceClient } = require('@azure/storage-queue');

const thresholdQueueName = 'threshold-fn-queue';
const robustnessQueueName = 'robustness-fn-queue';
const medicalThresholdQueueName = 'medical-threshold-fn-queue';
module.exports = {
	getQueueClient: function () {
		return QueueServiceClient.fromConnectionString(process.env.AZ_STORAGE_QUEUE_CONNECTION_STRING);
	},
	pushEventToAzureQueue: async (queue, payload) => {
		console.info(`Sending action request to queue: ${queue.name}`);
		// eslint-disable-next-line no-useless-catch
		try {
			// Create buffer object, specifying utf8 as encoding
			const bufferObj = Buffer.from(JSON.stringify(payload), 'utf8');
			// Encode the Buffer as a base64 string
			const base64String = bufferObj.toString('base64');
			await queue.sendMessage(base64String);
		} catch (error) {
			throw error;
		}
	},
	thresholdQueueName: thresholdQueueName,
	robustnessQueueName: robustnessQueueName,
	medicalThresholdQueueName: medicalThresholdQueueName,
	getPayloadForQueue: function (queueName, teamData, currentSeason, playerId, testId) {
		const essentialTeamData = teamData
			? {
					...teamData.__data,
					_gpsProviderMapping: {
						rawMetrics: (teamData.__data._gpsProviderMapping?.rawMetrics || []).map(({ name }) => name),
						_gpsMetricsMapping: (teamData.__data._gpsProviderMapping?._gpsMetricsMapping || []).map(
							({ columnName }) => columnName
						)
					},
					_playerProviderMapping: {
						durationField: teamData.__data._playerProviderMapping?.durationField,
						rawMetrics: (teamData.__data._playerProviderMapping?.rawMetrics || []).map(({ name }) => name)
					},
					enabledModules: teamData.__data.enabledModules
			  }
			: null;
		switch (queueName) {
			case thresholdQueueName:
				return {
					teamData: essentialTeamData,
					currentSeason,
					playerId: String(playerId)
				};
			case robustnessQueueName:
				return {
					teamData: {
						id: String(essentialTeamData.id),
						_playerProviderMapping: essentialTeamData._playerProviderMapping,
						providerPlayer: essentialTeamData.providerPlayer
					},
					currentSeason,
					playerId: String(playerId)
				};
			case medicalThresholdQueueName:
				return {
					currentSeason: currentSeason,
					playerId: playerId,
					testId: String(testId) // need it only for medical events
				};
			default:
				console.error('queue not supported');
		}
	}
};
