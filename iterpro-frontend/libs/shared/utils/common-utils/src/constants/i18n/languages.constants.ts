import locale_AR from '@angular/common/locales/ar-SA';
import locale_DE from '@angular/common/locales/de';
import locale_GB from '@angular/common/locales/en-GB';
import locale_ES from '@angular/common/locales/es';
import locale_FR from '@angular/common/locales/fr';
import locale_IT from '@angular/common/locales/it';
import locale_JP from '@angular/common/locales/ja';
import locale_PT from '@angular/common/locales/pt';
import locale_RU from '@angular/common/locales/ru';
import locale_TR from '@angular/common/locales/tr';
import locale_NL from '@angular/common/locales/nl';
import { SelectItem } from 'primeng/api';

export const LANGUAGES: string[] = [
	'en-US',
	'en-GB',
	'de-DE',
	'es-ES',
	'fr-FR',
	'it-IT',
	'ja-JP',
	'pt-PT',
	'ru-RU',
	'tr-TR',
	'ar-SA',
	'nl-NL'
];

export const languagesList: SelectItem<string>[] = [
	{ label: 'language.german', value: 'de-DE' },
	{ label: 'language.english', value: 'en-US' },
	{ label: 'language.spanish', value: 'es-ES' },
	{ label: 'language.french', value: 'fr-FR' },
	{ label: 'language.italian', value: 'it-IT' },
	{ label: 'language.japanese', value: 'ja-JP' },
	{ label: 'language.portuguese', value: 'pt-PT' },
	{ label: 'language.russian', value: 'ru-RU' },
	{ label: 'language.turkish', value: 'tr-TR' },
	{ label: 'language.arabic', value: 'ar-SA' },
	{ label: 'language.dutch', value: 'nl-NL' }
];

export const dateFormatList: SelectItem[] = [
	{ label: 'dateFormat.european', value: 1 },
	{ label: 'dateFormat.american', value: 2 },
	{ label: 'dateFormat.german', value: 3 },
	{ label: 'dateFormat.iso8601', value: 4 }
];

export const getAngularLocale = (language: string): unknown => {
	switch (language) {
		case 'de-DE':
			return locale_DE;
		case 'en-US':
			return locale_GB;
		case 'it-IT':
			return locale_IT;
		case 'fr-FR':
			return locale_FR;
		case 'es-ES':
			return locale_ES;
		case 'ja-JP':
			return locale_JP;
		case 'pt-PT':
			return locale_PT;
		case 'ru-RU':
			return locale_RU;
		case 'tr-TR':
			return locale_TR;
		case 'ar-SA':
			return locale_AR;
		case 'nl-NL':
			return locale_NL;
		case 'en-GB':
		default:
			return locale_GB;
	}
};
