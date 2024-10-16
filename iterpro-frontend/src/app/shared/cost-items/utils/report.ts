import { MixedType, PdfMixedTable, PersonCostItem } from '@iterpro/shared/data-access/sdk';
import {
	getAllSelectItemGroupValues,
	getMomentFormatFromStorage,
	parseHtmlStringToText
} from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment/moment';
import { CostItemSummary, DataToReportInput } from '../interfaces/cost-item.interface';
import { calcTotalAmount, getPaymentStatusIcon } from './data';

const playerViewHeaders: string[] = [
	'profile.season',
	'costItem.occurrenceDate',
	'costItem.type',
	'costItem.description',
	'costItem.cost',
	'costItem.paymentDate',
	'costItem.paid',
	'costItem.expiryDate',
	'costItem.notes'
];

function globalViewHeaders(singlePersonLabel: string): string[] {
	return [
		'profile.season',
		singlePersonLabel,
		'costItem.occurrenceDate',
		'costItem.type',
		'costItem.description',
		'costItem.cost',
		'costItem.paymentDate',
		'costItem.paid',
		'costItem.expiryDate',
		'costItem.notes'
	];
}

export function getCostItemMixedTable(input: DataToReportInput): PdfMixedTable {
	const headers: string[] = getHeaders(input.singlePersonLabel, input?.personId);
	return {
		headers: headers.map((col: string, index) => ({
			label: input.t(col),
			alignment: index == 0 ? 'left' : 'center',
			mode: 'text'
		})),
		rows: input.items.map(item => getRows(item, input))
	};
}

export function getCostItemSummary(input: DataToReportInput): CostItemSummary {
	const translate = input.t;
	return {
		costsLabel: translate('costItem.costs'),
		subscriptionsLabel: translate('costItem.subscriptions'),
		costNotePending: {
			label: translate('costItem.pending'),
			value: `${input.currency}${calcTotalAmount(input.items, 'pending', 'costNote')}`
		},
		costNotePaid: {
			label: translate('costItem.paid'),
			value: `${input.currency}${calcTotalAmount(input.items, 'paid', 'costNote')}`
		},
		costNoteOutstanding: {
			label: translate('costItem.outstanding'),
			value: `${input.currency}${calcTotalAmount(input.items, 'outstanding', 'costNote')}`
		},
		subscriptionPending: {
			label: translate('costItem.pending'),
			value: `${input.currency}${calcTotalAmount(input.items, 'pending', 'subscription')}`
		},
		subscriptionPaid: {
			label: translate('costItem.paid'),
			value: `${input.currency}${calcTotalAmount(input.items, 'paid', 'subscription')}`
		},
		subscriptionOutstanding: {
			label: translate('costItem.outstanding'),
			value: `${input.currency}${calcTotalAmount(input.items, 'outstanding', 'subscription')}`
		}
	};
}
function getRows(item: PersonCostItem, input: DataToReportInput): MixedType[] {
	return getHeaders(input.singlePersonLabel, input.personId).map(header => {
		return getValueFromHeader(header, item, input);
	});
}
function getValueFromHeader(header: string, item: PersonCostItem, input: DataToReportInput): MixedType {
	switch (header) {
		case 'profile.season':
			return {
				mode: 'text',
				label: input.clubSeasonOptions.find(({ value }) => value === item.clubSeasonId)?.label,
				alignment: 'left'
			};
		case input.singlePersonLabel:
			return {
				mode: 'text',
				label: getAllSelectItemGroupValues(input.personOptions).find(({ value }) => value === item.personId).label,
				alignment: 'center'
			};
		case 'costItem.occurrenceDate':
			return {
				mode: 'text',
				label: moment(item.occurrenceDate).format(getMomentFormatFromStorage()),
				alignment: 'center'
			};
		case 'costItem.type':
			return {
				mode: 'text',
				label: input.t(input.typeOptions.find(({ value }) => value === item.type).label),
				alignment: 'center'
			};
		case 'costItem.description':
			return {
				mode: 'text',
				label: item.description,
				alignment: 'center'
			};
		case 'costItem.cost':
			return {
				mode: 'text',
				label: `${input.currency}${item.value}`,
				alignment: 'center'
			};
		case 'costItem.paymentDate':
			return {
				mode: 'text',
				label: moment(item.paymentDate).format(getMomentFormatFromStorage()),
				alignment: 'center'
			};
		case 'costItem.paid': {
			const status = getPaymentStatusIcon(item, true);
			return {
				mode: 'fa-icon',
				label: item.paid ? input.t('costItem.paid') : input.t('admin.forecast.toPay'),
				value: status.icon,
				cssStyle: 'color: ' + status.color + ';',
				alignment: 'center'
			};
		}
		case 'costItem.expiryDate':
			return {
				mode: 'text',
				label: item.expiryDate ? moment(item.expiryDate).format(getMomentFormatFromStorage()) : null,
				alignment: 'center'
			};
		case 'costItem.notes':
			return {
				mode: 'text',
				label: parseHtmlStringToText(item?.notes),
				alignment: 'center'
			};
		default:
			console.warn('header not found');
	}
}

export function getHeaders(singlePersonLabel: string, personId: string): string[] {
	return personId ? playerViewHeaders : globalViewHeaders(singlePersonLabel);
}

function getValueFromHeaderSummary(header: string, input: DataToReportInput): MixedType {
	switch (header) {
		case input.t('costItem.pending') + ': ' + input.t('costItem.costs'):
			return {
				mode: 'text',
				label: `${input.currency}${calcTotalAmount(input.items, 'pending', 'costNote')}`
			};
		case input.t('costItem.paid') + ': ' + input.t('costItem.costs'):
			return {
				mode: 'text',
				label: `${input.currency}${calcTotalAmount(input.items, 'paid', 'costNote')}`
			};
		case input.t('costItem.outstanding') + ': ' + input.t('costItem.costs'):
			return {
				mode: 'text',
				label: `${input.currency}${calcTotalAmount(input.items, 'outstanding', 'costNote')}`
			};
		case input.t('costItem.pending') + ': ' + input.t('costItem.subscriptions'):
			return {
				mode: 'text',
				label: `${input.currency}${calcTotalAmount(input.items, 'pending', 'subscription')}`
			};
		case input.t('costItem.paid') + ': ' + input.t('costItem.subscriptions'):
			return {
				mode: 'text',
				label: `${input.currency}${calcTotalAmount(input.items, 'paid', 'subscription')}`
			};
		case input.t('costItem.outstanding') + ': ' + input.t('costItem.subscriptions'):
			return {
				mode: 'text',
				label: `${input.currency}${calcTotalAmount(input.items, 'outstanding', 'subscription')}`
			};
		default:
			console.warn('summary header not found');
	}
}

export function getCostItemCSV(input: DataToReportInput) {
	const summaryRows = [];
	const summaryHeaders: string[] = [
		input.t('costItem.pending') + ': ' + input.t('costItem.costs'),
		input.t('costItem.paid') + ': ' + input.t('costItem.costs'),
		input.t('costItem.outstanding') + ': ' + input.t('costItem.costs'),
		input.t('costItem.pending') + ': ' + input.t('costItem.subscriptions'),
		input.t('costItem.paid') + ': ' + input.t('costItem.subscriptions'),
		input.t('costItem.outstanding') + ': ' + input.t('costItem.subscriptions')
	];
	summaryHeaders.forEach((key: string, index) => {
		summaryRows[index] = [];
		summaryRows[index].push(key);
		summaryRows[index].push(getValueFromHeaderSummary(key, input).label);
	});
	const tableRows = [];
	tableRows[0] = getHeaders(input.singlePersonLabel, input.personId).map(header => input.t(header));
	(input.items || []).forEach((item, index) => {
		getHeaders(input.singlePersonLabel, input.personId).forEach(header => {
			const data = getValueFromHeader(header, item, input).label;
			!tableRows[index + 1] ? (tableRows[index + 1] = [data]) : tableRows[index + 1].push(data);
		});
	});
	return [...summaryRows, ...tableRows];
}


export function getValueFromHeaderCsv(header: string, cellValue: string, input: DataToReportInput): string | number | Date | boolean {
	if (!cellValue || cellValue === '') return null;
	switch (header) {
		case 'profile.season':
			return input.clubSeasonOptions.find(({ label }) => label === cellValue)?.value;
		case input.singlePersonLabel:
			return getAllSelectItemGroupValues(input.personOptions).find(({ label }) => label.toLowerCase() === cellValue.toLowerCase())?.value;
		case 'costItem.occurrenceDate':
			return moment(cellValue, 'DD/MM/YYYY').toDate()
		case 'costItem.type':
			return input.typeOptions.find(({ label }) => label.toLowerCase() === cellValue.toLowerCase())?.value;
		case 'costItem.description':
			return String(cellValue);
		case 'costItem.cost':
			return Number(cellValue);
		case 'costItem.paymentDate':
			return moment(cellValue, 'DD/MM/YYYY').toDate()
		case 'costItem.paid': {
			return cellValue.toLowerCase() === 'true' || cellValue === '1' || cellValue.toLowerCase() === 'paid';
		}
		case 'costItem.expiryDate':
			return moment(cellValue, 'DD/MM/YYYY').toDate()
		case 'costItem.notes':
			return String(cellValue);
		default:
			console.warn('header not found');
	}
}
