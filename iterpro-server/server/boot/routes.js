const moment = require('moment');
const { AuthorizationError } = require('../../common/modules/error');
const { baseURL } = require('../../config/jsreport.config.json');
const JSReportClient = require('@jsreport/nodejs-client')(
	baseURL,
	process.env.JSREPORT_USERNAME,
	process.env.JSREPORT_PASSWORD
);

const isTrueSet = value => value === 'true';

module.exports = function (app) {
	const User = app.models.Customer;

	app.get('/', app.loopback.status());

	// hit when the user clicks on Request Password Reset button
	app.get('/reset-password', function (req, res, next) {
		if (!req.query.access_token) return res.sendStatus(401);
		const player = !!req.query.player;
		app.models.AccessToken.getDataSource()
			.connector.collection(app.models.AccessToken.modelName)
			.findOne({ _id: req.query.access_token }, (err, token) => {
				if (err) return res.send(err);
				if (!token) return res.render('expired', { WELCOME: isTrueSet(req.query.welcome), TYPE: 'invalid' });
				const expiryDate = moment(token.created).add(token.ttl, 'second');
				if (moment().isAfter(expiryDate))
					return res.render('expired', { WELCOME: isTrueSet(req.query.welcome), TYPE: 'expired' });
				const baseUrl = player ? '/api/customerPlayers' : '/api/customers';
				const data = {
					URL: `${baseUrl}/reset-password?access_token=${token._id}`
				};
				res.render('password-reset', data);
			});
	});

	app.post('/login', function (req, res) {
		User.login(
			{
				email: req.body.email,
				password: req.body.password,
				code: req.body.code
			},
			'user',
			function (err, token) {
				if (err) {
					res.send(err);
					return;
				}
				res.send(token.id);
			}
		);
	});

	app.post('/logout', function (req, res, next) {
		if (!req.accessToken) return res.sendStatus(401);
		User.logout(req.accessToken.id, function (err) {
			if (err) return next(err);
			res.redirect('/');
		});
	});

	app.post('/pdf-report', (req, res, next) => {
		if (!req.headers['authorization']) return next(AuthorizationError('Auth token not provided'));
		app.models.AccessToken.getDataSource()
			.connector.collection(app.models.AccessToken.modelName)
			.findOne({ _id: req.headers['authorization'] }, (err, token) => {
				if (err) next(err);
				if (!token) next(AuthorizationError('Auth token not provided'));
				const { data, name } = req.body;
				console.log(`[JSREPORT] requesting template ${name} to remote server...`);
				JSReportClient.render({
					template: { name },
					data,
					contentDisposition: 'attachment; filename=myreport.pdf'
				})
					.then(response => {
						console.log(`[JSREPORT] received response`);
						if (!res.headersSent) {
							response.on('data', chunk => {
								console.log(`[JSREPORT] received data chunk`);
								res.write(chunk);
							});
							response.on('end', () => {
								console.log(`[JSREPORT] finished sending response`);
								res.end();
							});
						} else {
							console.log(`[JSREPORT] headers already sent, cannot send response`);
						}
					})
					.catch(error => {
						console.error(`[JSREPORT] error rendering report: ${error}`);
						next(error);
					});
			});
	});
};
