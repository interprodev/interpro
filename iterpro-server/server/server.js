const express = require('express');
const helmet = require('helmet');
const loopback = require('loopback');
const boot = require('loopback-boot');
const path = require('path');
const multer = require('multer');
const appInsights = require('applicationinsights');

require('cors');
require('dotenv').config({ path: path.join(__dirname, `../.env.${process.env.APP_ENV}`) });
// const Moment = require('moment');
// const MomentRange = require('moment-range');
// MomentRange.extendMoment(Moment);

appInsights
	.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
	.setAutoDependencyCorrelation(true)
	.setAutoCollectRequests(true)
	.setAutoCollectPerformance(true)
	.setAutoCollectExceptions(true)
	.setAutoCollectDependencies(true)
	.setAutoCollectConsole(true, true)
	.setSendLiveMetrics(false)
	.setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
	.setUseDiskRetryCaching(true)
	.start();

const app = (module.exports = loopback());

app.start = () => {
	// start the web server
	console.debug(`DB_URL: ${process.env.DB_URL}`);
	app.models.Customer.settings.acls = [];
	return app.listen(() => {
		app.emit('started');
		const baseUrl = app.get('url').replace(/\/$/, '');
		console.info('Web server listening at: %s', baseUrl);
		if (app.get('loopback-component-explorer')) {
			const explorerPath = app.get('loopback-component-explorer').mountPath;
			console.debug('Explorer mounted at %s%s', baseUrl, explorerPath);
		}
	});
};

// app.use(helmet());
app.use('/static', express.static('public'));
app.use(multer().any());
app.use(helmet());
app.set('etag', false);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../', 'common', 'templates', 'views'));

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, err => {
	if (err) throw err;
	if (require.main === module) app.start();
});
