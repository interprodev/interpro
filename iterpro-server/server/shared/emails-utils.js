const sendGrid = require('@sendgrid/mail');
const loopback = require('loopback');
const path = require('path');
const { SendEmailError } = require('../../common/modules/error');

module.exports = {
	renderEmail: function (data, config, template) {
		const renderer = loopback.template(path.resolve(__dirname, `../../common/templates/emails/${template}.ejs`));
		const html = renderer(data);

		const emails = [
			{
				...config,
				from: process.env.EMAIL,
				html: html
			}
		];

		return emails;
	},

	renderEmailFromSendGridTemplate: function (data, { recipient, subject, template_id, cc }) {
		return [
			{
				from: {
					email: process.env.EMAIL
				},
				personalizations: [
					{
						to: [{ email: recipient }],
						cc: cc ? [{ email: cc }] : [],
						subject,
						dynamic_template_data: data
					}
				],
				template_id
			}
		];
	},

	sendEmail: async function (emails) {
		sendGrid.setApiKey(process.env.SENDGRID_KEY);
		try {
			await sendGrid.send(emails);
			return true;
		} catch (error) {
			console.error(error);
			throw SendEmailError(error, emails);
		}
	}
};
