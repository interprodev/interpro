import {
	ContractOptionCondition,
	ContractType,
	MixedType,
	PdfBase,
	PdfBasicType,
	PdfMixedTable,
	TransferTypeString
} from '@iterpro/shared/data-access/sdk';
import { toShortNumber } from '@iterpro/shared/ui/pipes';
import { getMomentFormatFromStorage, parseHtmlStringToText } from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment/moment';
import { getVirtualGross } from 'src/app/squads/squads-person/squads-person-legal/services/bonus-string-builder.service';
import { BonusItem, TableBonusComponent } from '../table-bonus/table-bonus.component';
import { toDateString } from './team';

const num = n => (n || n === 0 ? n : '');

const getDetails = (component, player, t) => {
	let details = '';
	if (player.bonus !== 'standardTeam') {
		let bonus = '' + player.bonusCount;
		if (player.bonus !== 'appearanceFee' && player.bonus !== 'performanceFee') bonus += '/' + num(player.bonusTotal);
		details += bonus;
	}
	details += ' ' + (player.metric ? t(player.metric, { value: player.count2 }).toLowerCase() : '');
	if (player.bonus !== 'appearanceFee' && player.bonus !== 'performanceFee' && player.competitions) {
		details += ' ';
		if (player.bonus !== 'standardTeam') details += t('in');
		details += ' ';
		details += component.getCompetitionList(player.competitions) || '';
		details += ' ' + (player.season || '');
	}
	return details;
};

const zeroOrShort = val => (val === 0 ? val : toShortNumber(val, true));

export function getPlayersPDFReport(component: TableBonusComponent): AdminFinanceBonusPlayerPDF {
	const t = component.translate.instant.bind(component.translate);
	return <AdminFinanceBonusPlayerPDF>{
		header: {
			title: t('admin.contracts.bonusList'),
			subTitle: component.selectedSeason.name
		},
		metadata: {
			createdLabel: `${t('general.createdOn')} ${moment(new Date()).format(`${getMomentFormatFromStorage()} hh:mm`)}`
		},
		summary: {
			appearanceFees: {
				label: t('admin.contracts.appearanceFees'),
				value:
					component.bonusComputed.total &&
					`${component.currentTeamService.getCurrency()}${zeroOrShort(component.bonusComputed.appFee)}`
			},
			appearanceBonus: {
				label: t('admin.contracts.appearance'),
				value:
					component.bonusComputed.totalAppBonus &&
					`${component.currentTeamService.getCurrency()}${zeroOrShort(component.bonusComputed.appBonus)}/${zeroOrShort(
						component.bonusComputed.totalAppBonus
					)}`
			},
			performanceBonus: {
				label: t('admin.contracts.performance'),
				value:
					component.bonusComputed.totalPerfBonus &&
					`${component.currentTeamService.getCurrency()}${zeroOrShort(component.bonusComputed.perfBonus)}/${zeroOrShort(
						component.bonusComputed.totalPerfBonus
					)}`
			},
			standardTeamBonus: {
				label: t('admin.contracts.standardTeam'),
				value:
					component.bonusComputed.totalStdBonus &&
					`${component.currentTeamService.getCurrency()}${zeroOrShort(component.bonusComputed.stdBonus)}/${zeroOrShort(
						component.bonusComputed.totalStdBonus
					)}`
			},
			otherBonus: {
				label: t('admin.contracts.custom'),
				value:
					component.bonusComputed.totalCustomBonus &&
					`${component.currentTeamService.getCurrency()}${zeroOrShort(
						component.bonusComputed.customBonus
					)}/${zeroOrShort(component.bonusComputed.totalCustomBonus)}`
			},
			total: {
				label: t('sessionAnalysis.options.total'),
				value:
					component.bonusComputed.totalTotal &&
					`${component.currentTeamService.getCurrency()}${zeroOrShort(component.bonusComputed.total)}/${zeroOrShort(
						component.bonusComputed.totalTotal
					)}`
			}
		},
		table: {
			headers: getHeadersForPlayer(component),
			rows: component.filteredPeopleBonuses.map(bonus =>
				component.profile === 'Agent' ? getRowForAgent(component, t, bonus) : getRowForPlayer(component, t, bonus)
			),
			rowsDetail: component.filteredPeopleBonuses.map(bonus => {
				return (bonus.conditions || []).map((progressCondition, index) => ({
					label: getPlayerBonusConditionItem(index, bonus, component).description
				}));
			})
		}
	};
}

function getPlayerBonusConditionItem(
	conditionIndex: number,
	bonus: BonusItem,
	component: TableBonusComponent
): { description: string; progress: string; type: string } {
	return component.bonusStringBuilder.getSingleConditionSimplified(bonus.conditions[conditionIndex], {
		...bonus,
		amount: component.getVatCorrection(bonus)
	});
}

function getHeadersForPlayer(component: TableBonusComponent): MixedType[] {
	return component.peopleTableColumns
		.filter(({ field }) => ['confirmedDate', 'achievedDate', 'paidDate', 'club'].indexOf(field) < 0)
		.slice(1)
		.map(({ header }, index) => ({
			label: header,
			mode: 'text',
			alignment: index === 0 ? 'left' : 'center'
		}));
}

function getRowForAgent(component: TableBonusComponent, t, bonus: BonusItem) {
	return [
		{
			label: component.getAgentName(bonus.personId)
		},
		...getRowForPlayer(component, t, bonus)
	];
}

function getRowForPlayer(component: TableBonusComponent, t, bonus: BonusItem) {
	const isAppearanceOrPerformance = bonus.type === 'appearanceFee' || bonus.type === 'performanceFee';
	return [
		{
			label: component.selectItemLabelPipe.transform(bonus.personId, component.playerOptions, 'id')
		},
		{
			label: t(
				component.getContractLabel(
					bonus.transferType as TransferTypeString,
					bonus.contractType as ContractType,
					bonus.contractId
				)
			)
		},
		{
			label: bonus.contract.personStatus && t(`admin.contracts.type.${bonus.contract.personStatus}`)
		},
		{
			label: bonus.type && t(`bonus.type.${bonus.type}`)
		},
		{
			[isAppearanceOrPerformance ? 'label' : 'value']: isAppearanceOrPerformance
				? `${component.getConditionText(bonus)}: ${bonus?.progress?.count}`
				: bonus?.progress?.percentage,
			mode: isAppearanceOrPerformance ? 'text' : 'progressbar'
		},
		{
			label: `${component.currentTeamService.getCurrency()}${toShortNumber(
				getVirtualGross(bonus, true, component.taxes),
				true
			)}`
		},
		{
			label: component.archived
				? bonus.reachable === true
					? t('yes')
					: bonus.reachable === false
					? t('no')
					: ''
				: null
		},
		{
			label: bonus.reached === true ? t('yes') : bonus.reached === false ? t('no') : ''
		},
		{
			label: bonus.confirmed === true ? t('yes') : bonus.confirmed === false ? t('no') : ''
		},
		{
			label: bonus.paid === true ? t('yes') : bonus.paid === false ? t('no') : ''
		}
	];
}

export function getPlayerCSVReport(component: TableBonusComponent) {
	const t = component.translate.instant.bind(component.translate);
	const bonusConditions: ContractOptionCondition[][] = component.filteredPeopleBonuses.map(
		({ conditions }) => conditions
	);
	const maxConditions = Math.max(...bonusConditions.map(conditions => conditions.length));
	const conditionHeaders: { header: string; field: string }[] = [];
	for (let i = 0; i < maxConditions; i++) {
		conditionHeaders.push({
			header: `Condition ${i + 1}`,
			field: `condition${i + 1}`
		});
		conditionHeaders.push({
			header: `Condition ${i + 1} Type`,
			field: `condition${i + 1} Type`
		});
		conditionHeaders.push({
			header: `Condition ${i + 1} Progress`,
			field: `condition${i + 1} Progress`
		});
	}
	const headers = [...component.peopleTableColumns.slice(1), ...conditionHeaders];
	let values = [];
	switch (component.profile) {
		case 'Agent':
			values = component.filteredPeopleBonuses.map(bonus => ({
				agentName: component.getAgentName(bonus.personId),
				player: component.selectItemLabelPipe.transform(bonus.personId, component.playerOptions, 'id'),
				contractType: t(
					component.getContractLabel(
						bonus.transferType as TransferTypeString,
						bonus.contractType as ContractType,
						bonus.contractId
					)
				),
				personStatus: bonus.contract.personStatus && t(`admin.contracts.type.${bonus.contract.personStatus}`),
				club: !bonus.contract.club
					? component.selectedTeam.name
					: component.selectItemLabelPipe.transform(bonus.contract.club, component.clubNameService.cachedClubNames),
				type: bonus.type && t(`bonus.type.${bonus.type}`),
				percentage:
					bonus.progress.percentage < 100 &&
					bonus.progress.bonus !== 'appearanceFee' &&
					bonus.progress.bonus !== 'performanceFee'
						? bonus.progress.percentage
						: 100,
				details: getDetails(component, bonus, t),
				amount: `${getVirtualGross(bonus, !component.netValuesFlag, component.taxes)}`,
				due: toDateString(bonus.progress.dueDate),
				reachable: component.archived ? (bonus.reachable ? t('yes') : bonus.reachable ? t('no') : '') : null,
				reached: bonus.reached === true ? t('yes') : bonus.reached === false ? t('no') : '',
				confirmed: bonus.confirmed === true ? t('yes') : bonus.confirmed === false ? t('no') : '',
				paid: bonus.paid === true ? t('yes') : bonus.paid === false ? t('no') : '',
				achievedDate: bonus.achievedDate,
				confirmedDate: bonus.confirmedDate,
				paidDate: bonus.paidDate,
				...getCSVConditionValues(conditionHeaders, bonus, component)
			}));
			break;
		case 'Player':
			values = component.filteredPeopleBonuses.map(bonus => {
				return {
					displayName: component.selectItemLabelPipe.transform(bonus.personId, component.playerOptions, 'id'),
					contractType: t(
						component.getContractLabel(
							bonus.transferType as TransferTypeString,
							bonus.contractType as ContractType,
							bonus.contractId
						)
					),
					personStatus: bonus.contract.personStatus && t(`admin.contracts.type.${bonus.contract.personStatus}`),
					club: !bonus.contract.club
						? component.selectedTeam.name
						: component.selectItemLabelPipe.transform(bonus.contract.club, component.clubNameService.cachedClubNames),
					type: bonus.type && t(`bonus.type.${bonus.type}`),
					percentage:
						bonus.progress.percentage < 100 &&
						bonus.progress.bonus !== 'appearanceFee' &&
						bonus.progress.bonus !== 'performanceFee'
							? bonus.progress.percentage
							: 100,
					details: getDetails(component, bonus, t),
					amount: `${getVirtualGross(bonus, !component.netValuesFlag, component.taxes)}`,
					due: toDateString(bonus.progress.dueDate),
					reachable: component.archived
						? bonus.reachable === true
							? t('yes')
							: bonus.reachable === false
							? t('no')
							: ''
						: null,
					reached: bonus.reached === true ? t('yes') : bonus.reached === false ? t('no') : '',
					confirmed: bonus.confirmed === true ? t('yes') : bonus.confirmed === false ? t('no') : '',
					paid: bonus.paid === true ? t('yes') : bonus.paid === false ? t('no') : '',
					achievedDate: bonus.achievedDate,
					confirmedDate: bonus.confirmedDate,
					paidDate: bonus.paidDate,
					reachedCustomerId: bonus.reachedCustomerId,
					confirmedCustomerId: bonus.confirmedCustomerId,
					paidCustomerId: bonus.paidCustomerId,
					...getCSVConditionValues(conditionHeaders, bonus, component)
				};
			});
			break;
		default:
			console.warn('profile not found');
	}
	return {
		isAgent: component.profile === 'Agent',
		title: t('bonus') + ' - ' + component.profile === 'staff' ? 'Staff ' : t('Players'),
		appearanceFee: {
			label: t('admin.contracts.appearanceFees'),
			value: component.bonusComputed.total && `${component.bonusComputed.appFee}`
		},
		performanceFee: {
			label: t('admin.contracts.performanceFee'),
			value: component.bonusComputed.total && `${component.bonusComputed.perfFee}`
		},
		appearanceBonus: {
			label: t('admin.contracts.appearance'),
			value:
				component.bonusComputed.totalAppBonus &&
				`${component.bonusComputed.appBonus}/${component.bonusComputed.totalAppBonus}`
		},
		performanceBonus: {
			label: t('admin.contracts.performance'),
			value:
				component.bonusComputed.totalPerfBonus &&
				`${component.bonusComputed.perfBonus}/${component.bonusComputed.totalPerfBonus}`
		},
		standardTeamBonus: {
			label: t('admin.contracts.standardTeam'),
			value:
				component.bonusComputed.totalStdBonus &&
				`${component.bonusComputed.stdBonus}/${component.bonusComputed.totalStdBonus}`
		},
		signingBonus: {
			label: t('admin.contracts.signing'),
			value:
				component.bonusComputed.totalSignBonus &&
				`${component.bonusComputed.signBonus}/${component.bonusComputed.totalSignBonus}`
		},
		customBonus: {
			label: t('admin.contracts.custom'),
			value:
				component.bonusComputed.totalCustomBonus &&
				`${component.bonusComputed.customBonus}/${component.bonusComputed.totalCustomBonus}`
		},
		valorization: {
			label: t('admin.contracts.valorization'),
			value: `${component.bonusComputed.valorization}/${component.bonusComputed.totalValorization}`
		},
		total: {
			label: t('sessionAnalysis.options.total'),
			value:
				component.bonusComputed.totalTotal && `${component.bonusComputed.total}/${component.bonusComputed.totalTotal}`
		},
		headers,
		values
	};
}

function getCSVConditionValues(
	conditionHeaders: { header: string; field: string }[],
	bonus: BonusItem,
	component: TableBonusComponent
) {
	const conditionValues: { [key: string]: string } = {};
	for (let i = 0; i < conditionHeaders.length; i++) {
		const item = bonus?.conditions[i] ? getPlayerBonusConditionItem(i, bonus, component) : null;
		conditionValues[`condition${i + 1}`] = item?.description ? parseHtmlStringToText(item.description) : null;
		conditionValues[`condition${i + 1} Type`] = item?.type ? parseHtmlStringToText(item.type) : null;
		conditionValues[`condition${i + 1} Progress`] = item?.progress ? parseHtmlStringToText(item.progress) : null;
	}
	return conditionValues;
}

export interface AdminFinanceBonusPlayerPDF extends PdfBase {
	summary: {
		appearanceFees: PdfBasicType;
		appearanceBonus: PdfBasicType;
		performanceBonus: PdfBasicType;
		standardTeamBonus: PdfBasicType;
		otherBonus: PdfBasicType;
		total: PdfBasicType;
	};
	table: PdfMixedTable;
}
