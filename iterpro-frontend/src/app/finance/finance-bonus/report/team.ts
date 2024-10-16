import {
	Bonus,
	ContractOptionCondition,
	Match,
	MixedType,
	PdfBase,
	PdfMixedTable,
	TeamBonus
} from '@iterpro/shared/data-access/sdk';
import { getMomentFormatFromStorage, getResult } from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment';
import { TableBonusComponent } from '../table-bonus/table-bonus.component';
import { toShortNumber } from '@iterpro/shared/ui/pipes';

export const toDateString = date => {
	if (!date) return '';
	let momentDate = moment(date, getMomentFormatFromStorage());
	if (!momentDate.isValid()) momentDate = moment(date);
	return momentDate.isValid() ? momentDate.format(getMomentFormatFromStorage()) : '';
};

const getMatchItems = (
	t,
	match: Match,
	condition: ContractOptionCondition,
	bonus: TeamBonus,
	index: number
): string[] => [
	index,
	toDateString(match.date),
	match.opponent,
	t(match.home ? 'home' : 'away'),
	`${match.result ? match.result : ''} (${t(getResult(match))})`,
	condition.condition ? t(condition.condition) : '',
	index === bonus.conditions.length - 1 ? '' : bonus.conditionRelationFlag
];

const getDetails = (component: TableBonusComponent, t, bonus: Bonus | TeamBonus, i: number) =>
	bonus.type === 'performance' ? component.getTeamCondition(bonus, i).replace(/<[^>]*>?/gm, '') : bonus.notes;

const getEach = (bonus, currency) =>
	bonus.total && bonus.total !== 0 && bonus.people && bonus.people.length
		? `${currency}${toShortNumber(Math.round(bonus.total / bonus.people.length), true)}`
		: '';

const getCommonItems = (component: TableBonusComponent, t, bonus: TeamBonus) => [
	bonus.total ? `${component.currentTeamService.getCurrency()}${toShortNumber(bonus.total, true)}` : '',
	bonus.people ? bonus.people.length : '',
	getEach(bonus, component.currentTeamService.getCurrency()),
	toDateString(bonus.dueDate),
	t(component.getReachedText(bonus) || ' '),
	toDateString(bonus.achievedDate),
	t(component.getConfirmedText(bonus) || ' '),
	toDateString(bonus.confirmedDate),
	t(component.getPaidText(bonus) || ' '),
	toDateString(bonus.paidDate)
];

export function getTeamPDFReport(component: TableBonusComponent): AdminFinanceBonusTeamPDF {
	const t = component.translate.instant.bind(component.translate);
	const matchBonus: TeamBonus[] = component.getFilteredMatch();
	const otherBonus: TeamBonus[] = component.getFilteredOther();
	const tableHeaders = component.teamTableColumns
		.slice(1, component.teamTableColumns.length - 1)
		.map(({ header }, index) => ({
			label: header,
			mode: 'text',
			alignment: index === 0 ? 'left' : 'center'
		}));
	const matchBonusTableRowsDetails: MixedType[][] = [];
	const performanceBonusTableRowsDetails: MixedType[][] = [];
	return <AdminFinanceBonusTeamPDF>{
		header: {
			title: (t('bonus') + ' - ' + t('Team')).toUpperCase(),
			subTitle: component.selectedSeason.name
		},
		metadata: {
			createdLabel: `${t('general.createdOn')} ${moment(new Date()).format(`${getMomentFormatFromStorage()} hh:mm`)}`
		},
		matchBonusTable: {
			title: t('bonus.team.matchIcon'),
			table: {
				headers: tableHeaders,
				rows: matchBonus.map((bonus: TeamBonus) => {
					bonus.conditions.map((condition, index) => {
						const match: Match = component.getMatchInfo(condition.matchId);
						matchBonusTableRowsDetails.push([
							{
								label: match ? getMatchItems(t, match, condition, bonus, index).join(' ') : null,
								mode: 'text'
							}
						]);
					});
					return getCommonItems(component, t, bonus).map(item => ({ label: item, mode: 'text' }));
				}),
				rowsDetail: matchBonusTableRowsDetails
			}
		},
		performanceBonusTable: {
			title: t('bonus.team.performanceIcon'),
			table: {
				headers: tableHeaders,
				rows: otherBonus.map((bonus: TeamBonus) => {
					bonus.conditions.map((condition, index) => {
						performanceBonusTableRowsDetails.push(
							[getDetails(component, t, bonus, index)].map(item => ({ label: item, mode: 'text' }))
						);
					});
					return getCommonItems(component, t, bonus).map(item => ({ label: item, mode: 'text' }));
				}),
				rowsDetail: performanceBonusTableRowsDetails
			}
		}
	};
}
export function getTeamCSVReport(component: TableBonusComponent) {
	const t = component.translate.instant.bind(component.translate);
	const matchBonus: TeamBonus[] = component.getFilteredMatch();
	const otherBonus: TeamBonus[] = component.getFilteredOther();
	const data = {
		title: t('bonus') + ' - ' + t('Team'),
		match: {
			title: t('bonus.team.matchIcon'),
			headers: component.teamTableColumns.slice(1),
			values: matchBonus.map(bonus => ({
				common: getCommonItems(component, t, bonus),
				details: bonus.conditions.map((condition, index) => {
					const match = component.getMatchInfo(condition?.matchId);
					if (!match) return [];
					return [...getMatchItems(t, match, condition, bonus, index)];
				})
			}))
		},
		perf: {
			title: t('bonus.team.performanceIcon'),
			headers: component.teamTableColumns.slice(1),
			values: otherBonus.map(bonus => ({
				common: getCommonItems(component, t, bonus),
				details: bonus.conditions.map((condition, index) => [getDetails(component, t, bonus, index)])
			}))
		}
	};
	return data;
}

export interface AdminFinanceBonusTeamPDF extends PdfBase {
	matchBonusTable: { title: string; table: PdfMixedTable };
	performanceBonusTable: { title: string; table: PdfMixedTable };
}
