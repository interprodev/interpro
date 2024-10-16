import * as moment from 'moment';
import getAgent, { AgentContractPDF } from './agent';
import { getBonusCap, getTranslatedLabel, toDateString, toFromClub } from './utils';
import { optionActions, optionItems, originItems, outwardItems } from '../utils/contract-options';
import { ContractReportDeps, TransferContract } from '@iterpro/shared/data-access/sdk';
import { SquadsPersonLegalComponent } from '../squads-person-legal.component';

const isPurchase = contract =>
	contract.personStatus === 'purchased' || contract.personStatus === 'purchase' || contract.personStatus === 'sell';
const isLoan = contract => contract.personStatus === 'inTeamOnLoan' || contract.personStatus === 'onLoan';

const getCompany = (component, inward) => {
	const agent = component.agents.find(x => x.id === inward.agent);
	return agent ? agent.company : '';
};

const getTypeLabel = (contract: TransferContract, t) => {
	try {
		let label = '';
		if (isPurchase(contract)) {
			const hasBb = contract.options.buyBack && contract.options.buyBack.amount;
			const hasSoF = contract.options.sellOnFee && contract.options.sellOnFee.amount;
			if (hasBb) label += t('transferContract.options.buyBack');
			if (hasBb && hasSoF) label += ' ' + t('and') + ' ';
			if (hasSoF) label += t('transferContract.options.sellOnFee');
		} else if (isLoan(contract) && contract.options.loan.option && contract.options.loan.option !== 'none') {
			const option = getTranslatedLabel(optionItems, contract.options.loan.option, t);
			const action = getTranslatedLabel(optionActions, contract.options.loan.action, t);
			label = t('transferContract.options.loan', { option, action });
		}
		return label === '' ? label : ` (${label})`.toLowerCase();
	} catch (e) {
		return '';
	}
};

const getOrigin = (component: SquadsPersonLegalComponent, contract: TransferContract, t, isOutward: boolean) => {
	const hasDetails = contract.personStatus !== 'freeTransfer' && contract.personStatus !== 'homegrown';
	const items = isOutward ? outwardItems : originItems;
	const value = getTranslatedLabel(items, contract.personStatus, t) + getTypeLabel(contract, t);
	const details = [];
	if (hasDetails) {
		const currentClubName: string = component.club ? component.club.name : '';
		const contractClubName = contract.club
			? component.clubNameService.getCachedClub(Number(contract.club))?.label
			: null;
		details.push({
			label: t('admin.contracts.fromClub'),
			value: isOutward ? currentClubName : contractClubName
		});
		details.push({
			label: t('admin.contracts.toClub'),
			value: isOutward ? contractClubName : currentClubName
		});
	}
	return {
		values: [{ value, vSpan: 2 }, ...details],
		values2: !component.isTransferSection && [
			{
				label: t('admin.contracts.stipulationDate'),
				value: toDateString(contract.stipulationDate)
			},
			{
				label: t('admin.contracts.on'),
				value: toDateString(contract.on)
			},
			{
				label: t('admin.contracts.itcDate'),
				value: toDateString(contract.itcDate)
			}
		]
	};
};

const getOptions = (component: SquadsPersonLegalComponent, deps: ContractReportDeps, contract: TransferContract, t) => {
	if (isPurchase(contract)) return getPurchaseOptions(component, deps, contract, t);
	else if (isLoan(contract)) return getLoanOptions(component, deps, contract, t);
	return [];
};

const getPurchaseOptions = (
	component: SquadsPersonLegalComponent,
	deps: ContractReportDeps,
	contract: TransferContract,
	t
) => {
	const competitions = deps.currentTeamService.extractSeason(component.seasons, moment().toDate()).competitionInfo;
	return [
		{
			values: [
				{
					label: t('admin.contracts.options.sellOnFee'),
					value: (contract.sellOnFee || []).map((option, index) =>
						component.bonusStringBuilder.getTransferOptionText(
							option,
							option.percentage,
							contract.club,
							true,
							false,
							null,
							null,
							true,
							index + 1
						)
					)
				}
			],
			values2: [
				{
					label: t('admin.contracts.options.buyBack'),
					value: (contract.buyBack || []).map((option, index) =>
						component.bonusStringBuilder.getTransferOptionText(
							option,
							option.percentage,
							contract.club,
							true,
							false,
							null,
							null,
							true,
							index + 1
						)
					)
				}
			]
		}
	];
};

const getLoanOptions = (
	component: SquadsPersonLegalComponent,
	deps: ContractReportDeps,
	contract: TransferContract,
	t
) => [
	{
		values: [
			{
				label: t('admin.contracts.options.sellOnFee'),
				value: (contract.loanOption || []).map((option, index) =>
					component.bonusStringBuilder.getLoanOptionText(
						option,
						contract.club,
						true,
						true,
						null,
						null,
						false,
						index + 1
					)
				)
			}
		]
	}
];

const getFixed = (component: SquadsPersonLegalComponent, deps: ContractReportDeps, contract: TransferContract, t) => {
	return component.bonusStringBuilder.getTransferFeeText(
		contract,
		contract.club,
		true,
		deps.postTaxes,
		deps.club,
		null,
		null
	);
};

const getVariable = (
	component: SquadsPersonLegalComponent,
	deps: ContractReportDeps,
	contract: TransferContract,
	t,
	fromClub
): VariableContractPDF => {
	return {
		title: t('admin.contracts.variableWagePart'),
		info: getBonusCap(component, contract, t),
		// hidden: !hasApp && !hasPerf && !hasStd,
		sections: [
			{
				// hidden: !hasApp,
				title: t('admin.contracts.appearance'),
				items: (contract.bonuses || [])
					.filter(bonus => bonus.type === 'appearance')
					.map((bonus, index) =>
						component.bonusStringBuilder.getBonusText(bonus, false, deps.team?.name, true, true, deps.club, null, index)
					)
			},
			{
				// hidden: !hasPerf,
				title: t('admin.contracts.performance'),
				items: (contract.bonuses || [])
					.filter(bonus => bonus.type === 'appearance')
					.map((bonus, index) =>
						component.bonusStringBuilder.getBonusText(bonus, false, deps.team?.name, true, true, deps.club, null, index)
					)
			},
			{
				// hidden: !hasStd,
				title: t('admin.contracts.standardTeam'),
				items: (contract.bonuses || [])
					.filter(bonus => bonus.type === 'standardTeam')
					.map((bonus, index) =>
						component.bonusStringBuilder.getBonusText(bonus, false, deps.team?.name, true, true, deps.club, null, index)
					)
			},
			{
				// hidden: !hasStd,
				title: t('admin.contracts.signing'),
				items: (contract.bonuses || [])
					.filter(bonus => bonus.type === 'signing')
					.map((bonus, index) =>
						component.bonusStringBuilder.getBonusText(bonus, false, deps.team?.name, true, true, deps.club, null, index)
					)
			},
			{
				// hidden: !hasStd,
				title: t('admin.contracts.custom'),
				items: (contract.bonuses || [])
					.filter(bonus => bonus.type === 'custom')
					.map((bonus, index) =>
						component.bonusStringBuilder.getBonusText(bonus, false, deps.team?.name, true, true, deps.club, null, index)
					)
			}
		]
	};
};

export interface VariableContractPDF {
	title: string;
	info: string;
	sections: {
		title: string;
		items: string[];
	}[];
}

const getTransfer = (
	component: SquadsPersonLegalComponent,
	deps: ContractReportDeps,
	contract: TransferContract,
	isOutward: boolean
): TransferContractPDF => {
	const t = deps.translate.instant.bind(deps.translate);
	if (!contract) return null;
	const isPurchaseOrLoan =
		contract.personStatus === 'purchased' || contract.personStatus === 'purchase' || contract.personStatus === 'onLoan';
	const fromClub = toFromClub(component, contract, t, isOutward);
	return {
		title: t(isOutward ? 'admin.contracts.outward' : 'admin.contracts.inward'),
		type: {
			title: t('admin.contracts.origin'),
			sections: [getOrigin(component, contract, t, isOutward)]
		},
		options: {
			title: t('admin.contracts.options'),
			sections: getOptions(component, deps, contract, t)
		},
		fixed: {
			title: t('admin.contracts.fixedTransferPart'),
			sections: [
				{
					title: isPurchaseOrLoan ? t('profile.archive.amount') : null,
					items: [getFixed(component, deps, contract, t)]
				}
			]
		},
		variable: getVariable(component, deps, contract, t, fromClub),
		notes: {
			// hidden: !contract.notes || contract.notes === '',
			title: t('admin.contracts.notes'),
			sections: [
				{
					text: contract.notes
				}
			]
		},
		agents: (contract?.agentContracts || []).map(item => getAgent(component, deps, item, t))
	};
};

export interface TransferContractPDF {
	title: string;
	type: {
		title: string;
		sections: {
			values: { value: string; vSpan?: number }[];
			values2?: { label: string; value: string }[];
		}[];
	};
	options: {
		title: string;
		sections: {
			values: { label: any; value: string[] }[];
			values2?: { label: any; value: string[] }[];
		}[];
	};
	fixed: {
		title: string;
		sections: {
			title: string;
			items: string[];
		}[];
	};
	variable: VariableContractPDF;
	notes: {
		title: string;
		sections: {
			text: string;
		}[];
	};
	agents: AgentContractPDF[];
}

export default getTransfer;
