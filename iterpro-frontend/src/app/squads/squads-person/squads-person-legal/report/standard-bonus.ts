import { competitionsList } from '@iterpro/shared/utils/common-utils';
import { competitions, teamActions, teamActionsGoal } from '../utils/contract-options';
import {
	bonusCapped,
	getConditioned,
	getTranslatedLabel,
	getTranslatedLabels,
	season,
	solidarity,
	startingFrom,
	thousand,
	toInstallments,
	within
} from './utils';

const all = { label: 'allActiveCompetitions', value: 'allActiveCompetitions' };
const allCompetitions = [all, ...competitions, ...competitionsList];

const amount = (item, t, component) => `<b>${component.currency}${thousand(item.amount) || ''}</b>`;
const what = (item, t, component) =>
	`${t('admin.contracts.teamBonus.label')} ${getTranslatedLabel(teamActions, item.type, t)}`;
const count = (item, t, component) => (item.count || item.count === 0 ? item.count : ' ');
const achieves = (item, t, component) => getTranslatedLabel(teamActionsGoal, item.goal, t);
const comp = (item, t, component) => getTranslatedLabels(allCompetitions, item.competition || [], t);
const installments = (item, t, component) => toInstallments(item.installments, t, component);
const inLabel = (item, t, component) => t('in');

const typeGetters = bonus => {
	const getters = [];
	try {
		if (bonus.action === 'achieves' && (bonus.goal === 'wins' || bonus.goal === 'points')) getters.push(count);
		if (bonus.action === 'achieves') getters.push(achieves);
		if (bonus.type) getters.push(inLabel);
		if (bonus.type) getters.push(comp);
	} catch (e) {}
	return getters;
};

const typeAmount = withAmount => (withAmount ? [amount, solidarity] : []);
const typeWithin = withAmount => (withAmount ? [startingFrom, within, installments, getConditioned, bonusCapped] : []);

const toStandardBonus = (item, t, component, withAmount = true) => {
	const getters = [...typeAmount(withAmount), what, ...typeGetters(item), season, ...typeWithin(withAmount)];
	return getters.map(f => f(item, t, component)).join(' ');
};

export default toStandardBonus;
