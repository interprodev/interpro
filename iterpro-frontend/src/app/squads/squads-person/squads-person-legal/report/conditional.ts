import toAppBonus from './app-bonus';
import toPerfBonus from './perf-bonus';
import toStandardBonus from './standard-bonus';

const conditional = (item, t, component) => {
	if (!item.conditioned) return '';
	let getter;
	if (item.condition && item.condition.type === 'appearance') getter = toAppBonus;
	if (item.condition && item.condition.type === 'performance') getter = toPerfBonus;
	if (item.condition && item.condition.type === 'standardTeam') getter = toStandardBonus;
	return getter ? getter(item.condition, t, component, false) : '';
};

export default conditional;
