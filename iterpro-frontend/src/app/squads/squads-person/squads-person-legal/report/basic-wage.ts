import conditional from './conditional';
import { getTranslatedLabel, season, thousand, toInstallments } from './utils';
import { seasonActions } from '../utils/contract-options';

const amount = (item, t, component) => `<b>${component.currency}${thousand(item.amount) || ''}</b>`;
const installments = (item, t, component) => toInstallments(item.installments, t, component);
const toRepeat = (item, t, component) =>
	[
		t('admin.contracts.season.action.prefix'),
		getTranslatedLabel(seasonActions, item.repeat, t, true),
		t(item.repeat ? 'admin.contracts.season.action.repeat' : 'admin.contracts.season.action.divide'),
		t('admin.contracts.season.action.suffix')
	].join(' ');

const toBasicWage = (item, t, component, showInstallments = true) => {
	const getters = [amount, season, toRepeat, conditional];
	if (showInstallments) getters.push(installments);
	return getters.map(f => f(item, t, component)).join(' ');
};

export default toBasicWage;
