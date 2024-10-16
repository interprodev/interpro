import { Injectable } from '@angular/core';
import { DeviceMetricDescriptor, IBaseEtlTeamService, TeamStat, Threshold } from '@iterpro/shared/data-access/sdk';

@Injectable({
	providedIn: 'root'
})
export class BaseEtlTeamThirdPartyService implements IBaseEtlTeamService {
	private metricsMapping: DeviceMetricDescriptor[];

	getTeamStatsFromCsv(): TeamStat | null {
		return null;
	}

	getMatchResultFields(): any {
		return null;
	}

	constructor() {
		this.metricsMapping = [];

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Matches',
				metricName: 'matches',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Goals',
				metricName: 'goals',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Assists',
				metricName: 'assists',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Shots',
				metricName: 'shots',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Head Shots',
				metricName: 'headShots',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Yellow Cards',
				metricName: 'yellowCards',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Red Cards',
				metricName: 'redCards',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Direct Red Cards',
				metricName: 'directRedCards',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Penalties',
				metricName: 'penalties',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Linkup Plays',
				metricName: 'linkupPlays',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Clean Sheets',
				metricName: 'cleanSheets',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Duels',
				metricName: 'duels',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Duels Won',
				metricName: 'duelsWon',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Defensive Duels',
				metricName: 'defensiveDuels',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Defensive Duels Won',
				metricName: 'defensiveDuelsWon',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Offensive Duels',
				metricName: 'offensiveDuels',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Offensive Duels Won',
				metricName: 'offensiveDuelsWon',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Aerial Duels',
				metricName: 'aerialDuels',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Aerial Duels Won',
				metricName: 'aerialDuelsWon',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Fouls',
				metricName: 'fouls',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Offsides',
				metricName: 'offsides',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Passes',
				metricName: 'passes',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Successful Passes',
				metricName: 'successfulPasses',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Smart Passes',
				metricName: 'smartPasses',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Successful Smart Passes',
				metricName: 'successfulSmartPasses',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Passes To Final Third',
				metricName: 'passesToFinalThird',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Successful Passes To Final Third',
				metricName: 'successfulPassesToFinalThird',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Crosses',
				metricName: 'crosses',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Successful Crosses',
				metricName: 'successfulCrosses',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Forward Passes',
				metricName: 'forwardPasses',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Successful Forward Passes',
				metricName: 'successfulForwardPasses',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Back Passes',
				metricName: 'backPasses',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Successful Back Passes',
				metricName: 'successfulBackPasses',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Through Passes',
				metricName: 'throughPasses',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Successful Through Passes',
				metricName: 'successfulThroughPasses',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Key Passes',
				metricName: 'keyPasses',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Successful Key Passes',
				metricName: 'successfulKeyPasses',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Vertical Passes',
				metricName: 'verticalPasses',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Successful Vertical Passes',
				metricName: 'successfulVerticalPasses',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Long Passes',
				metricName: 'longPasses',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Successful Long Passes',
				metricName: 'successfulLongPasses',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Dribbles',
				metricName: 'dribbles',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Successful Dribbles',
				metricName: 'successfulDribbles',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Interceptions',
				metricName: 'interceptions',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Defensive Actions',
				metricName: 'defensiveActions',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Successful Defensive Actions',
				metricName: 'successfulDefensiveActions',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Attacking Actions',
				metricName: 'attackingActions',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Successful Attacking Actions',
				metricName: 'successfulAttackingActions',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Free Kicks',
				metricName: 'freeKicks',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Free Kicks On Target',
				metricName: 'freeKicksOnTarget',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Direct Free Kicks',
				metricName: 'directFreeKicks',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Direct Free Kicks On Target',
				metricName: 'directFreeKicksOnTarget',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Corners',
				metricName: 'corners',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Successful Penalties',
				metricName: 'successfulPenalties',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Successful Linkup Plays',
				metricName: 'successfulLinkupPlays',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Accelerations',
				metricName: 'accelerations',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Pressing Duels',
				metricName: 'pressingDuels',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Pressing Duels Won',
				metricName: 'pressingDuelsWon',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Loose Ball Duels',
				metricName: 'looseBallDuels',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Loose Ball Duels Won',
				metricName: 'looseBallDuelsWon',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Missed Balls',
				metricName: 'missedBalls',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Shot Assists',
				metricName: 'shotAssists',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Shot On Target Assists',
				metricName: 'shotOnTargetAssists',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Recoveries',
				metricName: 'recoveries',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Opponent Half Recoveries',
				metricName: 'opponentHalfRecoveries',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Dangerous Opponent Half Recoveries',
				metricName: 'dangerousOpponentHalfRecoveries',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Losses',
				metricName: 'losses',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Own Half Losses',
				metricName: 'ownHalfLosses',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Dangerous Own Half Losses',
				metricName: 'dangerousOwnHalfLosses',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Field Aerial Duels',
				metricName: 'fieldAerialDuels',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'Field Aerial Duels Won',
				metricName: 'fieldAerialDuelsWon',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'GK Exits',
				metricName: 'gkExits',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'GK Successful Exits',
				metricName: 'gkSuccessfulExits',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'GK Aerial Duels',
				metricName: 'gkAerialDuels',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'GK Aerial Duels Won',
				metricName: 'gkAerialDuelsWon',
				defaultValue: 0
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				algo: false,
				metricLabel: 'GK Saves',
				metricName: 'gkSaves',
				defaultValue: 0
			})
		);

		this.metricsMapping = this.metricsMapping.map(val => {
			val.metricName = val.metricName.replace(/\./g, '_');
			return val;
		});
	}

	getDefaultThresholds(): Threshold[] {
		let thresholds: Threshold[] = [];
		for (const metric of this.metricsMapping) {
			if (!metric.algo) {
				const threhsold = new Threshold();
				threhsold.name = metric.metricName;
				threhsold.customValue = metric.defaultValue;
				threhsold.hidden = false;
				thresholds.push(threhsold);
			}
		}

		thresholds = thresholds.map(val => {
			val.name = val.name.replace(/\./g, '_');
			return val;
		});

		return thresholds;
	}

	getMetricLabel(metricName: string): string {
		const metric = this.metricsMapping.find(x => x.metricName === metricName);
		return metric ? metric.metricLabel : metricName;
	}

	getMetricsMapping(): DeviceMetricDescriptor[] {
		return this.metricsMapping;
	}
}
