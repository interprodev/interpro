const { ObjectID } = require('mongodb');
const speakeasy = require('speakeasy');
const qrCode = require('qrcode');
const { isEmpty } = require('lodash');
const { issuer, encoding } = require('../../config/speakeasy.config.json');
const {
	AuthorizationError,
	BadRequestError,
	InternalError,
	ForbiddenError,
	UnprocessableEntityError
} = require('../modules/error.js');
const { capitalize, isOnlineEnv, getHost, getClientHost } = require('../modules/utils');
const moment = require('moment');
const passwordUtil = require('../modules/lambda-password-utils');
const { sendEmail, renderEmailFromSendGridTemplate } = require('../../server/shared/emails-utils');

const defaultMetrics = [
	'rpe',
	'rpeTl',
	'heartRate85to90',
	'heartRateGr90',
	'totalDistance',
	'sprintDistance',
	'highspeedRunningDistance',
	'powerDistance',
	'highPowerDistance',
	'powerPlays',
	'highIntensityDeceleration',
	'explosiveDistance',
	'highIntensityAcceleration',
	'averageMetabolicPower',
	'distancePerMinute',
	'workload',
	'perceivedWorkload',
	'kinematicWorkload',
	'metabolicWorkload',
	'mechanicalWorkload',
	'cardioWorkload',
	'intensity'
];

module.exports = function (Customer) {
	Customer.observe('before delete', async ctx => {
		try {
			const id = ctx.where.id.inq[0];
			console.log(`[CUSTOMER] Deleted Customer with id ${id}. Deleting associated entities...`);
			process.nextTick(
				async () =>
					await Promise.all([
						Customer.app.models.CustomerTeamSettings.destroyAll({ customerId: id }),
						Customer.app.models.Notification.destroyAll({ customerId: id })
					])
			);
		} catch (e) {
			console.error(e);
			throw e;
		}
	});

	Customer.resetPasswordRequest = async email => {
		try {
			console.log(`[AUTH] Received password reset request from ${email}`);
			const customer = await Customer.findOne({ where: { email } });
			if (!customer) {
				console.error('Password reset request error: user not found');
			} else {
				const club = await Customer.app.models.Club.findById(customer.clubId);
				if (!club) {
					throw InternalError('Club not found!');
				}
				if (!club.active) {
					throw ForbiddenError('The associated Club has been deactivated! Please contact support');
				}
				if (customer?.isTempPassword) {
					console.error('Password reset request error: user did not change temp password yet');
				} else {
					await Customer.resetPassword({ email });
				}
			}
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	// send password reset link when requested
	Customer.on('resetPasswordRequest', async ({ accessToken, user, email }) => {
		try {
			const club = await Customer.app.models.Club.findById(user.clubId);
			if (!club.active) {
				throw new ForbiddenError('The associated Club has been deactivated! Please contact support');
			}

			await createResetEmail(email, user.firstName, accessToken);
		} catch (e) {
			console.error(e);
			throw e;
		}
	});

	// render UI page after password reset (on login page)
	Customer.afterRemote('setPassword', async (context, user, next) => {
		const {
			args: { id: userId }
		} = context;
		const customer = await Customer.app.models.Customer.findOne({ where: { id: userId } });
		const club = await Customer.app.models.Club.findOne({ where: { id: ObjectID(customer.clubId) } });
		const data = {
			TITLE: 'Password reset success',
			CONTENT: 'Your password has been reset successfully',
			HOST: getClientHost(club)
		};
		context.res.render('password-reset-success', data);
		await Customer.postChangePassword(userId);
	});

	Customer.checkPasswordSecurity = async function (password) {
		if (!password) {
			throw InternalError('Password not provided!');
		} else {
			const result = await passwordUtil.getPasswordValidityAndStrength({ password });
			if (!result.valid) {
				throw InternalError('Password not secure!');
			} else {
				return true;
			}
		}
	};

	Customer.postChangePassword = async function (userId) {
		const customer = await Customer.findById(userId);
		if (!customer) {
			console.error(`User ${userId} not found!`);
			throw InternalError('Error while resetting password!');
		}

		const accessTokens = await Customer.app.models.AccessToken.find({ where: { userId: ObjectID(userId) } });
		await Promise.all(accessTokens.map(token => token.destroy()));

		await customer.updateAttribute('isTempPassword', false);

		const club = await Customer.app.models.Club.findOne({ where: { id: ObjectID(customer.clubId) } });
		await sendPasswordChangeSuccessEmail(customer, club);
	};

	Customer.changePasswordRequest = async function (customerId, oldPassword, newPassword) {
		console.log(`[CUSTOMER] Requested password change from ${customerId}`);
		const customer = await Customer.findById(customerId);
		if (!customer) throw InternalError('User not found');

		await Customer.checkPasswordSecurity(newPassword);
		try {
			await customer.changePassword(oldPassword, newPassword);
		} catch (e) {
			throw InternalError(e.message);
		}
		await Customer.postChangePassword(customerId);

		try {
			const accessToken = await Customer.login({
				email: customer.email,
				password: newPassword,
				ttl: process.env.AUTH_TOKEN_TTL || 604800
			});
			if (!accessToken) {
				throw AuthorizationError('Invalid Credentials');
			}
			await customer.updateAttribute('webLatestLogin', moment().toDate());
			return {
				token: accessToken,
				customerId: customer.id
			};
		} catch (e) {
			throw InternalError('Invalid credentials');
		}
	};

	// send welcome email when requested
	Customer.welcomeEmail = async function (customerId) {
		console.log(`[CUSTOMER] Sending welcome email for ${customerId}`);
		const customer = await Customer.findOne({ where: { id: ObjectID(customerId) } });
		if (!customer) {
			console.error(`User ${customerId} not found!`);
			throw InternalError('Error while sending welcome email!');
		}
		if (!customer.isTempPassword) {
			console.error(`User invitation email already sent!`);
			throw InternalError('User invitation email already sent!!');
		}
		const club = await Customer.app.models.Club.findOne({ where: { id: ObjectID(customer.clubId) } });
		const { password: tempPassword } = await passwordUtil.generateStrongPassword();
		if (!tempPassword) {
			console.error(`Error while generating temporary password!`);
			throw InternalError('Error while generating temporary password!');
		}
		await customer.updateAttribute('password', tempPassword);

		const accessToken = await Customer.login({
			email: customer.email,
			password: tempPassword,
			ttl: process.env.AUTH_TOKEN_TTL_TEMP || 172800 // 48 hours
		});

		if (!accessToken) {
			throw AuthorizationError('Invalid Credentials');
		}

		await createWelcomeEmail(customer.email, customer.firstName, club, accessToken);
	};

	// NOTE: not sure what this does and why, needs a better review
	Customer.checkSelectedMetricsTeam = async function (tokenId, teamId) {
		const customerCollection = Customer.app.models.Customer.getDataSource().connector.collection(
			Customer.app.models.Customer.modelName
		);
		const teamCollection = Customer.app.models.Team.getDataSource().connector.collection(
			Customer.app.models.Team.modelName
		);
		if (!tokenId) throw AuthorizationError('Not authorized');

		const [token, team] = await Promise.all([
			Customer.app.models.AccessToken.findById(tokenId),
			teamCollection.findOne({ _id: ObjectID(teamId) })
		]);
		if (!token) throw AuthorizationError('Not authorized');
		if (!team) throw InternalError('Team not found');

		const customer = await customerCollection.findOne({ _id: ObjectID(token.userId) });
		if (!customer) {
			throw InternalError('User not found');
		}

		const activeTeamSettings = await Customer.app.models.CustomerTeamSettings.find({
			where: { teamId: ObjectID(teamId) }
		});
		if (!isEmpty(activeTeamSettings)) {
			const {
				_gpsProviderMapping: gpsMapping,
				_playerProviderMapping: playerMapping,
				_teamProviderMapping: teamMapping,
				providerTeam,
				providerPlayer
			} = team;

			const teamSettingsToSave = [];
			for (const teamSetting of activeTeamSettings) {
				let toSave = false;

				if (teamSetting?.metricsPerformance && gpsMapping?.rawMetrics?.length > 0) {
					for (let i = 0; i < teamSetting.metricsPerformance.length; i++) {
						const met = teamSetting.metricsPerformance[i];
						const rawMetricsToCheck = gpsMapping.rawMetrics.map(({ name }) => name?.toLowerCase());
						const defMetricsToCheck = defaultMetrics.map(metric => metric?.toLowerCase());
						const metricsTotalToCheck = rawMetricsToCheck.concat(defMetricsToCheck);
						const index = metricsTotalToCheck.findIndex(metric => metric.toLowerCase() === met.toLowerCase());
						if (index === -1) {
							teamSetting.metricsPerformance.splice(i, 1);
							toSave = true;
						}
					}
				}

				if (providerTeam === 'Dynamic' && teamSetting?.metricsTeamTactical && teamMapping?.rawMetrics?.length > 0) {
					for (let i = 0; i < teamSetting.metricsTeamTactical.length; i++) {
						const met = teamSetting.metricsTeamTactical[i];
						const index = teamMapping.rawMetrics
							.map(({ name }) => name?.toLowerCase())
							.findIndex(metric => metric.toLowerCase() === met.toLowerCase());
						if (index === -1) {
							teamSetting.metricsTeamTactical.splice(i, 1);
							toSave = true;
						}
					}
				}

				if (
					providerPlayer === 'Dynamic' &&
					teamSetting?.metricsIndividualTactical &&
					playerMapping?.rawMetrics.length > 0
				) {
					for (let i = 0; i < teamSetting.metricsIndividualTactical.length; i++) {
						const met = teamSetting.metricsIndividualTactical[i];
						const index = playerMapping.rawMetrics
							.map(({ name }) => name?.toLowerCase())
							.findIndex(metric => metric.toLowerCase() === met.toLowerCase());
						if (index === -1) {
							teamSetting.metricsIndividualTactical.splice(i, 1);
							toSave = true;
						}
					}
				}

				if (toSave) {
					teamSettingsToSave.push(teamSetting);
				}
			}
			await Promise.all(teamSettingsToSave.map(teamSetting => teamSetting.save()));
			return true;
		}
	};

	Customer.performLogout = async function (req) {
		try {
			if (req.accessToken) {
				await Customer.logout(req.accessToken.id);
				await Customer.app.models.AccessToken.destroyById(req.accessToken.id);
			}
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Customer.getPasswordRequirements = async function () {
		try {
			return await passwordUtil.getPasswordRequirements();
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Customer.generateStrongPassword = async function () {
		try {
			return await passwordUtil.generateStrongPassword();
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Customer.isValidPassword = async function (passwordValidationInput) {
		try {
			const { password } = passwordValidationInput;
			if (!password) {
				throw BadRequestError('Password not provided');
			}
			return await passwordUtil.getPasswordValidityAndStrength(passwordValidationInput);
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Customer.requestLogin = async function (credentials, req) {
		try {
			const { email, password } = credentials;
			if (!email || !password) {
				throw BadRequestError('Credentials not provided');
			}
			console.log(`[LOGIN] Requested web app login from ${email}`);
			const customer = await Customer.findOne({
				where: { email },
				fields: ['useTwoFactor', 'id', 'password', 'clubId']
			});
			if (!customer) {
				console.error('User not found');
				throw AuthorizationError('Invalid Credentials');
			}
			const club = await Customer.app.models.Club.findById(customer.clubId);
			if (!club.active) {
				throw new ForbiddenError('The associated Club has been deactivated! Please contact support');
			}
			// if (req.headers['appmode'] && club.type !== req.headers['appmode']) {
			// 	throw new ForbiddenError('Your organization is not allowed to access this version of Iterpro');
			// }
			const isMatch = await customer.hasPassword(password);
			if (!isMatch) {
				throw AuthorizationError('Invalid Credentials');
			}
			return { useTwoFactor: customer.useTwoFactor, userId: customer.id };
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Customer.performLogin = async function (credentials) {
		try {
			const { email, password, code } = credentials;
			if (!email || !password || !code) {
				throw BadRequestError('Credentials not provided');
			}
			console.log(`[LOGIN] Performing web app login from ${email}`);
			const customer = await this.findOne({ where: { email }, fields: ['secretTwoFactor', 'id', 'email', 'password'] });
			if (!customer) {
				throw InternalError('User not found');
			}
			const verified = verifyCode(customer.secretTwoFactor, code);
			if (!verified) {
				throw AuthorizationError('Two-Factor token is not correct');
			}
			await Customer.checkForExpiredTokens(customer.id);
			const accessToken = await Customer.login({
				email,
				password,
				ttl: process.env.AUTH_TOKEN_TTL || 604800
			});
			if (!accessToken) {
				throw AuthorizationError('Invalid Credentials');
			}
			await customer.updateAttribute('webLatestLogin', moment().toDate());
			return accessToken;
		} catch (e) {
			console.error(e);
			throw AuthorizationError('Invalid Credentials');
		}
	};

	Customer.generateSecret = async function (customerId) {
		try {
			if (!customerId) {
				throw AuthorizationError('Invalid Credentials');
			}
			console.log(`[LOGIN] Requested secret generation from customerId ${customerId}`);
			const customer = await Customer.findOne({
				where: { id: ObjectID(customerId) },
				fields: ['secretTwoFactorTemp', 'id', 'email', 'password']
			});
			if (!customer) {
				throw InternalError('User not found');
			}
			const { base32: textCode } = speakeasy.generateSecret();
			if (!textCode) {
				throw InternalError('Error while generating secret');
			}
			const [qrCode] = await Promise.all([
				generateQRCode(customer, textCode),
				customer.updateAttribute('secretTwoFactorTemp', textCode)
			]);
			if (!qrCode) {
				throw InternalError('Error while generating QR code');
			}
			return { qrCode, textCode };
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Customer.validateSecret = async function (credentials) {
		try {
			const { email, password, code } = credentials;
			if (!email || !password || !code) {
				throw BadRequestError('Credentials not provided');
			}
			console.log(`[LOGIN] Validating secret for ${email}`);
			const customer = await this.findOne({
				where: { email },
				fields: ['secretTwoFactorTemp', 'id', 'email', 'password']
			});
			if (!customer) {
				throw InternalError('User not found');
			}
			const secret = customer.secretTwoFactorTemp;
			const verified = verifyCode(secret, code);
			if (!verified) {
				throw BadRequestError(
					'Error validating secret. Check if authenticator code is correct and always scan the QR code for the current authenticator secret code.'
				);
			}
			await customer.updateAttributes({
				useTwoFactor: true,
				secretTwoFactor: secret,
				secretTwoFactorTemp: null
			});
			return Customer.performLogin(credentials);
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Customer.resetSecret = async function (customerId) {
		try {
			if (!customerId) {
				throw UnprocessableEntityError('User ID not provided');
			}
			console.log(`[LOGIN] Requested secret reset from customer ${customerId}`);
			const customer = await Customer.findOne({ where: { id: ObjectID(customerId) } });
			if (!customer) {
				throw InternalError('User not found');
			}
			await customer.updateAttributes({
				useTwoFactor: false,
				secretTwoFactor: null,
				secretTwoFactorTemp: null
			});
			return { result: true };
		} catch (e) {
			console.log(e);
			throw e;
		}
	};

	Customer.checkForExpiredTokens = async function (userId) {
		const accessTokens = await Customer.app.models.AccessToken.find({ where: { userId } });
		const expired = (accessTokens || []).filter(({ created, ttl }) =>
			moment(created).add(ttl, 'seconds').isSameOrBefore(moment())
		);
		const removed = await Promise.all(expired.map(token => token.destroy()));
		console.log(`[LOGIN] Removed ${removed.length} expired access tokens for user ${userId}`);
	};
};

function generateQRCode(customer, secret) {
	let label = customer.email;
	if (isOnlineEnv()) {
		label = `${label}_${process.env.APP_ENV || 'dev'}`;
	}
	const otpAuthUrl = speakeasy.otpauthURL({
		secret,
		label,
		issuer,
		encoding
	});
	return qrCode.toDataURL(otpAuthUrl);
}

function verifyCode(secret, token) {
	return speakeasy.totp.verify({
		secret,
		token,
		encoding,
		window: 10
	});
}

function getResetUrl({ id }, welcome) {
	return `${getHost()}/reset-password?access_token=${id}&welcome=${!!welcome}`;
}

// send confirmation email when successfully resetting/changing password
async function sendPasswordChangeSuccessEmail(customer, club) {
	console.log(`[CUSTOMER] Sending confirmation email for customer ${customer._id}...`);
	if (customer) {
		await createSuccessPasswordChangeEmail(customer.email, customer.firstName, club);
	}
}

async function createWelcomeEmail(recipient, firstName, club, accessToken) {
	const data = {
		NAME: capitalize(firstName),
		URL: getResetUrl(accessToken, true),
		HOST: getClientHost(club)
	};

	const config = {
		recipient,
		subject: 'Welcome to Iterpro!',
		template_id: 'd-54336a027d7b4cae8d11c65e514bae7d'
	};

	const emails = renderEmailFromSendGridTemplate(data, config);

	await sendEmail(emails);
}

async function createResetEmail(recipient, firstName, accessToken) {
	const data = {
		NAME: capitalize(firstName),
		URL: getResetUrl(accessToken, false)
	};

	const config = {
		recipient,
		subject: 'Iterpro - Password reset requested',
		template_id: 'd-c286a56c30494e3b90cfcaf17cb54bba'
	};

	const emails = renderEmailFromSendGridTemplate(data, config);

	await sendEmail(emails);
}

async function createSuccessPasswordChangeEmail(recipient, firstName, club) {
	const data = {
		HOST: getClientHost(club),
		NAME: capitalize(firstName)
	};

	const config = {
		recipient,
		subject: `Iterpro - Password changed successfully!`,
		template_id: 'd-749d04230dfb408bbd544d56da8367d8'
	};

	const emails = renderEmailFromSendGridTemplate(data, config);

	await sendEmail(emails);
}
