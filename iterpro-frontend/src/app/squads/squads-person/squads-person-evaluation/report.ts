import { clearCircularJSON, getMinCircles, getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment';
import { thousand } from '../squads-person-legal/report/utils';

const getLabel = (values, value) => {
	if (!value) return '';
	const found = values.find(v => v.value === value);
	if (found) return found.label;
	return '';
};

const toDateString = date => {
	if (!date) return '';
	let momentDate = moment(date, getMomentFormatFromStorage());
	if (!momentDate.isValid()) momentDate = moment(date);
	return momentDate.isValid() ? momentDate.format(getMomentFormatFromStorage()) : '';
};

const getMarketValue = component => {
	const t = component.translate.instant.bind(component.translate);
	const player = component.player;
	return {
		title: t('admin.evaluation.marketValue'),
		values: [
			{ label: t('admin.evaluation.clubValue'), value: thousand(player.clubValue) },
			{ label: t('admin.evaluation.transfermarkt'), value: thousand(player.transfermarktValue) },
			{ label: t('admin.evaluation.ciesValue'), value: thousand(player.value) },
			{ label: t('admin.evaluation.agentValue'), value: thousand(player.agentValue) }
		]
	};
};

const getTransfers = component => {
	const t = component.translate.instant.bind(component.translate);
	const player = component.player;
	return {
		title: t('admin-evaluation.transfers'),
		headers: [
			t('admin.evaluation.date'),
			t('admin.evaluation.from'),
			t('admin.evaluation.to'),
			t('admin.evaluation.type'),
			t('admin.evaluation.value')
		],
		values: component.transfers.map(transfer => [
			toDateString(transfer.startDate),
			transfer.fromTeamName,
			transfer.toTeamName,
			transfer.type,
			thousand(transfer.value)
		])
	};
};

const getCareer = (component, career) => {
	const t = component.translate.instant.bind(component.translate);
	const player = component.player;
	return {
		title: t('admin.evaluation.career'),
		headers: {
			season: t('admin.evaluation.season'),
			competitions: t('admin.evaluation.competitions'),
			club: t('admin.evaluation.club'),
			apps: t('admin.evaluation.apps')
		},
		values: (career || []).map(item => [
			item.season.name,
			item.competition.name,
			item.team ? item.team.officialName : '',
			item.shirtNumber,
			item.appearances,
			item.goal,
			item.penalties,
			item.minutesPlayed,
			item.substituteIn,
			item.substituteOut,
			item.yellowCard,
			item.redCards
		])
	};
};

export const getReport = (component, azureUrlPipe) => {
	const t = component.translate.instant.bind(component.translate);
	const lastUpdate =
		component.pastValues && component.pastValues.length > 0
			? toDateString(component.pastValues[component.pastValues.length - 1].date)
			: '';
	return {
		title: `${component.player.name || component.player.firstName} ${component.player.lastName.toUpperCase()}`,
		image: component.player.downloadUrl,
		position: getMinCircles(null, component.player.position, component.player.position2, component.player.position3),
		marketValue: getMarketValue(component),
		valueChart: {
			label: t('admin.evaluation.marketTrend'),
			data: clearCircularJSON(component.data),
			options: component.options
		},
		transfers: getTransfers(component),
		club: getCareer(component, component.club),
		nationals: getCareer(component, component.nationals),
		lastUpdate: {
			label: t('lastUpdate'),
			value: lastUpdate
		}
	};
};
