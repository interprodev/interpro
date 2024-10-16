import { competitionsList } from '@iterpro/shared/utils/common-utils';
import { awards, competitions, goals, playerActions, teams } from '../utils/contract-options';
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
const label = (item, t, component) => t('admin.contracts.performance.label');
const what = (item, t, component) => getTranslatedLabel(playerActions, item.type, t);
const top = (item, t, component) => item.top;
const count = (item, t, component) => item.count;
const goalsL = (item, t, component) => getTranslatedLabel(goals, item.goal, t);
const award = (item, t, component) => getTranslatedLabel(awards, item.goal, t);
const inL = (item, t, component) => t('in');
const team = (item, t, component) => getTranslatedLabel(teams, item.team, t);
const comp = (item, t, component) => getTranslatedLabels(allCompetitions, item.competition || [], t);
const installments = (item, t, component) => toInstallments(item.installments, t, component);

const typeGetters = bonus => {
	const getters = [];

	if (bonus.type === 'makes' || bonus.type === 'isInTheTop') getters.push(count);
	if (bonus.type === 'makes') getters.push(goalsL);
	if (bonus.type === 'makes') getters.push(inL);
	if (bonus.type === 'makes') getters.push(comp);
	if (bonus.type && bonus.type !== 'makes') getters.push(award);
	if (
		(bonus.type === 'winsThe' || bonus.type === 'isInTheTop' || bonus.type === 'candidateTo') &&
		(bonus.goal === 'strikerTeam' || bonus.goal === 'strikerCompetition')
	)
		getters.push(inL);
	if (
		(bonus.type === 'winsThe' || bonus.type === 'isInTheTop' || bonus.type === 'candidateTo') &&
		(bonus.goal === 'strikerTeam' || bonus.goal === 'strikerCompetition')
	)
		getters.push(comp);

	return getters;
};

const typeAmount = withAmount => (withAmount ? [amount, solidarity] : []);
const typeWithin = withAmount => (withAmount ? [startingFrom, within, installments, getConditioned, bonusCapped] : []);

const toPerfBonus = (item, t, component, withAmount = true) => {
	const getters = [...typeAmount(withAmount), label, what, ...typeGetters(item), season, ...typeWithin(withAmount)];
	return getters.map(f => f(item, t, component)).join(' ');
};

export default toPerfBonus;
