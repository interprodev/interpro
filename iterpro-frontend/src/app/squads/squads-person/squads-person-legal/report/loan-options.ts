import { optionActions, optionItems } from '../utils/contract-options';
import { getTranslatedLabel, thousand, toDateString, toInstallments } from './utils';

const toLoanOptions = (component, contract, t, fromClub) => {
	const hasOption = contract.options.loan.option && contract.options.loan.option !== 'none';
	/*
	const isConditioned =
		contract.options.loan.option &&
		contract.options.loan.option === 'obligation' &&
    contract.options.loan.conditioned;
    */
	const option = getTranslatedLabel(optionItems, contract.options.loan.option, t);
	const action = hasOption ? getTranslatedLabel(optionActions, contract.options.loan.action, t) : null;
	const values = [
		{
			label: t('profile.archive.option'),
			value: option + (action ? ' - ' + action : '')
		},
		{
			hidden: !hasOption,
			label: t('profile.archive.amount'),
			value: hasOption && component.currency + '' + thousand(contract.options.loan.amount)
		}
	];
	const values2 = hasOption
		? [
				{
					label: t('admin.contracts.payableFrom'),
					value: contract.options.loan.dateFrom ? toDateString(contract.options.loan.dateFrom) : ''
				},
				{
					label: t('admin.contracts.payableTo'),
					value: contract.options.loan.dateTo ? toDateString(contract.options.loan.dateTo) : ''
				}
		  ]
		: [];
	const values3 = hasOption
		? [
				{
					label: ' ',
					value: toInstallments(contract.options.loan.installments, t, component)
				},
				{ label: '', fromClub }
		  ]
		: [];
	return {
		title: t('admin.contracts.options'),
		values,
		values2,
		values3
	};
};

export default toLoanOptions;
