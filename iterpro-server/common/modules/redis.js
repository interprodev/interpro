const redis = require('redis');

module.exports = {
	getRedisClient: function () {
		const clientSettings = {
			host: process.env.REDIS_HOST,
			port: process.env.REDIS_PORT,
			password: process.env.REDIS_PASSWORD
		};
		return redis.createClient(clientSettings);
	}
};
