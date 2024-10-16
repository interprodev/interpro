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
import { competitions, nationalsApp, teams } from '../utils/contract-options';
import { competitionsList } from '@iterpro/shared/utils/common-utils';

const all = { label: 'allActiveCompetitions', value: 'allActiveCompetitions' };
const allCompetitions = [all, ...competitions, ...competitionsList];

const amount = (item, t, component) => `<b>${component.currency}${thousand(item.amount) || ''}</b>`;
const count = (item, t, component) => `${t('admin.contracts.appearance.label')} ${item.count || ''}`;
const what = (item, t, component) =>
	t('admin.contracts.appearanceFees.label') + ' ' + getTranslatedLabel(nationalsApp, item.type, t);
const min = (item, t, component) => `${item.count2} ${t('min')}`;
const inL = (item, t, component) => t('in');
const team = (item, t, component) => getTranslatedLabel(teams, item.team, t);
const comp = (item, t, component) => getTranslatedLabels(allCompetitions, item.competition || [], t);
const installments = (item, t, component) => toInstallments(item.installments, t, component);

const typeGetters = item => {
	const getters = [];
	if (item.type === 'appMinutes') getters.push(min);
	getters.push(inL);
	if (item.type === 'calledUp') getters.push(team);
	else getters.push(comp);
	return getters;
};

const typeAmount = withAmount => (withAmount ? [amount, solidarity] : []);
const typeWithin = withAmount => (withAmount ? [startingFrom, within, installments, bonusCapped, getConditioned] : []);

const toAppBonus = (item, t, component, withAmount = true) => {
	const getters = [...typeAmount(withAmount), count, what, ...typeGetters(item), season, ...typeWithin(withAmount)];
	return getters.map(f => f(item, t, component)).join(' ');
};

export default toAppBonus;
