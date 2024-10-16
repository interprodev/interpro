import { frequencyOptions } from '../components/employment-contract/employment-contract.component';
import { getTranslatedLabel, thousand } from './utils';

const amount = (item, t, component) => `<b>${component.currency}${thousand(item.amount) || '    '}</b>`;
const frequency = (item, t, component) =>
	`${t('admin.contracts.frequency')} ${getTranslatedLabel(frequencyOptions, item.frequency, t)}`;
const from = (item, t, component) =>
	`${t('admin.contracts.prize')} <b>${component.currency}${thousand(item.prize)}</b>`;

const toInsurance = (item, t, component) => {
	const getters = [amount, frequency, from];
	return getters.map(f => f(item, t, component)).join(', ');
};

export default toInsurance;
