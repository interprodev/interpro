const { ObjectID } = require('mongodb');

const { InternalError, AuthorizationError, BadRequestError, ForbiddenError } = require('../modules/error');
const passwordUtil = require('../modules/lambda-password-utils');
const { sendEmail, renderEmailFromSendGridTemplate } = require('../../server/shared/emails-utils');
const { capitalize, getHost, getMobileHost } = require('../modules/utils');
const { ONE_YEAR_IN_SECONDS } = require('../constants/commonConstants');

require('speakeasy');
require('qrcode');

module.exports = function (CustomerPlayer) {
	CustomerPlayer.observe('after delete', async ctx => {
		try {
			console.error(`[CUSTOMERPLAYER] Deleted CustomerPlayer with id ${ctx.where.id}. Deleting associated entities...`);
			process.nextTick(
				async () => await CustomerPlayer.app.models.PlayerNotification.destroyAll({ customerId: ctx.where.id })
			);
		} catch (e) {
			console.error(e);
			throw e;
		}
	});

	CustomerPlayer.loginWithUsernameOrEmail = async function (usernameOrEmail, password) {
		if (!usernameOrEmail || !password) throw BadRequestError('Missing credentials');

		const user = await CustomerPlayer.findOne({
			where: {
				or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
			}
		});
		if (!user) throw AuthorizationError('Wrong credentials');

		const isMatch = await user.hasPassword(password);
		if (!isMatch) throw AuthorizationError('Wrong credentials');

		return await CustomerPlayer.login({ username: user.username, password, ttl: ONE_YEAR_IN_SECONDS }, [
			'customerPlayer'
		]);
	};

	// NOTE: currently not used
	CustomerPlayer.performLogout = async function (req) {
		try {
			if (req.accessToken) {
				await CustomerPlayer.logout(req.accessToken.id);
				await CustomerPlayer.app.models.AccessToken.destroyById(req.accessToken.id);
			}
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	CustomerPlayer.resetPasswordRequest = async function (usernameOrEmail) {
		try {
			if (!usernameOrEmail) throw BadRequestError('Missing information');
			console.log(`[AUTH] Received password reset request from ${usernameOrEmail}`);
			const customerPlayer = await CustomerPlayer.findOne({
				where: {
					or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
				}
			});
			if (!customerPlayer) {
				console.error('Password reset request error: user not found');
			} else {
				const club = await CustomerPlayer.app.models.Club.findById(customerPlayer.clubId);
				if (!club) {
					throw InternalError('Club not found!');
				}
				if (!club.active) {
					throw ForbiddenError('The associated Club has been deactivated! Please contact support');
				}

				const playerLinked = await CustomerPlayer.app.models.Player.findById(customerPlayer.playerId);
				const playerString = `${playerLinked.name} ${playerLinked.lastName}`;
				if (!customerPlayer.email || !playerString) {
					throw BadRequestError('No email set on player. Reset password cannot be done. Please check with your staff');
				}

				if (customerPlayer?.isTempPassword) {
					console.error('Password reset request error: user did not change temp password yet');
				} else {
					await CustomerPlayer.resetPassword({ email: customerPlayer.email });
				}

				// const { password: strongPassword } = await passwordUtil.generateStrongPassword(); // TODO: standardize like customer
				// if (!strongPassword) {
				// 	throw InternalError('Error while generating temporary password!');
				// }
				// await customerPlayer.updateAttributes({
				// 	password: strongPassword,
				// 	isTempPassword: true
				// });

				// await createResetEmail(customerPlayer.email, playerString, strongPassword);
			}
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	// send password reset link when requested
	CustomerPlayer.on('resetPasswordRequest', async function ({ accessToken, user, email }) {
		try {
			const club = await CustomerPlayer.app.models.Club.findById(user.clubId);
			if (!club.active) {
				throw new ForbiddenError('The associated Club has been deactivated! Please contact support');
			}

			const player = await CustomerPlayer.app.models.Player.findById(user.playerId);

			await createResetEmail(email, `${player?.name} ${player?.lastName}`, accessToken);
		} catch (e) {
			console.error(e);
			throw e;
		}
	});

	// render UI page after password reset (on login page)
	CustomerPlayer.afterRemote('setPassword', async function (context, user, next) {
		const data = {
			TITLE: 'Password reset success',
			CONTENT: 'Your password has been reset successfully',
			HOST: getMobileHost()
		};
		context.res.render('password-reset-success', data);
		const {
			args: { id: userId }
		} = context;

		await CustomerPlayer.postChangePassword(userId);
	});

	CustomerPlayer.checkPasswordSecurity = async function (password) {
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

	CustomerPlayer.postChangePassword = async function (userId) {
		const customer = await CustomerPlayer.findById(userId);
		if (!customer) {
			console.error(`User ${userId} not found!`);
			throw InternalError('Error while resetting password!');
		}

		const accessTokens = await CustomerPlayer.app.models.AccessToken.find({ where: { userId: ObjectID(userId) } });
		await Promise.all(accessTokens.map(token => token.destroy()));

		await customer.updateAttribute('isTempPassword', false);
		await sendPasswordChangeSuccessEmail(customer);
	};

	CustomerPlayer.sendWelcomeEmail = async function (id) {
		console.log(`[CUSTOMERPLAYER] Sending welcome email to customer player ${id}`);
		let customer = null;
		customer = await CustomerPlayer.findById(id);
		if (!customer) {
			console.error(`User ${id} not found!`);
			throw InternalError('Error while sending welcome email!');
		}
		if (!customer.isTempPassword) {
			console.error(`User invitation email already sent!`);
			throw InternalError('User invitation email already sent!!');
		}
		const { password: tempPassword } = await passwordUtil.generateStrongPassword();
		if (!tempPassword) {
			console.error(`Error while generating temporary password!`);
			throw InternalError('Error while generating temporary password!');
		}
		await customer.updateAttribute('password', tempPassword);

		const accessToken = await CustomerPlayer.login({
			email: customer.email,
			password: tempPassword,
			ttl: process.env.AUTH_TOKEN_TTL_TEMP || 172800 // 48 hours
		});

		if (!accessToken) {
			throw AuthorizationError('Invalid Credentials');
		}

		await createWelcomeEmail(customer.email, customer.username, accessToken, customer.clubId);
	};

	// Different than Reset Password.
	// Reset Password is called by the player from the mobile app -> sendResetEmail
	// Reset Credentials is called by a Customer from the Web app -> sendWelcomeEmail
	CustomerPlayer.resetCredentials = async function (playerId) {
		console.log(`Reset credentials for customer player ${playerId}`);
		try {
			const customerPlayer = await CustomerPlayer.findById(playerId);
			const player = await CustomerPlayer.app.models.Player.findById(customerPlayer.playerId);

			if (!customerPlayer.email && !player.email) throw InternalError('Player has no email set!');

			const email = customerPlayer.email || player.email;
			const password = await createPassword();

			const updated = await customerPlayer.updateAttributes({
				email,
				password
			});
			await CustomerPlayer.sendWelcomeEmail(updated.id);
			return updated;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	CustomerPlayer.createNew = async function ({ displayName, id, name, clubId, teamId, email }) {
		const password = await createPassword();
		const username = await CustomerPlayer.createUsername(displayName);
		const newCustomerPlayer = {
			playerId: ObjectID(id),
			clubId: ObjectID(clubId),
			teamId: ObjectID(teamId),
			username,
			email,
			password,
			isTempPassword: true,
			notificationEvents: false,
			notificationSurveys: false,
			notificationVideoShared: false,
			notificationVideoComments: false,
			eventReminders: []
		};
		const created = await CustomerPlayer.create(newCustomerPlayer);
		await CustomerPlayer.sendWelcomeEmail(created.id);
		return created;
	};

	CustomerPlayer.createUsername = async function (displayName) {
		const sanitized = sanitizeDisplayName(displayName);
		const uniqueName = await CustomerPlayer.checkHomonymy(sanitized);
		return uniqueName;
	};

	CustomerPlayer.checkHomonymy = async function (username) {
		let homonymy = await CustomerPlayer.findOne({ where: { username } });
		let i = 0;
		while (homonymy) {
			i += 1;
			username = `${username}_${i}`;
			homonymy = await CustomerPlayer.findOne({ where: { username } });
		}
		return username;
	};
};

// send confirmation email when successfully resetting/changing password
async function sendPasswordChangeSuccessEmail(customer) {
	console.log(`[CUSTOMER] Sending confirmation email for customer ${customer._id}...`);
	if (customer) {
		await createSuccessPasswordChangeEmail(customer.email, customer.username);
	}
}

async function createWelcomeEmail(recipient, username, accessToken, clubId) {
	const data = {
		NAME: capitalize(username),
		URL: getResetUrl(accessToken),
		HOST: getMobileHost()
	};

	const config = {
		recipient,
		subject: 'Iterpro Player: Welcome!',
		template_id:
			String(clubId) === process.env.ALQADSIAH
				? 'd-dd8aab563c8c4910956f2cf0598de087'
				: 'd-0c9d543fbcf9462aaff2b64c5f4b59bc'
	};

	const emails = renderEmailFromSendGridTemplate(data, config);

	await sendEmail(emails);
}

async function createResetEmail(recipient, username, accessToken) {
	const data = {
		NAME: capitalize(username),
		URL: getResetUrl(accessToken)
	};

	const config = {
		recipient,
		subject: 'Iterpro Player - Password reset requested',
		template_id: 'd-c286a56c30494e3b90cfcaf17cb54bba'
	};

	const emails = renderEmailFromSendGridTemplate(data, config);

	await sendEmail(emails);
}

async function createSuccessPasswordChangeEmail(recipient, username) {
	const data = {
		HOST: getMobileHost(),
		NAME: capitalize(username)
	};

	const config = {
		recipient,
		subject: `Iterpro - Password changed successfully!`,
		template_id: 'd-749d04230dfb408bbd544d56da8367d8'
	};

	const emails = renderEmailFromSendGridTemplate(data, config);

	await sendEmail(emails);
}

async function createPassword() {
	const { password: strongPassword } = await passwordUtil.generateStrongPassword();
	if (!strongPassword) {
		console.error(`Error while generating temporary password!`);
		throw InternalError('Error while generating temporary password!');
	}
	return strongPassword;
}

function sanitizeDisplayName(name) {
	return name.toLowerCase().replace(/\s/g, '_');
}

function getResetUrl({ id }) {
	return `${getHost()}/reset-password?access_token=${id}&player=true`;
}
