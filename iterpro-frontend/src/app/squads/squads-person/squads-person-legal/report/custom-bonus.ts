import {
	bonusCapped,
	getConditioned,
	getTranslatedLabel,
	season,
	solidarity,
	startingFrom,
	thousand,
	toInstallments,
	within
} from './utils';
import { signingOptions } from '../utils/contract-options';

const amount = (item, t, component) => `<b>${component.currency}${thousand(item.amount) || ''}</b>`;
const label = (item, t, component) => t('admin.contracts.signing.label');
const type = (item, t, component) => getTranslatedLabel(signingOptions, item.type, t);
const installments = (item, t, component) => toInstallments(item.installments, t, component);

const toCustomBonus = (item, t, component) => {
	const getters = [
		amount,
		solidarity,
		label,
		type,
		season,
		startingFrom,
		within,
		installments,
		getConditioned,
		bonusCapped
	];
	return getters.map(f => f(item, t, component)).join(' ');
};

export default toCustomBonus;
