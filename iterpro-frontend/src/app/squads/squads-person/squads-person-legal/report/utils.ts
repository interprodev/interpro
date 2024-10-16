import { TransferContract } from '@iterpro/shared/data-access/sdk';
import { toShortNumber } from '@iterpro/shared/ui/pipes';
import { getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment';
import { SquadsPersonLegalComponent } from '../squads-person-legal.component';
import { competitions } from '../utils/contract-options';

export const getLabel = (values: { label: string; value: string }[], value: string, firstWithNull = false) => {
	if (!values || !values.length || (!value && !firstWithNull)) return '';
	const found = values.find(v => v.value === value);
	if (found) return found.label;
	if (firstWithNull && values[0].label) return values[0].label;
	return '';
};

export const getLabels = (values, value) => {
	if (!value || !value.length) return '';
	if (typeof value === 'string') return getLabel(values, value);
	return value
		.map(v => getLabel(values, v))
		.filter(v => v && v !== '')
		.join(', ');
};

export const getTranslatedLabel = (values, value, t, firstWithNull = false) => {
	const label = getLabel(values, value, firstWithNull);
	if (label && label !== '') return t(label);
	return '';
};

export const getTranslatedLabels = (values, value, t) => {
	if (!value || !value.length) return '';
	if (typeof value === 'string') return getTranslatedLabel(values, value, t);
	return value
		.map(v => getTranslatedLabel(values, v, t))
		.filter(v => v && v !== '')
		.join(', ');
};
export const toDateString = date => {
	if (!date) return '';
	let momentDate = moment(date, getMomentFormatFromStorage());
	if (!momentDate.isValid()) momentDate = moment(date);
	return momentDate.isValid() ? momentDate.format(getMomentFormatFromStorage()) : '';
};

export const currency = (curr, value) => {
	try {
		if (!value && value !== 0) return '';
		if (typeof value === 'string') return '';
		const c = curr || '';
		const v = value === 0 ? 0 : toShortNumber(value, true);
		return c + v;
	} catch {
		return '';
	}
};

export const thousand = x => {
	if (x === 0) return '0';
	if (!x || !x.toString) return '';
	return x.toLocaleString();
};

const toInstallment = (i, t, curr) => {
	try {
		let str = `${curr}${thousand(i.value)} ${t('contracts.at')} ${toDateString(i.date)}`;
		if (i.season) str += ` ${t('admin.dashboard.season').toLowerCase()} ${i.season}`;
		return str;
	} catch (e) {
		return '';
	}
};
export const toInstallments = (installments, t, component) => {
	try {
		if (!installments || installments.length === 0) return t('admin.contracts.options.withinOneInstallments');
		const text = t('admin.contracts.options.withinInstallments', {
			value: installments.length
		});
		const desc = installments.map(i => toInstallment(i, t, component.currentTeamService.getCurrency())).join(', ');
		return `${text} (${desc})`;
	} catch (e) {
		return '';
	}
};

const getSeasonsOptions = (component, t) => [
	{ label: t('allContract').toLowerCase(), value: 'allContract' },
	...component.seasons.map(x => ({ label: x.name, value: x.name }))
];

export const season = (item, t, component) => {
	try {
		const options = getSeasonsOptions(component, t);
		const label = t('admin.contracts.teamBonus.inSeason');
		return `${label} ${getTranslatedLabels(options, item.season, t)}`;
	} catch (e) {
		return '';
	}
};

export const within = (item, t, component) => {
	try {
		const { label, value } = withinValue(item, t, component);
		return `${label} ${value}`;
	} catch (e) {
		return '';
	}
};

export const withinValue = (item, t, component) => {
	try {
		let text = '';
		if (item) {
			const isDate = !item.withinMode || item.withinMode === 'date';
			text = isDate ? toDateString(item.within) : `${item.withinDays} ${t('daysFromBonus')}`;
		}
		return {
			label: t('admin.contracts.options.within'),
			value: text
		};
	} catch (e) {
		return { label: '', value: '' };
	}
};

export const getClub = (
	component: SquadsPersonLegalComponent,
	contract: TransferContract,
	isOutward: boolean
): string | number => {
	return isOutward ? component.club && component.club.name : contract.club;
};

export const toFromClub = (
	component: SquadsPersonLegalComponent,
	contract: TransferContract,
	t,
	isOutward: boolean
): string => {
	try {
		const club: string | number = getClub(component, contract, isOutward);
		if (!club || club === '') return '';
		const clubName = component.clubNameService.getCachedClub(Number(club));
		return t('toFromClub', { value: clubName ? clubName.label : club });
	} catch (e) {
		return '';
	}
};

export const getBonusCap = (component, contract, t) =>
	`${t('admin.contracts.bonusCap')} ${component.currency}${thousand(contract.bonusCap)}`;

export const bonusCapped = (item, t, component) => (item.cap ? `(${t('admin.contracts.bonusCap.subjected')})` : '');

export const getConditioned = (item, t, component) => {
	try {
		if (!item.conditioned) return '';
		const conditions = [];
		const signed = item && item.condition && item.condition.date;
		const signedCompetition = item && item.condition && item.condition.competition && item.condition.competition.length;
		if (signed) conditions.push(`${t('admin.contracts.signed.label.dialog')} ${toDateString(item.condition.date)}`);
		if (signedCompetition) {
			const competitionsStr = getTranslatedLabels(competitions, item.condition.competition, t);
			conditions.push(`${t('admin.contracts.competitions.label.dialog')} ${competitionsStr}`);
		}
		return conditions.length ? `(${conditions.join(', ')})` : '';
	} catch (e) {
		return '';
	}
};

export const solidarity = (item, t, component) =>
	item.mechanismSolidarity
		? `${t('profile.archive.mechanismSolidarity')} ${component.currency}${item.mechanismSolidarity}`
		: '';

export const startingFrom = (item, t, component) => `${t('admin.contracts.startFrom')} ${toDateString(item.startDate)}`;
