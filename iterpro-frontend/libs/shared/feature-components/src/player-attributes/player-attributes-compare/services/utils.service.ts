import { Injectable } from '@angular/core';
import {
	AttributeCategory, AttributesCompareItem,
	MixedAttributeCategory,
	PlayerAttribute,
	PlayerAttributesEntry,
	PlayerItem, ScoutingSettings,
	Team
} from '@iterpro/shared/data-access/sdk';
import {
	completeWithAdditionalFields,
	getLiteralAvg, getMetricsValues,
	getNumericalAvg,
	getPlayerAttributesEntryValue, getTeamsPlayerAttributes
} from '@iterpro/shared/utils/common-utils';
import { last } from 'lodash';

@Injectable({
	providedIn: 'root'
})
export class UtilsService {
	constructor() {}

	getPlayersCategoryScores(
		players: PlayerItem[],
		categories: AttributeCategory[],
		selectedMetrics: string[],
		teamsPlayerAttributes: PlayerAttribute[],
		scoutingSettings: ScoutingSettings
	): AttributesCompareItem[] {
		return (categories || []).map((category: AttributeCategory) => {
			return {
				category: category,
				players: players.map(player => {
					return {
						id: player.id,
						displayName: player.displayName,
						value: this.getPlayerCategoryScore(
							player,
							category,
							selectedMetrics,
							'Player',
							teamsPlayerAttributes,
							scoutingSettings
						)
					};
				})
			};
		});
	}

	getAttributesAverage(
		players: PlayerItem[],
		category: AttributeCategory,
		metrics: string[],
		teams: Team[],
		scoutingSettings: ScoutingSettings
	): number {
		return Math.round(
			players
				.map(player => {
					const playerTeam = this.getPlayerTeam(teams, player);
					return this.getPlayerCategoryScore(
						player,
						category,
						metrics,
						'Player',
						getTeamsPlayerAttributes([playerTeam as Team]),
						scoutingSettings
					);
				})
				.reduce((a, b) => a + b, 0) / players.length
		);
	}

	getPlayerCategoryScore(
		player: PlayerItem,
		category: AttributeCategory,
		selectedMetrics: string[],
		playerType: 'Player' | 'PlayerScouting',
		teamsPlayerAttributes: PlayerAttribute[],
		scoutingSettings: ScoutingSettings
	): number {
		const selectedAttributeEntry: PlayerAttributesEntry = this.getPlayerAttributeEntry(
			player,
			playerType,
			teamsPlayerAttributes,
			scoutingSettings
		);
		if (!selectedAttributeEntry) return null;
		return Math.round(
			Number(this.getAvgValue(selectedAttributeEntry, category, selectedMetrics, 10, scoutingSettings))
		);
	}

	getPlayerAttributeEntry(
		player: PlayerItem,
		playerType: 'Player' | 'PlayerScouting',
		teamsPlayerAttributes: PlayerAttribute[],
		scoutingSettings: ScoutingSettings
	): PlayerAttributesEntry {
		const item = last(player?.attributes || []) as PlayerAttributesEntry;
		return completeWithAdditionalFields(
			item,
			teamsPlayerAttributes,
			playerType,
			scoutingSettings
		);
	}

	private getPlayerTeam(teams: Team[], player: PlayerItem): Team | undefined {
		return (teams || []).find(({ id }) =>id === player.teamId);
	}

	private getAvgValue(
		playerAttributesEntry: PlayerAttributesEntry,
		category: MixedAttributeCategory,
		selectedMetrics: string[],
		base: number,
		scoutingSettings: ScoutingSettings
	): string {
		if (category === 'potential') {
			return getLiteralAvg(playerAttributesEntry, 'potential');
		} else if (category === 'prognosis') {
			const value = getPlayerAttributesEntryValue(playerAttributesEntry, 'prognosisScore');
			return value ? String(value) : '-';
		}
		return getNumericalAvg(base, getMetricsValues(playerAttributesEntry, category, selectedMetrics), scoutingSettings);
	}
}
