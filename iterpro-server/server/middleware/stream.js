module.exports = function (app) {
	return (req, res, next) => {
		if (req.path.indexOf('stream') === -1) return next();
		res.setTimeout(24 * 3600 * 1000);
		res.set('X-Accel-Buffering', 'no');
		res.setHeader('Last-Modified', new Date().toUTCString());
		return next();
	};
};
