import {
	bonusCapped,
	getConditioned,
	getTranslatedLabel,
	season,
	startingFrom,
	thousand,
	toInstallments,
	within
} from './utils';
import { appearances } from '../utils/contract-options';

const amount = (item, t, component) => `<b>${component.currency}${thousand(item.amount) || ''}</b>`;
const per = (item, t, component) => `${t('per')} ${getTranslatedLabel(appearances, item.type, t)}`;
const installments = (item, t, component) => toInstallments(item.installments, t, component);

const toPerfFee = (item, t, component) => {
	const getters = [amount, per, season, startingFrom, within, installments, getConditioned, bonusCapped];
	return getters.map(f => f(item, t, component)).join(' ');
};

export default toPerfFee;
