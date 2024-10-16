import * as moment from 'moment';
import { Club, ContractPersonStatus, ContractPersonType } from '@iterpro/shared/data-access/sdk';

const forString = (field, searchstring) => {
	if (!searchstring || searchstring === '') return true;
	const re = new RegExp(searchstring, 'i');
	return re.test(field);
};
const forMulti = (field, active) => {
	return (active || []).indexOf(field) >= 0;
};
const forMultiEmpty = (field, active) => {
	return active.length === 0 || active.indexOf(field) >= 0;
};
const forStatus = (player, status) => {
	if (!status || !status.length) return false;
	const active = status.indexOf('active') >= 0;
	const archived = status.indexOf('archived') >= 0;
	if (active && !player.archived) return true;
	if (archived && player.archived) return true;
	return false;
};
const forAge = (birthDate, range) => {
	if (!range || !birthDate) return true;
	const age = moment().diff(moment(birthDate), 'years');
	return age >= range[0] && age <= range[1];
};
const forDoc = (documents, type, searchstring) => {
	if (!searchstring) return true;
	if (!documents) return false;
	return documents.find(doc => doc.type === type && forString(doc.number, searchstring));
};

const forValue = (value, from, to) => {
	if (!from && !to) return true;
	if (from && value < parseFloat(from)) return false;
	if (to && value > parseFloat(to)) return false;
	return true;
};

export interface FilteredPeople {
	type: ContractPersonType;
	people: any[];
}

export function getPeopleRows(club: Club, filters: any): number {
	const isPlayer = filters.role === 'Player';
	if (isPlayer) return club.players?.length || 0;
	if (filters.role === 'Staff') return club.staff?.length || 0;
	if (filters.role === 'Agent') return club.agents?.length || 0;
	return 0;
}

export const filterPeople = (club: Club, filters: any): FilteredPeople => {
	let items = [];
	const isPlayer = filters.role === 'Player';
	if (isPlayer) items = club.players;
	if (filters.role === 'Staff') items = club.staff;
	if (filters.role === 'Agent') items = club.agents;
	// const filteringAgents = filters.role === 'agent';
	const people = (items || []).filter(p => {
		if (!isPlayer && !forMulti(p.teamId, filters.team)) return false;
		if (!isPlayer && !forStatus(p, filters.status)) return false;
		if (!isPlayer && !forString(p.name, filters.name)) return false;
		if (!isPlayer && !forString(p.lastName, filters.lastName)) return false;
		if (!isPlayer && !forString(p.displayName, filters.displayName)) return false;
		if (!forString(p.mobilePhone, filters.mobilePhone)) return false;
		if (!forString(p.phone, filters.phone)) return false;
		if (!forString(p.email, filters.email)) return false;
		if (!forMultiEmpty(p.position, filters.position)) return false;
		if (!forAge(p.birthDate, filters.age)) return false;
		if (!forMultiEmpty(p.birthDate && p.birthDate.getFullYear(), filters.year)) return false;
		if (!forMultiEmpty(p.nationality, filters.nationality)) return false;
		if (!forDoc(p.documents, 'idCard', filters.idCard)) return false;
		if (!forDoc(p.documents, 'passport', filters.passport)) return false;
		if (!forValue(p.fixedWage, filters.salaryFrom, filters.salaryTo)) return false;
		// TODO gross salary
		if (!forValue(p.totalBonus, filters.bonusFrom, filters.bonusTo)) return false;
		if (!forValue(p.appearanceBonus, filters.appBonusFrom, filters.appBonusTo)) return false;
		if (!forValue(p.teamBonus, filters.teamBonusFrom, filters.teamBonusTo)) return false;
		if (!forValue(p.performanceBonus, filters.perfBonusFrom, filters.perfBonusTo)) return false;
		if (!forValue(p.appearanceFee, filters.appFeesFrom, filters.appFeesTo)) return false;
		if (!forValue(p.performanceFee, filters.perfFeesFrom, filters.perfFeesTo)) return false;
		// TODO contribution salary
		// TODO total gross salary
		return true;
	});
	return {
		type: filters.role,
		people
	};
};

export const initialFilters = (club: Club): SquadFilters => ({
	team: club.teams.map(({ id }) => id),
	season: club.clubSeasons.find(({ start, end }) => moment().isBetween(moment(start), moment(end), 'day'))?.id,
	status: ['active'],
	role: 'Player',
	position: [],
	age: [0, 100],
	year: [],
	nationality: [],
	salaryFrom: '',
	salaryTo: '',
	grossFrom: '',
	grossTo: '',
	bonusFrom: '',
	bonusTo: '',
	appBonusFrom: '',
	appBonusTo: '',
	perfBonusFrom: '',
	perfBonusTo: '',
	teamBonusFrom: '',
	teamBonusTo: '',
	appFeesFrom: '',
	appFeesTo: '',
	perfFeesFrom: '',
	perfFeesTo: '',
	contractNotarizationStatus: [
		'currentContractNotarized',
		'currentContractNOTNotarized',
		'inwardContractNotarized',
		'inwardContractNOTNotarized',
		'outwardContractNotarized',
		'outwardContractNOTNotarized'
	],
	origin: [],
	feeRange: [],
	wageRange: [],
	netValueFlag: true,
	contractExpiryYear: [],
	contractType: [],
	birthYear: []
});

export interface SquadFilters {
	team: string[];
	season: string;
	status: Array<'active' | 'archived'>;
	role: ContractPersonType;
	position: string[];
	age: number[];
	year: number[];
	nationality: string[];
	salaryFrom: string;
	salaryTo: string;
	grossFrom: string;
	grossTo: string;
	bonusFrom: string;
	bonusTo: string;
	appBonusFrom: string;
	appBonusTo: string;
	perfBonusFrom: string;
	perfBonusTo: string;
	teamBonusFrom: string;
	teamBonusTo: string;
	appFeesFrom: string;
	appFeesTo: string;
	perfFeesFrom: string;
	perfFeesTo: string;
	contractNotarizationStatus: Array<
		| 'outwardContractNotarized'
		| 'outwardContractNOTNotarized'
		| 'inwardContractNotarized'
		| 'inwardContractNOTNotarized'
		| 'currentContractNotarized'
		| 'currentContractNOTNotarized'
	>;
	origin: Array<'abroad' | 'abroadExtra' | 'domestic' | 'homegrown' | 'not set'>;
	feeRange: [];
	wageRange: [];
	netValueFlag: boolean;
	contractExpiryYear: number[];
	contractType: Array<ContractPersonStatus>;
	birthYear: number[];
}
