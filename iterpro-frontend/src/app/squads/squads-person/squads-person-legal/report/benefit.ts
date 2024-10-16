import { thousand, toInstallments } from './utils';

const labels = [
	'admin.contracts.benefits.house',
	'admin.contracts.benefits.car',
	'admin.contracts.benefits.phone',
	'admin.contracts.benefits.travels',
	'admin.contracts.benefits.school',
	'admin.contracts.benefits.expensesReimbursement'
];

const name = (i, contract, t, component) => `<b>${t(labels[i])}</b> `;
const cost = (i, contract, t, component) => t('admin.contracts.benefits.cost');
const amount = (i, contract, t, component) =>
	`: <b>${component.currency}${thousand(contract.benefits[i].amount) || ''}</b> `;
const installments = (i, contract, t, component) => toInstallments(contract.benefits[i].installments, t, component);
const notes = (i, contract, t, component) => ' ' + t('admin.contracts.notes');
const text = (i, contract, t, component) => `: ${contract.benefits[i].notes || ''}`;

const toBenefit = (i, contract, t, component) => {
	const getters = [name, cost, amount, installments];
	if (contract.benefits[i].notes && contract.benefits[i].notes !== '') {
		getters.push(notes);
		getters.push(text);
	}
	return getters.map(f => f(i, contract, t, component)).join('');
};

export default toBenefit;
