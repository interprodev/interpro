import { Injectable, inject } from '@angular/core';
import {
	AttributeCategory,
	ExtendedPlayerScouting,
	Player,
	PlayerAttribute,
	PlayerItem, ScoutingSettings,
} from '@iterpro/shared/data-access/sdk';
import { PRIMARIES, getDefaultCartesianConfig } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { UtilsService } from './utils.service';
import { findIndex } from 'lodash';

@Injectable({
	providedIn: 'root'
})
export class ScatterChartService {
	readonly #translateService = inject(TranslateService);
	readonly #utilsService = inject(UtilsService);

	getScatterChartData(
		players: PlayerItem[],
		categories: AttributeCategory[],
		metrics: string[],
		teamsPlayerAttributes: PlayerAttribute[],
		scoutingSettings: ScoutingSettings,
		currentPlayerId: string
	): ChartData {
		const values = movePlayerToLast(players, currentPlayerId).map(player =>
			this.getPlayerCategoryScores(player, categories, metrics, teamsPlayerAttributes, scoutingSettings)
		);
		return {
			datasets: [
				{
					data: values,
					type: categories.length === 3 ? 'bubble' : 'scatter',
					yAxisID: 'y'
				}
			]
		};
	}

	getScatterChartOptions(categories: AttributeCategory[], player: Player | ExtendedPlayerScouting): ChartOptions {
		const options = {
			...getDefaultCartesianConfig('linear')
		};
		options.scales.x = {
			...options.scales.x,
			min: 1,
			max: 100,
			bounds: 'ticks',
			ticks: {
				autoSkip: true,
				color: '#ddd'
				// callback: (value: number) => {
				// 	return value % 10 === 0 ? value : null;
				// }
			},
			title: {
				display: !!categories[0],
				text: this.#translateService.instant(`profile.attributes.${categories[0]}`),
				color: '#ddd'
			}
		};
		options.scales.y = {
			...options.scales.y,
			min: 1,
			max: 100,
			bounds: 'ticks',
			ticks: {
				autoSkip: false,
				color: '#ddd'
			},
			title: {
				display: !!categories[1],
				text: this.#translateService.instant(`profile.attributes.${categories[1]}`),
				color: '#ddd'
			}
		};

		options.plugins.annotation = {
			annotations: {
				vertical: {
					type: 'line',
					scaleID: 'x',
					value: 50,
					borderWidth: 2
				},
				horizontal: {
					type: 'line',
					scaleID: 'y',
					value: 50,
					borderWidth: 2
				}
			}
		};

		options.elements = {
			point: {
				radius: context => {
					if (categories.length < 3) {
						return context.raw.playerId === player.id ? 12 : 6;
					}
				},
				backgroundColor: ({ raw }) => (raw?.playerId === player.id ? PRIMARIES[1] : PRIMARIES[0])
			}
		};

		options.plugins.legend.display = false;

		options.plugins.tooltip = {
			mode: 'point',
			callbacks: {
				label: ({ raw }) =>
					`${raw.label}: ${this.#translateService.instant(`profile.attributes.${categories[0]}`)} ${
						raw.x
					} ${this.#translateService.instant(`profile.attributes.${categories[1]}`)} ${raw.y}${
						categories[2] ? ` ${this.#translateService.instant(`profile.attributes.${categories[2]}`)} ${raw.radius}` : ``
					}`
			}
		};

		return options;
	}

	private getPlayerCategoryScores(
		player: PlayerItem,
		categories: AttributeCategory[],
		metrics: string[],
		teamsPlayerAttributes: PlayerAttribute[],
		scoutingSettings: ScoutingSettings
	) {
		const averages = categories.map(category =>
			this.#utilsService.getPlayerCategoryScore(player, category, metrics, 'Player', teamsPlayerAttributes, scoutingSettings)
		);
		return {
			x: averages[0],
			y: averages[1],
			r: averages[2] / 1.5,
			radius: averages[2],
			label: player.displayName,
			playerId: player.id
		};
	}
}

function movePlayerToLast(players: PlayerItem[], specificId: string): PlayerItem[] {
	const index = findIndex(players, { id: specificId });

	if (index !== -1) {
		const playerToMove = players.splice(index, 1)[0]; // Remove the player from the array
		players.push(playerToMove); // Add the player to the end of the array
	}

	return players;
}
