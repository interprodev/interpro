const asyncRedis = require('async-redis');

module.exports = function (Utils) {
	Utils.invalidateCache = async function (module, req) {
		try {
			const asyncClient = asyncRedis.decorate(Object.create(req.app.redisClient));
			const cacheKey = `${module}*`;
			const keys = await asyncClient.keys(cacheKey);
			await Promise.all(keys.map(key => asyncClient.del(key)));
			return true;
		} catch (e) {
			console.error(e);
			return e;
		}
	};

	Utils.remoteMethod('invalidateCache', {
		accepts: [
			{ arg: 'module', type: 'string', http: { source: 'form' } },
			{ arg: 'req', type: 'object', http: { source: 'req' } }
		],
		returns: {
			arg: 'response',
			type: 'boolean',
			root: true
		},
		http: {
			path: '/invalidateCache',
			verb: 'post'
		}
	});
};
