const { CosmosClient } = require('@azure/cosmos');
module.exports = {
	getPrefetchDataContainer: async function () {
		// #region Azure Cosmos
		const endpoint = process.env.AZ_COSMOS_ENDPOINT;
		const key = process.env.AZ_COSMOS_KEY;
		const client = new CosmosClient({ endpoint, key });
		const { database } = await client.databases.createIfNotExists({ id: process.env.AZ_COSMOS_PREFETCH_DB_NAME });
		console.debug(`${database.id} database ready`);
		const partitionKeyPath = ['/id'];
		const { container } = await database.containers.createIfNotExists({
			id: 'PrefetchedData',
			partitionKey: {
				paths: partitionKeyPath
			}
		});
		console.debug(`${container.id} container ready`);
		return container;
		// endregion
	}
};
