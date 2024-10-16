import { Agent, AgentContract, ContractReportDeps } from '@iterpro/shared/data-access/sdk';
import { getBonusCap } from './utils';
import { SquadsPersonLegalComponent } from '../squads-person-legal.component';

const getAgentValues = (agents: Agent[], agentId: string, t) => {
	const agent = agents.find(x => x.id === agentId);
	return agent
		? [
				{
					value: `${agent.firstName} ${agent.lastName}`
				},
				{
					label: t('admin.contracts.agent.company'),
					value: agent.company
				},
				{
					label: t('admin.contracts.agent.legalRepresentant'),
					value: agent.legalRepresentant
				},
				{
					label: t('admin.contracts.agent.federalId'),
					value: agent.federalId
				}
		  ]
		: [{ value: '' }];
};

const getFee = fee => (fee.amount || fee.amount === 0 ? [fee] : fee);

const getAgent = (
	component: SquadsPersonLegalComponent,
	deps: ContractReportDeps,
	agentContract: AgentContract,
	t
): AgentContractPDF => {
	if (!agentContract) return null;
	const fees = agentContract?.fee ? getFee(agentContract.fee) : [];
	return {
		title: t('admin.contracts.agentOptions'),
		agent: {
			sections: [
				{
					title: t('admin.contracts.agent'),
					values: agentContract && getAgentValues(component.agents, agentContract.agentId, t)
				}
			]
		},
		fixed: {
			title: t('admin.contracts.fixedWagePart'),
			sections: [
				{
					title: t('admin.contracts.basicWage'),
					items: fees.map((fee, index) =>
						component.bonusStringBuilder.getBasicWageText(
							fee,
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
			info: getBonusCap(component, agentContract, t),
			// hidden: !hasApp && !hasPerf && !hasStd && !hasSign,
			sections: [
				{
					// hidden: !hasApp,
					title: t('admin.contracts.appearance'),
					items: (agentContract.bonuses || [])
						.filter(bonus => bonus.type === 'appearance')
						.map((bonus, index) =>
							component.bonusStringBuilder.getBonusText(
								bonus,
								false,
								deps.team?.name,
								true,
								true,
								null,
								null,
								index + 1
							)
						)
				},
				{
					// hidden: !hasPerf,
					title: t('admin.contracts.performance'),
					items: (agentContract.bonuses || [])
						.filter(bonus => bonus.type === 'performance')
						.map((bonus, index) =>
							component.bonusStringBuilder.getBonusText(
								bonus,
								false,
								deps.team?.name,
								true,
								true,
								null,
								null,
								index + 1
							)
						)
				},
				{
					// hidden: !hasStd,
					title: t('admin.contracts.standardTeam'),
					items: (agentContract.bonuses || [])
						.filter(bonus => bonus.type === 'standardTeam')
						.map((bonus, index) =>
							component.bonusStringBuilder.getBonusText(
								bonus,
								false,
								deps.team?.name,
								true,
								true,
								null,
								null,
								index + 1
							)
						)
				},
				{
					// hidden: !hasSign,
					title: t('admin.contracts.signing'),
					items: (agentContract.bonuses || [])
						.filter(bonus => bonus.type === 'signing')
						.map((bonus, index) =>
							component.bonusStringBuilder.getBonusText(
								bonus,
								false,
								deps.team?.name,
								true,
								true,
								null,
								null,
								index + 1
							)
						)
				},
				{
					// hidden: !hasSign,
					title: t('admin.contracts.custom'),
					items: (agentContract.bonuses || [])
						.filter(bonus => bonus.type === 'custom')
						.map((bonus, index) =>
							component.bonusStringBuilder.getBonusText(
								bonus,
								false,
								deps.team?.name,
								true,
								true,
								null,
								null,
								index + 1
							)
						)
				}
			]
		},
		notes: {
			// hidden: !agent.notes || agent.notes === '',
			title: t('admin.contracts.notes'),
			sections: [
				{
					text: agentContract.notes
				}
			]
		}
	};
};

export interface AgentContractPDF {
	title: string;
	agent: {
		sections: {
			title: string;
			values: {
				label?: string;
				value: string;
			}[];
		}[];
	};
	fixed: {
		title: string;
		sections: {
			title: string;
			items: string[];
		}[];
	};
	variable: {
		title: string;
		info: string;
		sections: {
			title: string;
			items: string[];
		}[];
	};
	notes: {
		title: string;
		sections: {
			text: string;
		}[];
	};
}
export default getAgent;
