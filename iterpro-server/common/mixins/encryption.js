/**
 * Created by Mekuanent Getachew on 5/25/18.
 */

const crypto = require('crypto');
const { get, set } = require('lodash');
const moment = require('moment');

const dateFieldsList = ['birthDate'];

module.exports = (Model, options) => {
	Model.observe('persist', function event(ctx, next) {
		crypto.pbkdf2(
			process.env.PASSWORD,
			process.env.SALT,
			Number(process.env.ITERATION),
			Number(process.env.HASHBYTES),
			process.env.ALGORITHM,
			(err, derivedKey) => encrypt(err, derivedKey, options, ctx, next)
		);
	});

	Model.observe('loaded', function event(ctx, next) {
		crypto.pbkdf2(
			process.env.PASSWORD,
			process.env.SALT,
			Number(process.env.ITERATION),
			Number(process.env.HASHBYTES),
			process.env.ALGORITHM,
			(err, derivedKey) => decrypt(err, derivedKey, options, ctx, next)
		);
	});
};

function encrypt(err, derivedKey, options, ctx, next) {
	if (err) {
		console.error(err);
		next(err);
	} else {
		const fields = options.fields || [];
		for (const i in fields) {
			try {
				const iv = Buffer.from(process.env.IV, 'hex');
				const cipher = crypto.createCipheriv(process.env.ENCALGORITHM, derivedKey, iv);
				let fieldData = get(ctx.data, fields[i]);
				if (fieldData) {
					// check if the field is a date
					if (dateFieldsList.includes(fields[i])) {
						fieldData = moment(fieldData).toISOString();
					}
					let crypted = cipher.update(fieldData, 'utf8', 'hex');
					crypted += cipher.final('hex');
					set(ctx.data, fields[i], crypted);
				}
			} catch (ex) {
				ex.message +=
					'\nThis usually happens when the field contains a plain text! please make sure to remove/re-save that';
			}
		}
		next();
	}
}

function decrypt(err, derivedKey, options, ctx, next) {
	if (err) {
		console.log(err);
		next(err);
	} else {
		const fields = options.fields || [];
		for (const i in fields) {
			try {
				const iv = Buffer.from(process.env.IV, 'hex');
				const cipher = crypto.createDecipheriv(process.env.ENCALGORITHM, derivedKey, iv);
				const fieldData = get(ctx.data, fields[i]);
				if (fieldData) {
					let decrypted = cipher.update(fieldData, 'hex', 'utf8');
					decrypted += cipher.final('utf8');
					// check if the field is a date
					if (dateFieldsList.includes(fields[i])) {
						decrypted = moment(decrypted).toDate();
					}
					set(ctx.data, fields[i], decrypted);
				}
			} catch (ex) {
				ex.message +=
					'\nThis usually happens when the field contains a plain text! please make sure to remove/re-save that';
			}
		}
		next();
	}
}
