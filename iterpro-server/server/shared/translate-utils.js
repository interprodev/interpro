const arTranslations = require('../../config/i18n/ar-SA');
const deTranslations = require('../../config/i18n/de-DE');
const enGbTranslations = require('../../config/i18n/en-GB');
const esTranslations = require('../../config/i18n/es-ES');
const frTranslations = require('../../config/i18n/fr-FR');
const itTranslations = require('../../config/i18n/it-IT');
const jpTranslations = require('../../config/i18n/ja-JP');
const ptTranslations = require('../../config/i18n/pt-PT');
const ruTranslations = require('../../config/i18n/ru-RU');
const trTranslations = require('../../config/i18n/tr-TR');
const nlTranslations = require('../../config/i18n/nl-NL');

const translateUtils = (module.exports = {
	getLanguage: language => {
		switch (language) {
			case 'ar':
				return 'ar';
			case 'it':
				return 'it';
			case 'de':
				return 'de';
			case 'es':
				return 'es';
			case 'fr':
				return 'fr';
			case 'ja':
				return 'ja';
			case 'pt':
				return 'pt';
			case 'tr':
				return 'tr';
			case 'ru':
				return 'ru';
			case 'nl':
				return 'nl';
			case 'en':
			default:
				return 'en';
		}
	},

	getTranslations: language => {
		switch (language) {
			case 'ar':
				return arTranslations;
			case 'it':
				return itTranslations;
			case 'de':
				return deTranslations;
			case 'es':
				return esTranslations;
			case 'fr':
				return frTranslations;
			case 'ja':
				return jpTranslations;
			case 'pt':
				return ptTranslations;
			case 'tr':
				return trTranslations;
			case 'ru':
				return ruTranslations;
			case 'nl':
				return nlTranslations;
			case 'en':
			default:
				return enGbTranslations;
		}
	},

	translate: (key, language, parameter) => {
		const selectedTranslations = translateUtils.getTranslations(language);
		let transl = key in selectedTranslations ? selectedTranslations[key] : key;
		if (parameter && parameter.value) {
			transl = transl.replace('{{value}}', parameter.value);
		}
		return transl;
	},

	translateNotification: (message, lang) => {
		let translated = message;
		const params = message.split('|').filter(x => x[0] === '$');
		const translationKey = message.split('|').filter(x => x[0] !== '$')[0];
		let parameters = [];
		params.forEach(p => {
			parameters = [
				...parameters,
				p.match(
					new RegExp(
						/(?!\$)([A-Za-z0-9_\u00C0-\u024F\u1E00-\u1EFF]*.*[A-Za-z0-9_\u00C0-\u024F\u1E00-\u1EFF]+)(?=\$)/,
						'gi'
					)
				)
			];
		});
		let parObj = {};
		if (parameters) {
			parameters.forEach((x, index) => {
				const i = 'value' + (index + 1);
				parObj[i] = x && x.length > 0 ? translateUtils.translate(x[0], lang) : '';
			});
		} else {
			parObj = null;
		}

		translated = translateUtils.translate(translationKey, lang);
		if (parameters) {
			parameters.forEach((x, index) => {
				const iValue = 'value' + (index + 1);
				translated = translated.replace(iValue, parObj[iValue]);
			});
		}

		translated = translated.replace(/[{$|}]/g, '');
		return translated;
	}
});
