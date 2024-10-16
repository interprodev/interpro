const { ObjectID } = require('mongodb');

module.exports = function (VideoAsset) {
	VideoAsset.observe('before save', async function (ctx) {
		const instance = ctx.currentInstance || ctx.instance;
		if (instance) {
			if (ObjectID.isValid(instance.linkedId)) {
				instance.linkedId = instance.linkedId.toString();
			}
			if (!instance.sharedPlayerIds) {
				instance.sharedPlayerIds = [];
			}
			for (let i = 0; i < instance.sharedPlayerIds.length; i++) {
				if (!ObjectID.isValid(instance.sharedPlayerIds[i])) {
					instance.sharedPlayerIds[i] = ObjectID(instance.sharedPlayerIds[i]);
				}
			}

			// never store the linkedObject in DB
			if (instance.linkedObject) {
				delete instance.linkedObject;
			}
		}
		return;
	});

	VideoAsset.getPlayerVideos = async function (playerId, linkedModel) {
		const videoCollection = VideoAsset.getDataSource().connector.collection(VideoAsset.modelName);
		const linkedVideos = await videoCollection.find({ linkedId: String(playerId), linkedModel }).toArray();
		return linkedVideos;
	};
};
