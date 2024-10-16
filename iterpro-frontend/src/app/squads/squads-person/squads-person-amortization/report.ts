import { clearCircularJSON } from '@iterpro/shared/utils/common-utils';
import { currency, thousand, toDateString } from '../squads-person-legal/report/utils';

const toSemesters = (contract, v) => [
	contract.currency + (v[0] > 0 ? thousand(v[0]) : 0),
	contract.currency + (v[1] > 0 ? thousand(v[1]) : 0)
];

const toAppBonus = (item, i, component, t) => {
	if (!component.contract || !component.contract.appearanceBonus[i]) return null;
	const app = component.contract.appearanceBonus[i];
	const current = component.bonuses[app.competition] ? component.bonuses[app.competition][app.type] : 0;

	let text = `<b>${current}/${app.count}</b> `;
	text += app.type ? t(app.type || ' ', { value: app.count2 }).toLowerCase() : '';
	text += ' in ';
	text += component.getCompetitionList(app.competition);
	text += ' ' + app.season;

	let text2 = `<b>${component.contract.currency || component.currentTeamService.getCurrency()}${thousand(
		app.count * app.amount
	)}</b>`;
	text2 += ` ${t('admin.contracts.options.within')} `;
	text2 += `<b>${toDateString(app.within)}</b>`;

	return {
		bonus: item,
		text,
		text2
	};
};

const toPerfBonus = (item, i, component, t) => {
	if (!component.contract || !component.contract.performanceBonus[i]) return null;
	const perf = component.contract.performanceBonus[i];
	const goal =
		component.bonuses[perf.competition] && component.bonuses[perf.competition][perf.goal]
			? component.bonuses[perf.competition][perf.goal]
			: 0;

	let text = `<b>${goal}/${perf.count}</b> `;
	text += perf.goal ? t(perf.goal).toLowerCase() : ' ';
	text += ' in ';
	text += component.getCompetitionList(perf.competition);
	text += ' ' + perf.season;

	let text2 = `<b>${component.contract.currency || component.currentTeamService.getCurrency()}${thousand(
		perf.count * perf.amount
	)}</b>`;
	text2 += ` ${t('admin.contracts.options.within')} `;
	text2 += `<b>${toDateString(perf.within)}</b>`;

	return {
		bonus: item,
		text,
		text2
	};
};

const toTeamBonus = (item, i, component, t) => {
	if (!component.contract || !component.contract.standardTeamBonus[i]) return null;
	const perf = component.contract.standardTeamBonus[i];
	const goal =
		component.bonuses[perf.competition] && component.bonuses[perf.competition][perf.goal]
			? component.bonuses[perf.competition][perf.goal]
			: 0;

	let text = `<b>${goal}/${perf.count}</b> `;
	text += perf.goal ? t(perf.goal).toLowerCase() : ' ';
	text += ' in ';
	text += component.getCompetitionList(perf.competition);
	text += ' ' + perf.season;

	let text2 = `<b>${component.contract.currency || component.currentTeamService.getCurrency()}${thousand(
		perf.count * perf.amount
	)}</b>`;
	text2 += ` ${t('admin.contracts.options.within')} `;
	text2 += `<b>${toDateString(perf.within)}</b>`;

	return {
		bonus: item,
		text,
		text2
	};
};

const toSigningBonus = (item, i, component, t) => {
	if (!component.contract || !component.contract.signingBonus[i]) return null;
	const perf = component.contract.signingBonus[i];
	const goal =
		component.bonuses[perf.competition] && component.bonuses[perf.competition][perf.goal]
			? component.bonuses[perf.competition][perf.goal]
			: 0;

	let text = `<b>${goal}/${perf.count}</b> `;
	text += perf.goal ? t(perf.goal).toLowerCase() : ' ';
	text += ' in ';
	text += component.getCompetitionList(perf.competition);
	text += ' ' + perf.season;

	let text2 = `<b>${component.contract.currency || component.currentTeamService.getCurrency()}${thousand(
		perf.count * perf.amount
	)}</b>`;
	text2 += ` ${t('admin.contracts.options.within')} `;
	text2 += `<b>${toDateString(perf.within)}</b>`;

	return {
		bonus: item,
		text,
		text2
	};
};

const toCustomBonus = (item, i, component, t) => {
	if (!component.contract || !component.contract.customBonus[i]) return null;
	const custom = component.contract.customBonus[i];
	const goal = custom.custom;

	let text = `<b>${goal}</b> `;
	text += ' in ';
	text += component.getCompetitionList(custom.competition);
	text += ' ' + custom.season;

	let text2 = `<b>${component.contract.currency || component.currentTeamService.getCurrency()}${thousand(
		custom.count * custom.amount
	)}</b>`;
	text2 += ` ${t('admin.contracts.options.within')} `;
	text2 += `<b>${toDateString(custom.within)}</b>`;

	return {
		bonus: item,
		text,
		text2
	};
};

export const getReport = (component, azureUrlPipe) => {
	const t = component.translate.instant.bind(component.translate);
	const forecast = component.forecast;
	const inward = component.inward;
	const contract = component.contract || component.currentTeamService.getCurrency();
	return {
		title: `${component.player.name || component.player.firstName} ${component.player.lastName.toUpperCase()}`,
		image: azureUrlPipe.transform(component.player.downloadUrl),
		chart: component.data && {
			data: clearCircularJSON(component.data),
			options: component.options
		},
		values: [
			{
				label: t('forecast.purchaseDate'),
				value: inward && toDateString(inward.on)
			},
			{
				label: t('forecast.cost'),
				value: currency(contract.currency, inward.cost)
			},
			{
				label: t('forecast.agent'),
				value: currency(contract.currency, inward.agent)
			},
			{
				label: t('forecast.wage'),
				value: currency(contract.currency, inward.wage)
			},
			{
				label: t('forecast.benefits'),
				value: currency(contract.currency, inward.benefits)
			},
			{
				label: t('forecast.total'),
				value: currency(contract.currency, inward.total)
			},
			{
				label: t('forecast.amortizationLength'),
				value: inward.amortizationLength
			},
			{
				label: t('forecast.amortization'),
				value: currency(contract.currency, inward.amortization)
			}
		],
		table: {
			currency: contract.currency,
			label: t('forecast.amortization'),
			headers1: component.cols && component.cols.map(c => `${t('forecast.season')} ${c}`),
			headers2: component.cols && component.cols.map(c => [t('forecast.semesterI'), t('forecast.semesterII')]),
			amortization: {
				label: t('forecast.amortization'),
				values: component.amortization ? component.amortization.map(v => toSemesters(contract, v)) : []
			},
			residual: {
				label: t('forecast.residual'),
				values: component.residual ? component.residual.map(v => toSemesters(contract, v)) : []
			}
		},
		bonuses: {
			title: t('forecast.bonuses'),
			app: {
				title: t('forecast.appearanceBonuses'),
				values: (component.appearanceBonuses || []).map((item, i) => toAppBonus(item, i, component, t))
			},
			perf: {
				title: t('forecast.performanceBonuses'),
				values: (component.performanceBonuses || []).map((item, i) => toPerfBonus(item, i, component, t))
			},
			team: {
				title: t('admin.contracts.standardTeam'),
				values: (component.standardTeamBonus || []).map((item, i) => toTeamBonus(item, i, component, t))
			},
			signing: {
				title: t('admin.contracts.signing'),
				values: (component.signingBonus || []).map((item, i) => toSigningBonus(item, i, component, t))
			},
			custom: {
				title: t('admin.contracts.custom'),
				values: (component.customBonus || []).map((item, i) => toCustomBonus(item, i, component, t))
			}
		}
	};
};
