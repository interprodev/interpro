import { toShortNumber } from '@iterpro/shared/ui/pipes';
import { clearAndCopyCircularJSON, getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment';
import { FinancialDashboardPlayerComponent } from './financial-dashboard-player.component';

const toSN = value => toShortNumber(value, true);

const toDateString = date => {
	if (!date) return '';
	let momentDate = moment(date, getMomentFormatFromStorage());
	if (!momentDate.isValid()) momentDate = moment(date);
	return momentDate.isValid() ? momentDate.format(getMomentFormatFromStorage()) : '';
};

const monthsDiff = (d1, d2) => {
	if (!d1 || !d2) return '';
	return Math.round(moment(d2).diff(moment(d1), 'months', true)) + ' months';
};

const getReport = (component: FinancialDashboardPlayerComponent) => {
	const t = component.translate.instant.bind(component.translate);
	const data = component.offlinePlayerData;
	const player = component.player;
	let percDiff = data.gainLossPercent;
	if (percDiff) percDiff = Math.round(percDiff);
	const fixed = data && component.taxesFlag ? data.wageGross : data.wage;
	const bonus = data && component.taxesFlag ? data.bonusGross : data.bonus;
	const residualBonus = data && component.taxesFlag ? data.residualBonusGross : data.residualBonus;
	const assetValue = data && component.taxesFlag ? data.assetValueGross : data.assetValue;
	const currentValue = data && component.taxesFlag ? data.marketValueGross : data.marketValue;
	const netBookValue = data && component.taxesFlag ? data.netBookValueGross : data.netBookValue;
	const totalInvestmentCost = data && component.taxesFlag ? data.totalInvestmentCostGross : data.totalInvestmentCost;
	const roi = data && component.taxesFlag ? data.roiGross : data.roi;
	const residualRoi = data && component.taxesFlag ? data.residualRoiGross : data.residualRoi;
	const losses = data && component.taxesFlag ? data.lossesGross : data.losses;
	const untapped = data && component.taxesFlag ? data.untappedGross : data.untapped;
	return {
		title: player.displayName,
		alerts: (component.alerts || []).map(a => (a ? a.message : '')),
		contract: {
			title: t('financial.dashboard.contractDetails'),
			duration: {
				title: t('financial.dashboard.contractDuration'),
				value: data.contractDuration.years,
				label: data.contractDuration.years || data.contractDuration.years === 0 ? t('years') : ''
			},
			dates: {
				labelFrom: t('financial.dashboard.contractStart'),
				labelTo: t('financial.dashboard.contractEnd'),
				df: toDateString(data.contractDuration.start),
				dt: toDateString(data.contractDuration.end),
				perc: data.contractDuration.completionPercentage,
				diff:
					data.contractDuration?.remainingTime <= 0
						? t('profile.status.expired')
						: `${data.contractDuration?.remainingTime} ${t('months')}`
			},
			fixed: {
				title: t('financial.dashboard.fixedWage'),
				value: data
					? `${component.currentTeamService.getCurrency()}${toSN(fixed) || 0}`
					: component.currentTeamService.getCurrency()
			},
			bonus: {
				title: t('financial.dashboard.bonus'),
				value: data
					? `${component.currentTeamService.getCurrency()}${toSN(bonus) || 0} / ${
							residualBonus ? toSN(residualBonus) || 0 : ''
					  }`
					: ''
			}
		},
		capital: {
			title: t('financial.dashboard.capitalGain'),
			cost: {
				title: t('assetValue'),
				value: data
					? `${component.currentTeamService.getCurrency()}${toSN(assetValue) || 0}`
					: component.currentTeamService.getCurrency()
			},
			value: {
				title: t('financial.dashboard.currentValue'),
				value: data
					? `${component.currentTeamService.getCurrency()}${toSN(currentValue) || 0}`
					: component.currentTeamService.getCurrency(),
				netBookValue: data
					? `${component.currentTeamService.getCurrency()}${toSN(netBookValue) || 0}`
					: component.currentTeamService.getCurrency(),
				color: percDiff >= 0 ? 'green' : 'red',
				perc: `${percDiff > 0 ? '+' : ''}${percDiff || 0}%`
			},
			netBookValue: {
				title: t('financial.dashboard.bookValue'),
				value: data
					? `${component.currentTeamService.getCurrency()}${toSN(netBookValue) || 0}`
					: component.currentTeamService.getCurrency()
			},
			trend: {
				title: t('financial.dashboard.trendValue'),
				noValues: t('financial.dashboard.noValues'),
				chart: data.pastValues &&
					data.pastValues.length > 0 && {
						data: clearAndCopyCircularJSON(component.pastValuesChartData),
						options: component.pastValuesChartOptions
					}
			}
		},
		investment: {
			title: t('financial.dashboard.investmentPerformance'),
			matches: {
				title: t('financial.dashboard.tooltip.simulation'),
				value: component.futureMatches
			},
			cost: {
				title: t('financial.dashboard.totInvestmentCost'),
				value: data
					? `${component.currentTeamService.getCurrency()}${toSN(totalInvestmentCost) || 0}`
					: component.currentTeamService.getCurrency()
			},
			duration: {
				title: t('financial.dashboard.yearsInClub'),
				value: `${data && (data.yearsInTeam || data.yearsInTeam === 0) && data.yearsInTeam.toFixed(0)} ${
					data.yearsInTeam >= 0 ? t('years') : t('months')
				} /
					${data && (data.yearsLastContract || data.yearsLastContract === 0) && data.yearsLastContract.toFixed(0)} ${
					data.yearsLastContract >= 1 ? t('years') : t('months')
				}`
			},
			roi: {
				title: t('financial.dashboard.roi'),
				value: data
					? `${component.currentTeamService.getCurrency()}${toSN(roi) || 0}`
					: component.currentTeamService.getCurrency()
			},
			residualRoi: {
				title: t('financial.dashboard.residualRoi'),
				value: data
					? `${component.currentTeamService.getCurrency()}${toSN(residualRoi) || 0}`
					: component.currentTeamService.getCurrency()
			},
			losses: {
				title: t('financial.dashboard.losses'),
				value: data
					? `${component.currentTeamService.getCurrency()}${toSN(losses) || 0}`
					: component.currentTeamService.getCurrency()
			},
			untapped: {
				title: t('financial.dashboard.untapped'),
				value: data
					? `${component.currentTeamService.getCurrency()}${toSN(untapped) || 0}`
					: component.currentTeamService.getCurrency()
			},
			chart: component.investmentPerformanceChartData && {
				data: clearAndCopyCircularJSON(component.investmentPerformanceChartData),
				options: component.investmentPerformanceChartOptions
			}
		}
	};
};

export default getReport;
