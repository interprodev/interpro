import { inject, Injectable } from '@angular/core';
import { Drill, Team } from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { sortBy, uniqBy } from 'lodash';
import {
	ConstantService,
	DrillsListMapping,
	PHYSICAL_GOALS,
	TACTICAL_GOALS,
	THEME_CONSTANTS
} from '@iterpro/shared/utils/common-utils';
import { DrillsMapping } from './drills-mapping.interface';
import { areAllDrillFiltersResetted, getPitchSizeLabel, getPitchSizeValues } from '@iterpro/manager/drills/utils';
import { DrillFilters } from '@iterpro/manager/drills/data-access';

@Injectable({
	providedIn: 'root'
})
export class DrillsMappingService {
	#translateService = inject(TranslateService);
	#drillConstantService = inject(ConstantService);

	public getDrillsMapping(team: Team): DrillsMapping {
		return {
			themes: this.getDrillThemes(team),
			tacticalGoals: this.getTacticalGoals(team),
			technicalGoals: this.getTechnicalGoals(team),
			physicalGoals: this.getPhysicalGoals(team),
			ageGroups: this.getDrillAgeGroups(),
			goals: [...this.getTacticalGoals(team), ...this.getTechnicalGoals(team), ...this.getPhysicalGoals(team)]
		}
	}

	private getDrillThemes(team: Team): SelectItem[] {
		const { drillThemes } = team;
		let activeDrillThemes = (drillThemes || [])?.filter(({ active }) => active);
		const all = uniqBy([...activeDrillThemes, ...THEME_CONSTANTS], 'value');
		return all.map(({ custom, label, value, active }) => ({
			label: custom ? label : this.#translateService.instant(label),
			value,
			disabled: !active
		}));
	}

	private getTacticalGoals(team: Team): SelectItem[] {
		const { drillTacticalGoals } = team;
		const all = uniqBy([...(drillTacticalGoals || []), ...TACTICAL_GOALS], 'value');
		return all.map(({ custom, label, value, active }) => ({
			label: custom ? label : this.#translateService.instant(label),
			value,
			disabled: !active
		}));
	}

	private getTechnicalGoals(team: Team): SelectItem[] {
		const { drillTechnicalGoals } = team;
		const allAttributes = (drillTechnicalGoals || []).filter(({ category }) => category !== 'attitude');
		return sortBy(
			[
				...allAttributes.map(({ category, label, value, active }) => ({
					label: `${category === 'offensive' ? 'ATT' : 'DEF'} - ${this.#translateService.instant(label)}`,
					value,
					disabled: !active
				}))
			],
			['disabled', 'label']
		);
	}

	private getPhysicalGoals(team: Team): SelectItem[] {
		const { drillPhysicalGoals } = team;
		const all = uniqBy([...(drillPhysicalGoals || []), ...PHYSICAL_GOALS], 'value');
		return all.map(({ custom, label, value, active }) => ({
			label: custom ? label : this.#translateService.instant(label),
			value,
			disabled: !active
		}));
	}

	private getDrillAgeGroups(): SelectItem[] {
		return this.#drillConstantService
			.getAgeGroups()
			.map(({ label, value }) => ({ label: this.#translateService.instant(label as string), value }));
	}

	private getThemeLabel(themeKey: string, drillThemes: SelectItem[]): string {
		const item = drillThemes?.find(({ value }) => value === themeKey);
		return item && item?.label ? item.label : themeKey;
	}

	public getDrillFiltersListMapping(drills: Drill[], drillThemes: SelectItem[]): DrillsListMapping {
		return drills.reduce((accumulator: DrillsListMapping, drillDetail: Drill) => {
			if (drillDetail) {
				if (drillDetail?.duration && !accumulator.durationList.map(a => a.value).includes(drillDetail.duration)) {
					accumulator.durationList.push({ label: String(drillDetail.duration), value: drillDetail.duration });
				}
				if (drillDetail?.players && !accumulator.numberOfPlayerList.map(a => a.value).includes(drillDetail.players)) {
					accumulator.numberOfPlayerList.push({ label: String(drillDetail.players), value: drillDetail.players });
				}
				if (drillDetail?.theme && !accumulator.drillThemeForFilter.map(a => a.value).includes(drillDetail.theme)) {
					accumulator.drillThemeForFilter.push({ label: this.getThemeLabel(drillDetail.theme, drillThemes), value: drillDetail.theme });
				}
				if (drillDetail?.pitchSizeX && drillDetail?.pitchSizeY) {
					const pitchSizeLabel = getPitchSizeLabel(
						drillDetail.pitchSizeX,
						drillDetail.pitchSizeY,
						this.#translateService.instant('drills.pitchSize.width'),
						this.#translateService.instant('drills.pitchSize.length')
					);
					if (!accumulator.pitchSizeList.map(a => a.value).includes(pitchSizeLabel)) {
						accumulator.pitchSizeList.push({ label: pitchSizeLabel, value: pitchSizeLabel });
					}
				}
			}
			return accumulator;
		}, {
			durationList: [],
			numberOfPlayerList: [],
			drillThemeForFilter: [],
			pitchSizeList: []
		});
	}

	getDrillAllGoals(drill: Drill): string[] {
		return [...(drill?.tacticalGoals || []), ...(drill?.technicalGoals || []), ...(drill?.physicalGoals || [])];
	}

	public applyDrillFilters(event: DrillFilters, drillListBackup: Drill[]): Drill[] {
		if (areAllDrillFiltersResetted(event)) {
			return drillListBackup;
		} else {
			return drillListBackup
				.filter((drillDetail: Drill) => {
					const themeCondition = event.theme.length > 0 && event.theme.includes(drillDetail.theme);
					const tacticalGoalCondition =
						drillDetail &&
						event?.tacticalGoal &&
						event.tacticalGoal.find(value => drillDetail?.tacticalGoals && drillDetail.tacticalGoals?.includes(value));
					const technicalGoalCondition =
						drillDetail &&
						event?.technicalGoal &&
						event.technicalGoal.find(value => drillDetail?.technicalGoals && drillDetail.technicalGoals?.includes(value));
					const physicalGoalCondition =
						drillDetail &&
						event?.physicalGoal &&
						event.physicalGoal.find(value => drillDetail?.physicalGoals && drillDetail.physicalGoals?.includes(value));
					const goalCondition = drillDetail && event?.goal && event.goal.find(value => this.getDrillAllGoals(drillDetail)?.includes(value));
					const durationCondition = drillDetail && event.duration.find(value => drillDetail?.duration && drillDetail.duration === value);
					const numberOfPlayersCondition =
						drillDetail && event.numberOfPlayers.find(value => drillDetail?.players && drillDetail.players === value);
					const pitchSizeCondition =
						drillDetail &&
						drillDetail?.pitchSizeX &&
						drillDetail?.pitchSizeY &&
						event.pitchSize.find(value => {
							const pitchSizeValues = getPitchSizeValues(
								value,
								this.#translateService.instant('drills.pitchSize.width'),
								this.#translateService.instant('drills.pitchSize.length')
							);
							return drillDetail.pitchSizeX === pitchSizeValues.x && drillDetail.pitchSizeY === pitchSizeValues.y;
						});
					const ageGroupCondition = drillDetail && event.ageGroup.find(value => drillDetail?.ageGroup && drillDetail.ageGroup === value);
					return (
						themeCondition ||
						goalCondition ||
						tacticalGoalCondition ||
						technicalGoalCondition ||
						physicalGoalCondition ||
						durationCondition ||
						numberOfPlayersCondition ||
						pitchSizeCondition ||
						ageGroupCondition
					);
				});
		}
	}
}
