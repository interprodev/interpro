import { NumeralJSLocale } from 'numeral';

export const CURRENCIES_MAP: Map<string, NumeralJSLocale> = new Map([
	[
		'eur',
		{
			delimiters: {
				thousands: '.',
				decimal: ','
			},
			abbreviations: {
				thousand: 'K',
				million: 'M',
				billion: 'B',
				trillion: 'T'
			},
			ordinal: num => String(num),
			currency: {
				symbol: '€'
			}
		}
	]
]);
