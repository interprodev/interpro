import { Injectable, inject } from '@angular/core';
import {
	AttributeCategory, AttributesCompareItem,
	ExtendedPlayerScouting,
	Player,
	PlayerAttribute,
	PlayerItem, ScoutingSettings,
	AttributesAvgItems, attributeAvgCategory
} from '@iterpro/shared/data-access/sdk';
import {
	getColorFromCategory,
	getDefaultCartesianConfig
} from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { countBy } from 'lodash';
import { UtilsService } from './utils.service';

@Injectable({
	providedIn: 'root'
})
export class DistributionChartService {
	readonly #translateService = inject(TranslateService);
	readonly #utilsService = inject(UtilsService);

	getDistributionChartData(
		sourcePlayers: PlayerItem[],
		categories: AttributeCategory[],
		selectedMetrics: string[],
		teamsPlayerAttributes: PlayerAttribute[],
		scoutingSettings: ScoutingSettings
	): ChartData {
		const items: AttributesCompareItem[] = this.#utilsService.getPlayersCategoryScores(
			sourcePlayers,
			categories,
			selectedMetrics,
			teamsPlayerAttributes,
			scoutingSettings
		);
		return {
			labels: Array.from(new Array(100), (val, i) => i + 1),
			datasets: items.map(({ category, players }, i) => ({
				label: this.#translateService.instant(`profile.attributes.${category}`),
				data: this.getScoreOccurrences(players.map(p => p.value)),
				players: this.getDisplayNameOccurrences(players),
				backgroundColor: getColorFromCategory(category).primary,
				labelBackgroundColor: getColorFromCategory(category).secondary,
				type: 'bar',
				yAxisID: 'y'
			}))
		};
	}

	private getYValues(values: number[]): { [key: number]: number } {
		const scores = countBy(values);
		const yValues = Array.from(new Array(100), () => 0).reduce(
			(a, b, index) => ({ ...a, [index + 1]: scores[index + 1] || 0 }),
			{}
		);
		return yValues;
	}

	private getScoreOccurrences(values: number[]): number[] {
		return Object.values(this.getYValues(values));
	}

	private getDisplayNameOccurrences(
		players: { displayName: string | null; value: number; id: string }[]
	): { value: number; displayNames: string; playerIds: string[] }[] {
		return Object.entries(this.getYValues(players.map(p => p.value))).map(([value, count]) => ({
			value: Number(value),
			displayNames: players
				.filter(p => p.value === Number(value))
				.map(p => p.displayName)
				.join(', '),
			playerIds: players.filter(p => p.value === Number(value)).map(p => p.id)
		}));
	}

	getDistributionChartOptions(
		player: Player | ExtendedPlayerScouting,
		categories: AttributeCategory[],
		teamsPlayerAttributes: PlayerAttribute[],
		attributesAvg: AttributesAvgItems,
		playerCategoriesValues: { category: AttributeCategory; value: number }[]
	): ChartOptions {
		const options = {
			...getDefaultCartesianConfig()
		};
		options.scales.x = {
			...options.scales.x,
			min: 1,
			max: 100,
			bounds: 'ticks',
			ticks: {
				autoSkip: false,
				color: '#ddd'
			},
			title: {
				display: true,
				text: 'Score',
				color: '#ddd'
			}
		};

		options.scales.y = {
			...options.scales.y,
			ticks: {
				autoSkip: false,
				color: '#ddd'
			},
			title: {
				display: true,
				text: this.#translateService.instant('No. Players'),
				color: '#ddd'
			}
		};
		options.plugins.annotation = {
			annotations: playerCategoriesValues
				.map(({ category, value }, index) => ({
					[`${player.id}${category}`]: {
						borderDash: [5, 5],
						type: 'line',
						value: value -1, // remove 1 because without is not precise
						scaleID: 'x',
						borderColor: getColorFromCategory(category).secondary,
						borderWidth: 1,
						label: {
							display: true,
							backgroundColor: getColorFromCategory(category).secondary,
							content: `${player.displayName}: ${value} `,
							xAdjust: playerCategoriesValues[0].value > 50 ? -290 : +290,
							yAdjust: -100 - (index * 20),
							callout: {
								display: true,
								side: 10
							}
						}
					}
				}))
				.reduce((acc, curr) => ({ ...acc, ...curr }), {})
		};
		attributeAvgCategory.forEach((category: AttributeCategory, index: number) => {
			if (teamsPlayerAttributes && (categories || []).includes(category)) {
				options.plugins.annotation.annotations = {
					...options.plugins.annotation.annotations,
					[`${category}`]: {
						borderDash: [5, 5],
						type: 'line',
						value: attributesAvg[category] -1, // remove 1 because without is not precise
						scaleID: 'x',
						borderColor: getColorFromCategory(category).secondary,
						borderWidth: 1,
						label: {
							display: true,
							backgroundColor: getColorFromCategory(category).secondary,
							content: `${this.#translateService.instant('profile.gamestats.overall').toUpperCase()}: ${attributesAvg[category]}`,
							yAdjust: (index * 20)
						}
					}
				};
			}
		});
		options.plugins.tooltip = {
			mode: 'index',
			intersect: false,
			callbacks: {
				title: ([{ dataIndex }]) => {
					return `Score: ${dataIndex + 1}`;
				},
				label: (tooltipItem: { label: string; formattedValue: number; dataset: any; dataIndex: number }) => {
					const baseLabel = `${tooltipItem.label}: ${Number(tooltipItem.formattedValue).toFixed(0)}`;
					const numberOfPlayersLabel = `${this.#translateService.instant(`players`)}`;
					const playerDisplayNameLabels = tooltipItem?.dataset?.players.find(
						({ value }) => value === tooltipItem.dataIndex + 1
					)?.displayNames;
					return (
						`${baseLabel} ${numberOfPlayersLabel}` + ` ${playerDisplayNameLabels ? `(${playerDisplayNameLabels})` : ''}`
					);
				}
			}
		};
		return options;
	}
}
