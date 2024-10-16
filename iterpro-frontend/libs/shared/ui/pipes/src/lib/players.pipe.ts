import { Pipe, PipeTransform } from '@angular/core';
import { ExtendedPlayerScouting, Player, PlayerScouting } from '@iterpro/shared/data-access/sdk';
import * as moment from 'moment';

const filterByTerm = (player: Player, term: string, filters: any): boolean =>
	(player.name || (player as any).firstName || '').toLowerCase().indexOf(term.toLowerCase()) !== -1 ||
	(player.displayName || '').toLowerCase().indexOf(term.toLowerCase()) !== -1 ||
	(player.lastName || '').toLowerCase().indexOf(term.toLowerCase()) !== -1;

const filterByNationality = (player: Player, term: string, filters: any): boolean =>
	filters.nationalities.find((y: any) => player.nationality === y);

const filterByFoot = (player: Player, term: string, filters: any): boolean =>
	filters.feets.find((y: any) => player.foot === y);

const filterByPosition = (player: Player, term: string, filters: any): boolean =>
	filters.positions.find((y: any) => player.position === y) ||
	filters.positions.find((y: any) => player.position2 === y) ||
	filters.positions.find((y: any) => player.position3 === y);

const filterByYear = (player: Player, term: string, filters: any): boolean => {
	if (player.birthDate) {
		const year = moment(player.birthDate).format('YYYY');
		return filters.years.find((y: any) => year === y);
	}
	return false;
};

const filterByRange = (key: string, player: any, [min, max]: [number, number]): boolean =>
	player[key] >= min && player[key] <= max;

const filterByHeight = (player: Player, term: string, filters: any): boolean =>
	filterByRange('height', player, filters.height);

const filterByWeight = (player: Player, term: string, filters: any): boolean =>
	filterByRange('weight', player, filters.weight);

const filterByShoeSize = (player: Player, term: string, filters: any): boolean =>
	filterByRange('shoeSize', player, filters.shoeSize);

const filterByReadiness = (player: Player, term: string, filters: any): boolean => {
	const [min, max] = filters.readiness;
	const readiness = player.goScores && player.goScores.length ? player.goScores[0].score : 0;
	return readiness >= min && readiness <= max;
};

export const transform = (players: Player[], searchTerm: string, filters: any = {}) => {
	if (!players) return players;
	const searchFilters: ((p: Player, term: string, filters: any) => boolean)[] = [];
	if (searchTerm) searchFilters.push(filterByTerm);
	if (filters.nationalities && filters.nationalities.length) searchFilters.push(filterByNationality);
	if (filters.feets && filters.feets.length) searchFilters.push(filterByFoot);
	if (filters.positions && filters.positions.length) searchFilters.push(filterByPosition);
	if (filters.years && filters.years.length) searchFilters.push(filterByYear);
	if (filters.height) searchFilters.push(filterByHeight);
	if (filters.weight) searchFilters.push(filterByWeight);
	if (filters.shoeSize) searchFilters.push(filterByShoeSize);
	if (filters.readiness) searchFilters.push(filterByReadiness);
	return searchFilters.reduce((d, f) => d.filter(p => f(p, searchTerm, filters)), players);
};

@Pipe({
	standalone: true,
	name: 'playersPipe'
})
export class PlayersPipe implements PipeTransform {
	transform(players: any[], searchTerm: string, filters: any = {}): any[] {
		return transform(players, searchTerm, filters);
	}
}

@Pipe({
	standalone: true,
	name: 'playersNotArchivedPipe'
})
export class PlayersNotArchivedPipe implements PipeTransform {
	transform(players: (Player | PlayerScouting | ExtendedPlayerScouting)[]): (Player | PlayerScouting | ExtendedPlayerScouting)[] {
		return (players || []).filter(({ archived }) => !archived);
	}
}
