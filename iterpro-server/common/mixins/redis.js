module.exports = function (Model, options) {
	require('redis');

	console.debug(`Setting cache for: ${Model.modelName}`, options.methods);

	const methods = options.methods.map(({ name }) => name.toLowerCase());
	Model.afterRemote('**', function (ctx, res, next) {
		const client = ctx.res.app.redisClient;
		if (methods.includes(ctx.method.name.toLowerCase()) && client && client.connected) {
			const modelName = ctx.method.sharedClass.name;

			// set key name
			const cache_key = getKeyForRequest(modelName, ctx.method.name, ctx.req);

			client.get(cache_key, function (err, val) {
				if (err) {
					console.error(err);
				}

				if (val == null) {
					// set cache key
					client.set(cache_key, JSON.stringify(res));
					const methodObj = options.methods.find(x => x.name.toLowerCase() === ctx.method.name.toLowerCase());
					const ttl =
						methodObj && methodObj.invalidation && methodObj.invalidation.ttl
							? Number(methodObj.invalidation.ttl)
							: null;
					if (ttl) client.expire(cache_key, ttl);

					next();
				} else {
					next();
				}
			});
		} else {
			next();
		}
	});

	Model.beforeRemote('**', function (ctx, res, next) {
		const client = ctx.req.app.redisClient;
		if (methods.includes(ctx.method.name.toLowerCase()) && client && client.connected) {
			const modelName = ctx.method.sharedClass.name;

			// set key name
			const cache_key = getKeyForRequest(modelName, ctx.method.name, ctx.req);

			// search for cache
			client.get(cache_key, function (err, val) {
				if (err) {
					console.error(err);
				}

				if (val !== null && val !== undefined) {
					ctx.result = JSON.parse(val);
					ctx.done(function (err) {
						if (err) return next(err);
					});
				} else {
					// return data
					next();
				}
			});
		} else {
			next();
		}
	});

	const getKeyForRequest = function (modelName, methodName, req) {
		// check for matched
		let matched = {};
		if (req.headers['filter']) {
			const filter = JSON.parse(req.headers['filter']);
			if (filter)
				matched = {
					...filter,
					...matched
				};
		}
		if (req.query) {
			matched = {
				...req.query,
				...matched
			};

			if (req.query.where) {
				const parsed = JSON.parse(req.query.where);
				matched = {
					...parsed,
					...matched
				};
			}
		}
		if (req.body) {
			const body = req.body;
			if (body)
				matched = {
					...body,
					...matched
				};
		}
		let matchedString = JSON.stringify(matched);

		matchedString = matchedString.replace(/[{}]/g, '_');
		matchedString = matchedString.replace(/[[\]]/g, '_');
		matchedString = matchedString.replace(/["]/g, '');
		matchedString = matchedString.replace(/[:]/g, '_');

		return modelName + '_' + methodName + '_' + JSON.stringify(matchedString);
	};
};
