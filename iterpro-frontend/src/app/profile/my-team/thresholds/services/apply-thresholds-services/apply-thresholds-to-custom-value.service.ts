import { Injectable, inject } from '@angular/core';
import { CustomerTeamSettings, Player, PlayerApi, Team } from '@iterpro/shared/data-access/sdk';
import { ErrorService } from '@iterpro/shared/utils/common-utils';
import { first } from 'rxjs/operators';
import { ThresholdActiveFormat, ThresholdsToUpdate } from '../../interfaces';

@Injectable({
	providedIn: 'root'
})
export class ApplyThresholdsToCustomValueService {
	readonly #playerApi = inject(PlayerApi);
	readonly #errorService = inject(ErrorService);

	getUpdatedFinancialThresholds({ _thresholdsFinancial }: Player): ThresholdsToUpdate {
		const thresholdsToUpdate: ThresholdsToUpdate = {
			type: 'financial',
			category: '_thresholdsFinancial',
			thresholds: _thresholdsFinancial.filter(Boolean)
		};
		return thresholdsToUpdate;
	}

	getUpdatedTestThresholds({ _thresholdsTests }: Player, { metricsTests }: Team): ThresholdsToUpdate {
		const activeMetrics = metricsTests.map(({ testName, metricName }) => `${testName}_${metricName}`);
		const thresholds = _thresholdsTests.filter(
			threshold => !!threshold && activeMetrics.includes(`${threshold.name}_${threshold.metric}`)
		);
		const thresholdsToUpdate: ThresholdsToUpdate = { type: 'test', category: '_thresholdsTests', thresholds };
		return thresholdsToUpdate;
	}

	getUpdatedTacticalThresholds(
		format: ThresholdActiveFormat,
		{ _thresholdsPlayer }: Player,
		{ metricsIndividualTactical }: CustomerTeamSettings
	): ThresholdsToUpdate {
		const thresholds = _thresholdsPlayer.filter(
			threshold => !isNaN(threshold[format]) && metricsIndividualTactical.includes(threshold.name.replace(/\./g, '_'))
		);
		const thresholdsToUpdate: ThresholdsToUpdate = {
			type: 'tactical',
			category: '_thresholdsPlayer',
			thresholds,
			thresholdFormat: format
		};
		return thresholdsToUpdate;
	}

	getUpdatedGpsThresholds(
		format: ThresholdActiveFormat,
		gpsPerDay: any[],
		{ metricsPerformance }: CustomerTeamSettings
	): ThresholdsToUpdate {
		const thresholds = gpsPerDay.filter(
			threshold => !isNaN(threshold[format]) && metricsPerformance.includes(threshold.name.replace(/\./g, '_'))
		);
		const thresholdsToUpdate: ThresholdsToUpdate = {
			type: 'gps',
			category: '_thresholds',
			thresholds,
			thresholdFormat: format
		};
		return thresholdsToUpdate;
	}

	triggerThresholdsUpdate(teamId: string, seasonId: string, playersIds: string[]) {
		this.#playerApi
			.triggerThresholdsUpdate(teamId, seasonId, playersIds)
			.pipe(first())
			.subscribe({
				error: (error: Error) => {
					this.#errorService.handleError(error);
				}
			});
	}
}
