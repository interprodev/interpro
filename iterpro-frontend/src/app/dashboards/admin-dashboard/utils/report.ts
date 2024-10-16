import { toShortNumber } from '@iterpro/shared/ui/pipes';
import { getLimb, getMinCircles, getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment';
import { AdminDashboardTeamComponent } from '../admin-dashboard-team/admin-dashboard-team.component';
import { getChart, getHealthTooltip } from './utils';

const getInfo = (player, result, translate, sportType) => {
	const nationality = player.nationality && translate.instant(`nationalities.${player.nationality}`);
	const age = player.birthDate && Math.abs(moment(player.birthDate).diff(moment(), 'years'));
	const foot = player.foot && translate.instant('foot.' + player.foot);
	const dateFrom = moment(result.dateFrom).format(getMomentFormatFromStorage());
	const dateTo = moment(result.dateTo).format(getMomentFormatFromStorage());
	return {
		info1: [
			{ label: translate.instant('profile.overview.nationality'), value: nationality },
			{ label: translate.instant('profile.overview.age'), value: age },
			{ label: translate.instant('profile.overview.weight'), value: player.weight },
			{ label: translate.instant('profile.overview.height'), value: player.height }
		],
		info2: [
			{ label: translate.instant('profile.positon.jerseyNumber'), value: player.jersey },
			{ label: translate.instant(`profile.position.${getLimb(sportType)}`), value: foot },
			{ label: translate.instant('profile.positon.inTeamFrom'), value: dateFrom },
			{ label: translate.instant('profile.overview.contractUntil'), value: dateTo }
		]
	};
};

const toSN = n => toShortNumber(n, true);

const getFinance = (results, translate, component: AdminDashboardTeamComponent) => {
	const currency = component.currentTeamService.getCurrency();
	const salary = results.salary;
	const value = results.marketValue;
	return {
		title: translate.instant('admin.dashboard.finance'),
		availability: {
			title: translate.instant('admin.dashboard.availability'),
			value: Math.round(results.availability)
		},
		productivity: {
			title: translate.instant('admin.dashboard.productivity'),
			value: Math.round(results.performanceReliability)
		},
		salary: {
			label: translate.instant('admin.dashboard.salary'),
			value: salary ? `${currency}` + toShortNumber(salary, true) : '-'
		},
		value: {
			label: translate.instant('admin.dashboard.value'),
			value: value ? `${currency}` + toShortNumber(value, true) : '-'
		}
	};
};

const getTechnical = (results, translate) => {
	return {
		title: translate.instant('admin.dashboard.technical'),
		apps: {
			label: translate.instant('admin.dashboard.seasonApps'),
			value: results.apps
		},
		minutes: {
			label: translate.instant('admin.dashboard.minutesPlayed'),
			value: results.minutesPlayed
		},
		scores: {
			label: translate.instant('admin.dashboard.heavyGoal'),
			value: results.heavyGoal
		}
	};
};

const getMedical = (results, translate) => {
	const [data, options] = getChart(results, translate);
	return {
		title: translate.instant('admin.dashboard.medical'),
		status: {
			label: translate.instant('admin.dashboard.currentStatus'),
			value: translate.instant(getHealthTooltip(results.healthStatusReadiness))
		},
		injuries: {
			label: translate.instant('admin.dashboard.totalInjuries'),
			value: results.injuriesNumber
		},
		chart: {
			data,
			options
		}
	};
};

export function getReport(component: AdminDashboardTeamComponent, results, player) {
	const { translate, sportType } = component;

	const data = {
		title: player.displayName,
		image: player.downloadUrl,
		...getInfo(player, results, translate, sportType),
		finance: getFinance(results, translate, component),
		technical: getTechnical(results, translate),
		medical: getMedical(results, translate),
		position: getMinCircles(null, player.position, player.position2, player.position3)
	};

	return data;
}
