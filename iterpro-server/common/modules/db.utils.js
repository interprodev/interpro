const crypto = require('crypto');
const moment = require('moment');
const { get, set } = require('lodash');

const dateFieldsList = ['birthDate'];

module.exports = {
	/**
	 * @param {*} document
	 * @returns `String(document._id || document.id)`
	 */
	getId: document => String(document._id || document.id),

	decryptPlayers: async (players, fields) => {
		for (const player of players) {
			const iv = Buffer.from(process.env.IV, 'hex');
			const derivedKey = await crypto.pbkdf2Sync(
				process.env.PASSWORD,
				process.env.SALT,
				Number(process.env.ITERATION),
				Number(process.env.HASHBYTES),
				process.env.ALGORITHM
			);
			if (!derivedKey) {
				console.debug('errore');
			} else {
				for (const field of fields) {
					try {
						const cipher = crypto.createDecipheriv(process.env.ENCALGORITHM, derivedKey, iv);
						const fieldData = get(player, field);
						if (fieldData) {
							let decrypted = cipher.update(fieldData, 'hex', 'utf8');
							decrypted += cipher.final('utf8');
							// check if the field is a date
							if (dateFieldsList.includes(field)) {
								decrypted = moment(decrypted).toDate();
							}
							set(player, field, decrypted);
						}
					} catch (ex) {
						ex.message +=
							'\nThis usually happens when the field contains a plain text! please make sure to remove/re-save that';
					}
				}
			}
		}
		return players;
	}
};
