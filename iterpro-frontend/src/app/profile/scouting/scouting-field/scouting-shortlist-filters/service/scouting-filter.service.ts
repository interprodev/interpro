import { Injectable } from '@angular/core';
import { PlayerScouting } from '@iterpro/shared/data-access/sdk';
import * as moment from 'moment';
import {
	DEFAULT_SCOUTING_FILTER_STATUS,
	ScoutingFilter,
	ScoutingFilterLabel,
	ScoutingFilterOption,
	ScoutingFilterStatus
} from '../interfaces';

@Injectable({
	providedIn: 'root'
})
export class ScoutingFilterService {
	private filterFns = {
		age: (player: PlayerScouting, validValues: string[]) => validValues.includes(this.getAge(player.birthDate)),
		nationality: (player: PlayerScouting, validValues: string[]) => validValues.includes(player.nationality),
		fee: (player: PlayerScouting, validValues: string[]) =>
			validValues.includes(this.financialRange(player.feeFrom, player.feeTo)),
		wage: (player: PlayerScouting, validValues: string[]) =>
			validValues.includes(this.financialRange(player.wageFrom, player.wageTo))
	};

	constructor() {}

	parse(players: PlayerScouting[], previousStatus: ScoutingFilterStatus = DEFAULT_SCOUTING_FILTER_STATUS) {
		const options = this.getOptions(players);
		const age = { ...previousStatus.age, options: options.age.map(value => ({ age: value })) };
		const nationality = {
			...previousStatus.nationality,
			options: options.nationality.map(value => ({ nationality: value }))
		};
		const fee = { ...previousStatus.fee, options: options.fee.map(value => ({ fee: value })) };
		const wage = { ...previousStatus.wage, options: options.wage.map(value => ({ wage: value })) };
		return { ...DEFAULT_SCOUTING_FILTER_STATUS, age, nationality, fee, wage };
	}

	filter(players: PlayerScouting[], scoutingFilterStatus: ScoutingFilterStatus): PlayerScouting[] {
		let key: ScoutingFilterLabel;
		for (key in scoutingFilterStatus) {
			players = players.filter(
				player =>
					!scoutingFilterStatus[key] ||
					!scoutingFilterStatus[key].value ||
					this.filterByKey(player, key, scoutingFilterStatus[key])
			);
		}
		return players;
	}

	private getOptions(players: PlayerScouting[]) {
		const options = {
			age: [],
			nationality: [],
			fee: [],
			wage: []
		};

		players.forEach(({ birthDate, nationality, feeFrom, feeTo, wageFrom, wageTo }) => {
			this.pushUnique(options.age, this.getAge(birthDate));
			this.pushUnique(options.nationality, nationality);
			this.pushUnique(options.fee, this.financialRange(feeFrom, feeTo));
			this.pushUnique(options.wage, this.financialRange(wageFrom, wageTo));
		});

		options.age.sort();
		options.nationality.sort();
		options.fee.sort();
		options.wage.sort();

		return options;
	}

	private getAge(birthDate: Date): string {
		return moment().diff(moment(birthDate), 'year') + '';
	}

	private financialRange(from?: number, to?: number): string {
		if (isNaN(from) && isNaN(to)) {
			return '';
		}
		if (isNaN(from)) {
			from = to;
		}
		if (isNaN(to)) {
			to = from;
		}

		return from !== to ? from + ' - ' + to + 'M' : from + 'M';
	}

	private pushUnique(array: string[], value: string) {
		if (array.indexOf(value) < 0) {
			array.push(value);
		}
	}

	private filterByKey(
		player: PlayerScouting,
		key: ScoutingFilterLabel,
		{ value }: ScoutingFilter<Partial<ScoutingFilterOption>>
	) {
		return !!this.filterFns[key] && value.length > 0
			? this.filterFns[key](
					player,
					value.map(obj => obj[key])
			  )
			: true;
	}
}
