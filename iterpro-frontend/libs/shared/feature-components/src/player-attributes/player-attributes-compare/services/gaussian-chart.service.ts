import { Injectable, inject } from '@angular/core';
import {
	AttributeCategory, AttributesCompareItem, ExtendedPlayerScouting,
	Player,
	PlayerAttribute,
	PlayerItem,
	ScoutingSettings,
} from '@iterpro/shared/data-access/sdk';
import { ADVANCED_COLORS, getColorFromCategory, getDefaultCartesianConfig } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { erf, mean, std } from 'mathjs';
import { UtilsService } from './utils.service';

@Injectable({
	providedIn: 'root'
})
export class GaussianChartService {
	readonly #translateService = inject(TranslateService);
	readonly #utilsService = inject(UtilsService);

	getGaussianChartData(
		currentPlayerId: string,
		players: PlayerItem[],
		categories: AttributeCategory[],
		metrics: string[],
		teamsPlayerAttributes: PlayerAttribute[],
		scoutingSettings: ScoutingSettings
	): ChartData {
		const values: AttributesCompareItem[] = this.#utilsService.getPlayersCategoryScores(
			players,
			categories,
			metrics,
			teamsPlayerAttributes,
			scoutingSettings
		);
		const xValues = Array.from(new Array(100), (val, i) => i + 1);
		return {
			labels: xValues,
			datasets: values.map(({ category, players }, i) => {
				const meanVal = mean(players.map(p => p.value));
				const stdVal = std(...players.map(p => p.value));
				const yValues = xValues.map(x => this.gaussian(x, meanVal, stdVal));
				const playerValue = players.find(({ id }) => id === currentPlayerId)?.value;
				// const percentile = this.calculatePercentile(playerValue, xValues, yValues);
				return {
					label: this.#translateService.instant(`profile.attributes.${category}`),
					data: yValues,
					borderColor: getColorFromCategory(category).primary,
					backgroundColor: getColorFromCategory(category).primary,
					labelBackgroundColor: getColorFromCategory(category).secondary,
					type: 'line',
					yAxisID: 'y',
					category,
					percentile: playerValue ? this.calculatePercentileWithERF(playerValue, meanVal, stdVal) : null,
					playerValue
				};
			})
		};
	}

	getGaussianChartOptions(player: Player | ExtendedPlayerScouting): ChartOptions {
		const options = {
			...getDefaultCartesianConfig()
		};
		options.scales.x = {
			...options.scales.x,
			min: 1,
			max: 100,
			bounds: 'ticks',
			ticks: {
				autoSkip: true,
				color: '#ddd'
			}
		};
		options.scales.y = {
			...options.scales.y,
			min: 0,
			bounds: 'ticks',
			ticks: {
				display: false,
				autoSkip: false,
				color: '#ddd'
			},
			grid: {
				display: false
			}
		};

		options.plugins.datalabels = {
			display: true,
			color: 'white',
			backgroundColor: context => {
				return context.dataset.labelBackgroundColor;
			},
			borderRadius: 4,
			anchor: 'end',
			align: 'end',
			font: {
				weight: 'bold'
			},
			offset: -30,
			formatter: (value, context) => {
				if (context.dataIndex == context.dataset.playerValue) {
					const isValid = !isNaN(context.dataset.percentile);
					const base = `${player.displayName}: ${context.dataset.playerValue}`;
					if (isValid) {
						return `${base} (${context.dataset.percentile.toFixed(0)} percentile)`;
					}
					return base;
				}
				return null;
			}
		};

		options.plugins.annotation = {
			annotations: {
				...Array.from(new Array(10), (val, i) => i * 10)
					.map(i => ({
						[i]: {
							type: 'line',
							scaleID: 'x',
							value: i,
							borderWidth: 0.5
						}
					}))
					.reduce((acc, curr) => ({ ...acc, ...curr }), {})
			}
		};
		options.elements = {
			point: {
				radius: 0
			}
		};

		options.plugins.tooltip = {
			enabled: false
		};

		return options;
	}

	private gaussian(x: number, mean: number, stdDev: number): number {
		if (stdDev === 0) {
			// Handle the case when there's only one player
			return x === mean ? 1 : 0;
		}
		return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-((x - mean) ** 2) / (2 * stdDev ** 2));
	}

	// Not accurate by ChatGPT, considering removing it
	private calculatePercentile(value: number, xValues: number[], yValues: number[]): number {
		let accumulatedArea = 0;
		for (let i = 0; i < xValues.length; i++) {
			if (xValues[i] >= value) {
				break;
			}
			const x0 = xValues[i];
			const x1 = xValues[i + 1];
			const y = yValues[i];
			accumulatedArea += (x1 - x0) * y;
		}

		return accumulatedArea * 100;
	}

	private calculatePercentileWithERF(value: number, mean: number, stdDev: number): number {
		const zScore = (value - mean) / stdDev;
		const percentile = 0.5 * (1 + erf(zScore / Math.sqrt(2)));
		return percentile * 100;
	}
}

/*		options.plugins.annotation = {
  annotations: {
    ...Array.from(new Array(10), (val, i) => i * 10)
      .map(i => ({
        [i]: {
          type: 'line',
          scaleID: 'xA',
          value: i,
          borderWidth: 0.5
        }
      }))
      .reduce((acc, curr) => ({ ...acc, ...curr }), {}),
    ...playerCategoriesValues
      .map(({ category, value }, i) => ({
        [`${category}`]: {
          borderDash: [20, 5],
          type: 'line',
          value,
          scaleID: 'xA',
          borderColor: advanced[i],
          borderWidth: 2,
          label: {
            display: true,
            content: `${value} (${data.datasets
              .find(({ category: cat }) => category === cat)
              .percentile.toFixed(0)} percentile)`,
            yAdjust: i * 30 // Adjust this value as needed
          }
        }
      }))
      .reduce((acc, curr) => ({ ...acc, ...curr }), {})
  }
};*/

