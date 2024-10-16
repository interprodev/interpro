import * as moment from 'moment';
import getAgent, { AgentContractPDF } from './agent';
import { getBonusCap, getLabel, thousand, toDateString } from './utils';
import { SquadsPersonLegalComponent } from '../squads-person-legal.component';
import { ContractReportDeps, EmploymentContract } from '@iterpro/shared/data-access/sdk';
import { types } from '../utils/contract-options';

const fixed = n => (n && n.toFixed ? n.toFixed(1) : n);

const getContract = (component: SquadsPersonLegalComponent, deps: ContractReportDeps): EmploymentContractPDF => {
	const t = deps.translate.instant.bind(deps.translate);
	const player = component.person;
	const contract: EmploymentContract = component.employments.find(({ status }) => status);
	if (!contract) return null;
	const totalWages = 0; // TODO
	const totalYearlyAvgWage = 0; // TODO
	const competitions = deps.currentTeamService.extractSeason(component.seasons, moment().toDate()).competitionInfo;
	return {
		title: t('admin.contracts'),
		type: {
			title: t('admin.contracts.contractType'),
			sections: [
				{
					values: [
						{
							vSpan: 4,
							value: t(getLabel(types, contract.personStatus))
						},
						{
							label: t('admin.contracts.extension'),
							value: contract.extension ? t('yes') : t('no')
						}
					],
					values2: [
						{
							label: t('admin.contracts.signature'),
							value: toDateString(contract.signatureDate)
						},
						{
							label: t('admin.contracts.from'),
							value: toDateString(contract.dateFrom)
						},
						{
							label: t('admin.contracts.to').toLowerCase(),
							value: toDateString(contract.dateTo)
						}
					]
				}
			]
		},
		fixed: {
			title: t('admin.contracts.fixedWagePart'),
			sections: [
				{
					title: t('admin.contracts.basicWage'),
					values: [
						{
							label: t('admin.contracts.fixedWage'),
							value: totalWages ? component.currency + '' + thousand(totalWages) : ''
						},
						{
							label: t('admin.contracts.averageWage'),
							value: totalYearlyAvgWage ? component.currency + '' + thousand(totalYearlyAvgWage) : ''
						}
					],
					items: contract.basicWages.map((wage, index) =>
						component.bonusStringBuilder.getBasicWageText(
							wage,
							'basicWage',
							false,
							true,
							true,
							null,
							false,
							index + 1,
							null
						)
					)
				}
			]
		},
		variable: {
			title: t('admin.contracts.variableWagePart'),
			info: getBonusCap(component, contract, t),
			sections: [
				{
					title: t('admin.contracts.appearanceFees'),
					items: (contract.bonuses || [])
						.filter(bonus => bonus.type === 'appearanceFee')
						.map((bonus, index) =>
							component.bonusStringBuilder.getBonusText(
								bonus,
								false,
								deps.team?.name,
								true,
								true,
								deps.club,
								null,
								index + 1
							)
						)
				},
				{
					title: t('admin.contracts.appearance'),
					items: (contract.bonuses || [])
						.filter(bonus => bonus.type === 'appearance')
						.map((bonus, index) =>
							component.bonusStringBuilder.getBonusText(
								bonus,
								false,
								deps.team?.name,
								true,
								true,
								deps.club,
								null,
								index + 1
							)
						)
				},
				{
					title: t('admin.contracts.performanceFee'),
					items: (contract.bonuses || [])
						.filter(bonus => bonus.type === 'performanceFee')
						.map((bonus, index) =>
							component.bonusStringBuilder.getBonusText(
								bonus,
								false,
								deps.team?.name,
								true,
								true,
								deps.club,
								null,
								index + 1
							)
						)
				},
				{
					title: t('admin.contracts.performance'),
					items: (contract.bonuses || [])
						.filter(bonus => bonus.type === 'performance')
						.map((bonus, index) =>
							component.bonusStringBuilder.getBonusText(
								bonus,
								false,
								deps.team?.name,
								true,
								true,
								deps.club,
								null,
								index + 1
							)
						)
				},
				{
					title: t('admin.contracts.standardTeam'),
					items: (contract.bonuses || [])
						.filter(bonus => bonus.type === 'standardTeam')
						.map((bonus, index) =>
							component.bonusStringBuilder.getBonusText(
								bonus,
								false,
								deps.team?.name,
								true,
								true,
								deps.club,
								null,
								index + 1
							)
						)
				},
				{
					title: t('admin.contracts.signing'),
					items: (contract.bonuses || [])
						.filter(bonus => bonus.type === 'signing')
						.map((bonus, index) =>
							component.bonusStringBuilder.getBonusText(
								bonus,
								false,
								deps.team?.name,
								true,
								true,
								deps.club,
								null,
								index + 1
							)
						)
				},
				{
					title: t('admin.contracts.custom'),
					items: (contract.bonuses || [])
						.filter(bonus => bonus.type === 'custom')
						.map((bonus, index) =>
							component.bonusStringBuilder.getBonusText(
								bonus,
								false,
								deps.team?.name,
								true,
								true,
								deps.club,
								null,
								index + 1
							)
						)
				},
				{
					title: t('admin.contracts.notes'),
					text: contract.notes
				}
			]
		},
		buyOut: {
			title: t('admin.contracts.buyOut'),
			sections: [
				{
					items: (contract.buyout || []).map(bonus => component.bonusStringBuilder.getBuyoutText(bonus))
				}
			]
		},
		privateWriting: {
			title: t('admin.contracts.privateWriting'),
			sections: contract.personStatus === 'onLoan' && [
				{
					items: contract.privateWriting.map((bonus, index) =>
						component.bonusStringBuilder.getBasicWageText(
							bonus,
							'basicWage',
							false,
							true,
							true,
							null,
							false,
							index + 1,
							null
						)
					)
				}
			]
		},
		agents: contract.agentContracts.map(agentContract => getAgent(component, deps, agentContract, t)),
		extra: {
			title: t('Other'),
			extra: {
				sections: [
					{
						title: t('admin.contracts.insurance'),
						items: contract.insurance ? [component.bonusStringBuilder.getInsuranceText(contract.insurance)] : []
					},
					{
						title: t('admin.contracts.benefits'),
						items: (contract.benefits || [])
							.map((bonus, i) => component.bonusStringBuilder.getBenefitText(bonus, i, true, null, null))
							.filter((_, i) => contract.benefits[i].enabled === true)
					},
					{
						title: t('admin.contracts.additionalClauses'),
						items: (contract.additionalClauses || []).map(item => (item && item.value ? item.value : ''))
					},
					{
						title: t('admin.contracts.options'),
						items: (contract.options || []).map(item => (item && item.value ? item.value : ''))
					},
					{
						title: t('admin.contracts.commercialRights'),
						items: (contract.commercialRights || []).map(item => (item && item.value ? item.value : ''))
					}
				]
			}
		}
	};
};

export interface EmploymentContractPDF {
	title: string;
	type: {
		title: string;
		sections: {
			values?: {
				label?: string;
				value?: string;
				vSpan?: number;
			}[];
			values2?: {
				label?: string;
				value?: string;
				vSpan?: number;
			}[];
		}[];
	};
	fixed: {
		title: string;
		sections: {
			title?: string;
			values?: {
				label?: string;
				value?: string;
			}[];
			items?: string[];
		}[];
	};
	variable: {
		title: string;
		info: string;
		sections: {
			title?: string;
			items?: string[];
			text?: string;
		}[];
	};
	buyOut: {
		title: string;
		sections: {
			items?: string[];
		}[];
	};
	privateWriting: {
		title: string;
		sections: {
			items?: string[];
		}[];
	};
	agents: AgentContractPDF[];
	extra: {
		title: string;
		extra: {
			sections: {
				title?: string;
				items?: string[];
			}[];
		};
	};
}

export default getContract;
