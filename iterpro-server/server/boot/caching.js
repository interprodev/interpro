const redis = require('../../common/mixins/redis.js');
const cacheConfig = require('../../config/cache.config.json');
module.exports = function (app) {
	for (const mod of cacheConfig.models) {
		redis(app.models[mod.name], { methods: mod.methods });
	}
};
