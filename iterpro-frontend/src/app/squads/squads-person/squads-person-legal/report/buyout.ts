import { toDateString, thousand } from './utils';

const amount = (item, t, component) => `<b>${component.currency}${thousand(item.amount) || ''}</b>`;
const where = (item, t, component) => `${t('admin.contracts.where')} ${item.where || ''}`;
const from = (item, t, component) => `${t('admin.contracts.payableFrom')} ${toDateString(item.from)}`;
const to = (item, t, component) => `${t('admin.contracts.payableTo')} ${toDateString(item.to)}`;

const toBuyout = (item, t, component) => {
  const getters = [amount, where, from, to];
  return getters.map(f => f(item, t, component)).join(' ');
};

export default toBuyout;