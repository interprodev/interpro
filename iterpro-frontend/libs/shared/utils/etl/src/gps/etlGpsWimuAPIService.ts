import { Injectable } from '@angular/core';
import {
	DeviceMetricDescriptor,
	GpsProviderMapping,
	SessionPlayerData,
	Team,
	Threshold
} from '@iterpro/shared/data-access/sdk';
import { EtlDateDurationService } from '../etlDateDurationService';
import { BaseEtlGpsService } from './baseEtlGpsService';

@Injectable({
	providedIn: 'root'
})
export class EtlGpsWimuAPIService implements BaseEtlGpsService {
	private metricsMapping: DeviceMetricDescriptor[];

	constructor(private etlDateService: EtlDateDurationService, private currentTeam: Team) {
		this.metricsMapping = [
			new DeviceMetricDescriptor({
				metricLabel: 'distance_distance',
				algo: false,
				metricName: 'distance_distance',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'distance_distanceMin',
				algo: false,
				metricName: 'distance_distanceMin',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'distance_explosiveDistance',
				algo: false,
				metricName: 'distance_explosiveDistance',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'distance_explosiveDistanceMin',
				algo: false,
				metricName: 'distance_explosiveDistanceMin',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'distance_hibd',
				algo: false,
				metricName: 'distance_hibd',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'distance_hibdMin',
				algo: false,
				metricName: 'distance_hibdMin',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'distance_HSRRelDistance',
				algo: false,
				metricName: 'distance_HSRRelDistance',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'distance_HSRRelDistanceMin',
				algo: false,
				metricName: 'distance_HSRRelDistanceMin',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'distance_HSRRelCount',
				algo: false,
				metricName: 'distance_HSRRelCount',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'distance_percentageHSRRel',
				algo: false,
				metricName: 'distance_percentageHSRRel',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'distance_HSRAbsDistance',
				algo: false,
				metricName: 'distance_HSRAbsDistance',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'distance_HSRAbsMin',
				algo: false,
				metricName: 'distance_HSRAbsMin',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'distance_HSRAbsCount',
				algo: false,
				metricName: 'distance_HSRAbsCount',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'distance_percentageHSRAbs',
				algo: false,
				metricName: 'distance_percentageHSRAbs',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'distance_hsrAbsRep',
				algo: false,
				metricName: 'distance_hsrAbsRep',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'distance_hsrRelRep',
				algo: false,
				metricName: 'distance_hsrRelRep',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'distance_hsrRelDuration',
				algo: false,
				metricName: 'distance_hsrRelDuration',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'distance_hsrAbsDuration',
				algo: false,
				metricName: 'distance_hsrAbsDuration',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_accelerations',
				algo: false,
				metricName: 'accelerations_accelerations',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_decelerations',
				algo: false,
				metricName: 'accelerations_decelerations',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_extAccels',
				algo: false,
				metricName: 'accelerations_extAccels',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_accelerationsMin',
				algo: false,
				metricName: 'accelerations_accelerationsMin',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_decelerationsMin',
				algo: false,
				metricName: 'accelerations_decelerationsMin',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_maxAcceleration',
				algo: false,
				metricName: 'accelerations_maxAcceleration',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_maxDeceleration',
				algo: false,
				metricName: 'accelerations_maxDeceleration',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_avgAcc',
				algo: false,
				metricName: 'accelerations_avgAcc',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_avgDec',
				algo: false,
				metricName: 'accelerations_avgDec',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_diffAccDec',
				algo: false,
				metricName: 'accelerations_diffAccDec',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_highIntensityAccAbsCounter',
				algo: false,
				metricName: 'accelerations_highIntensityAccAbsCounter',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_highIntensityDecAbsCounter',
				algo: false,
				metricName: 'accelerations_highIntensityDecAbsCounter',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_highIntensityAccAbsDistance',
				algo: false,
				metricName: 'accelerations_highIntensityAccAbsDistance',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_highIntensityDecAbsDistance',
				algo: false,
				metricName: 'accelerations_highIntensityDecAbsDistance',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_highIntensityAccAbsMs',
				algo: false,
				metricName: 'accelerations_highIntensityAccAbsMs',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_highIntensityDecAbsMs',
				algo: false,
				metricName: 'accelerations_highIntensityDecAbsMs',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_highIntensityAccRelCounter',
				algo: false,
				metricName: 'accelerations_highIntensityAccRelCounter',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_highIntensityAccRelMs',
				algo: false,
				metricName: 'accelerations_highIntensityAccRelMs',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_highIntensityAccRelDistance',
				algo: false,
				metricName: 'accelerations_highIntensityAccRelDistance',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_highIntensityDecRelCounter',
				algo: false,
				metricName: 'accelerations_highIntensityDecRelCounter',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_highIntensityDecRelMs',
				algo: false,
				metricName: 'accelerations_highIntensityDecRelMs',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_highIntensityDecRelDistance',
				algo: false,
				metricName: 'accelerations_highIntensityDecRelDistance',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_distanceAcceleration',
				algo: false,
				metricName: 'accelerations_distanceAcceleration',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_distanceDeceleration',
				algo: false,
				metricName: 'accelerations_distanceDeceleration',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_accelerationLoad',
				algo: false,
				metricName: 'accelerations_accelerationLoad',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_accelerationDensity',
				algo: false,
				metricName: 'accelerations_accelerationDensity',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_accLoad',
				algo: false,
				metricName: 'accelerations_accLoad',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_accDensity',
				algo: false,
				metricName: 'accelerations_accDensity',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_decLoad',
				algo: false,
				metricName: 'accelerations_decLoad',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations_decDensity',
				algo: false,
				metricName: 'accelerations_decDensity',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'heartRate_hrDuration',
				algo: false,
				metricName: 'heartRate_hrDuration',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'heartRate_max',
				algo: false,
				metricName: 'heartRate_max',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'heartRate_avgHR',
				algo: false,
				metricName: 'heartRate_avgHR',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'heartRate_percentageMax',
				algo: false,
				metricName: 'heartRate_percentageMax',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'heartRate_highIntensityHRAbsCounter',
				algo: false,
				metricName: 'heartRate_highIntensityHRAbsCounter',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'heartRate_highIntensityHRAbsMs',
				algo: false,
				metricName: 'heartRate_highIntensityHRAbsMs',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'heartRate_highIntensityHRAbsDistance',
				algo: false,
				metricName: 'heartRate_highIntensityHRAbsDistance',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'heartRate_highIntensityHRRelCounter',
				algo: false,
				metricName: 'heartRate_highIntensityHRRelCounter',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'heartRate_highIntensityHRRelMs',
				algo: false,
				metricName: 'heartRate_highIntensityHRRelMs',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'heartRate_highIntensityHRRelDistance',
				algo: false,
				metricName: 'heartRate_highIntensityHRRelDistance',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_sprintDur',
				algo: false,
				metricName: 'sprint_sprintDur',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_abs',
				algo: false,
				metricName: 'sprint_abs',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_nSprints',
				algo: false,
				metricName: 'sprint_nSprints',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_distance',
				algo: false,
				metricName: 'sprint_distance',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_distanceRelative',
				algo: false,
				metricName: 'sprint_distanceRelative',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_absAvgDuration',
				algo: false,
				metricName: 'sprint_absAvgDuration',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_avgDuration',
				algo: false,
				metricName: 'sprint_avgDuration',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_maxSpeed',
				algo: false,
				metricName: 'sprint_maxSpeed',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_avgSpeed',
				algo: false,
				metricName: 'sprint_avgSpeed',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_minSprints',
				algo: false,
				metricName: 'sprint_minSprints',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_avgRSA',
				algo: false,
				metricName: 'sprint_avgRSA',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_rsaTotal',
				algo: false,
				metricName: 'sprint_rsaTotal',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_avgRSA20',
				algo: false,
				metricName: 'sprint_avgRSA20',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_maxRepetitions',
				algo: false,
				metricName: 'sprint_maxRepetitions',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_maxDistance',
				algo: false,
				metricName: 'sprint_maxDistance',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_maxDuration',
				algo: false,
				metricName: 'sprint_maxDuration',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_absRepetitions',
				algo: false,
				metricName: 'sprint_absRepetitions',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_relRepetitions',
				algo: false,
				metricName: 'sprint_relRepetitions',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_maxAvgDuration',
				algo: false,
				metricName: 'sprint_maxAvgDuration',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_maxAvgSpeed',
				algo: false,
				metricName: 'sprint_maxAvgSpeed',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_maxCounter',
				algo: false,
				metricName: 'sprint_maxCounter',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_absDuration',
				algo: false,
				metricName: 'sprint_absDuration',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'sprint_relDuration',
				algo: false,
				metricName: 'sprint_relDuration',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'horizontalImpacts_impacts',
				algo: false,
				metricName: 'horizontalImpacts_impacts',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'horizontalImpacts_highIntensityHorImpactCounter',
				algo: false,
				metricName: 'horizontalImpacts_highIntensityHorImpactCounter',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'horizontalImpacts_highIntensityHorImpactMs',
				algo: false,
				metricName: 'horizontalImpacts_highIntensityHorImpactMs',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'horizontalImpacts_highIntensityHorImpactDistance',
				algo: false,
				metricName: 'horizontalImpacts_highIntensityHorImpactDistance',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_steps',
				algo: false,
				metricName: 'steps_steps',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_stepsMin',
				algo: false,
				metricName: 'steps_stepsMin',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_stepBalance',
				algo: false,
				metricName: 'steps_stepBalance',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_nJumps',
				algo: false,
				metricName: 'steps_nJumps',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_jumpsMin',
				algo: false,
				metricName: 'steps_jumpsMin',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_avgTakeOff',
				algo: false,
				metricName: 'steps_avgTakeOff',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_avgLanding',
				algo: false,
				metricName: 'steps_avgLanding',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_highIntensityTakeoffCounter',
				algo: false,
				metricName: 'steps_highIntensityTakeoffCounter',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_highIntensityLandingCounter',
				algo: false,
				metricName: 'steps_highIntensityLandingCounter',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_highIntensityTakeoffMin',
				algo: false,
				metricName: 'steps_highIntensityTakeoffMin',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_highIntensityTakeoffDistance',
				algo: false,
				metricName: 'steps_highIntensityTakeoffDistance',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_highIntensityLandingMin',
				algo: false,
				metricName: 'steps_highIntensityLandingMin',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_highIntensityLandingDistance',
				algo: false,
				metricName: 'steps_highIntensityLandingDistance',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_freeJumpCounter',
				algo: false,
				metricName: 'steps_freeJumpCounter',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_freeJumpAvgTakeOff',
				algo: false,
				metricName: 'steps_freeJumpAvgTakeOff',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_freeJumpAvgLanding',
				algo: false,
				metricName: 'steps_freeJumpAvgLanding',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_freeJumpHighTakeOffCounter',
				algo: false,
				metricName: 'steps_freeJumpHighTakeOffCounter',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_freeJumpHighLandingCounter',
				algo: false,
				metricName: 'steps_freeJumpHighLandingCounter',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_stepBalanceLPerc',
				algo: false,
				metricName: 'steps_stepBalanceLPerc',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_stepBalanceRPerc',
				algo: false,
				metricName: 'steps_stepBalanceRPerc',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_stepV2Count',
				algo: false,
				metricName: 'steps_stepV2Count',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_stepV2Balance',
				algo: false,
				metricName: 'steps_stepV2Balance',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_stepV2BalanceLPerc',
				algo: false,
				metricName: 'steps_stepV2BalanceLPerc',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'steps_stepV2BalanceRPerc',
				algo: false,
				metricName: 'steps_stepV2BalanceRPerc',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'ftt_fftDuration',
				algo: false,
				metricName: 'ftt_fftDuration',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'ftt_maxFreq',
				algo: false,
				metricName: 'ftt_maxFreq',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'ftt_avgFreq',
				algo: false,
				metricName: 'ftt_avgFreq',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'ftt_hzMaxAcc',
				algo: false,
				metricName: 'ftt_hzMaxAcc',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'ftt_hzAvgAcc',
				algo: false,
				metricName: 'ftt_hzAvgAcc',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_powerMetabolic',
				algo: false,
				metricName: 'load_powerMetabolic',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_powerMetAvg',
				algo: false,
				metricName: 'load_powerMetAvg',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_powerMetMin',
				algo: false,
				metricName: 'load_powerMetMin',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_maxEdi',
				algo: false,
				metricName: 'load_maxEdi',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_ediMin',
				algo: false,
				metricName: 'load_ediMin',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({ metricLabel: 'load_hmld', algo: false, metricName: 'load_hmld', defaultValue: 10 }),
			new DeviceMetricDescriptor({
				metricLabel: 'load_hmldCount',
				algo: false,
				metricName: 'load_hmldCount',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_hmldMin',
				algo: false,
				metricName: 'load_hmldMin',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_energyExpendture',
				algo: false,
				metricName: 'load_energyExpendture',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_energyExpedientureMin',
				algo: false,
				metricName: 'load_energyExpedientureMin',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({ metricLabel: 'load_dsl', algo: false, metricName: 'load_dsl', defaultValue: 10 }),
			new DeviceMetricDescriptor({
				metricLabel: 'load_dslMin',
				algo: false,
				metricName: 'load_dslMin',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_metMin',
				algo: false,
				metricName: 'load_metMin',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_avgMet',
				algo: false,
				metricName: 'load_avgMet',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_avgEdi',
				algo: false,
				metricName: 'load_avgEdi',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_maxMet',
				algo: false,
				metricName: 'load_maxMet',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({ metricLabel: 'load_edi', algo: false, metricName: 'load_edi', defaultValue: 10 }),
			new DeviceMetricDescriptor({ metricLabel: 'load_work', algo: false, metricName: 'load_work', defaultValue: 10 }),
			new DeviceMetricDescriptor({
				metricLabel: 'load_workAcc',
				algo: false,
				metricName: 'load_workAcc',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_workDec',
				algo: false,
				metricName: 'load_workDec',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_highIntWorkAccDist',
				algo: false,
				metricName: 'load_highIntWorkAccDist',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_highIntWorkAccDur',
				algo: false,
				metricName: 'load_highIntWorkAccDur',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_highIntWorkAccCount',
				algo: false,
				metricName: 'load_highIntWorkAccCount',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_highIntWorkDecDist',
				algo: false,
				metricName: 'load_highIntWorkDecDist',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_highIntWorkDecDur',
				algo: false,
				metricName: 'load_highIntWorkDecDur',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_highIntWorkDecCount',
				algo: false,
				metricName: 'load_highIntWorkDecCount',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_ediV2',
				algo: false,
				metricName: 'load_ediV2',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_hmldV2',
				algo: false,
				metricName: 'load_hmldV2',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_hmldCountV2',
				algo: false,
				metricName: 'load_hmldCountV2',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_powerMetabolicV2',
				algo: false,
				metricName: 'load_powerMetabolicV2',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_Player_Load',
				algo: false,
				metricName: 'load_Player_Load',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_Player_LoadMin',
				algo: false,
				metricName: 'load_Player_LoadMin',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_Player_LoadHorizontal',
				algo: false,
				metricName: 'load_Player_LoadHorizontal',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_Player_LoadVertical',
				algo: false,
				metricName: 'load_Player_LoadVertical',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_Player_LoadAnterior-Posterior',
				algo: false,
				metricName: 'load_Player_LoadAnterior-Posterior',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'load_Player_LoadMedio-Lateral',
				algo: false,
				metricName: 'load_Player_LoadMedio-Lateral',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'rpe_RPECentral',
				algo: false,
				metricName: 'rpe_RPECentral',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'rpe_RPEPeripheral',
				algo: false,
				metricName: 'rpe_RPEPeripheral',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'rpe_wellnessSleep',
				algo: false,
				metricName: 'rpe_wellnessSleep',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'rpe_wellnessDoms',
				algo: false,
				metricName: 'rpe_wellnessDoms',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'rpe_wellnessStress',
				algo: false,
				metricName: 'rpe_wellnessStress',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'rpe_wellnessMood',
				algo: false,
				metricName: 'rpe_wellnessMood',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'rpe_wellnessFatigue',
				algo: false,
				metricName: 'rpe_wellnessFatigue',
				defaultValue: 10
			}),
			new DeviceMetricDescriptor({ metricLabel: 'RPE *', algo: true, metricName: 'rpe', defaultValue: 0 }),
			new DeviceMetricDescriptor({ metricLabel: 'RPE TL *', algo: true, metricName: 'rpeTl', defaultValue: 0 }),
			new DeviceMetricDescriptor({
				metricLabel: 'HR 85-90 (min) *',
				algo: true,
				metricName: 'heartRate85to90',
				defaultValue: 0
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'HR >90 (min) *',
				algo: true,
				metricName: 'heartRateGr90',
				defaultValue: 0
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Total Distance (Km) *',
				algo: true,
				metricName: 'totalDistance',
				defaultValue: 0
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Sprint Distance (m) *',
				algo: true,
				metricName: 'sprintDistance',
				defaultValue: 0
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'High Speed Running Distance (m) *',
				algo: true,
				metricName: 'highspeedRunningDistance',
				defaultValue: 0
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Power Distance (m) *',
				algo: true,
				metricName: 'powerDistance',
				defaultValue: 0
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'High Power Distance (m) *',
				algo: true,
				metricName: 'highPowerDistance',
				defaultValue: 0
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Power Plays (No) *',
				algo: true,
				metricName: 'powerPlays',
				defaultValue: 0
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'High Intensity Decel (No) *',
				algo: true,
				metricName: 'highIntensityDeceleration',
				defaultValue: 0
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'High Intensity Accel (No) *',
				algo: true,
				metricName: 'highIntensityAcceleration',
				defaultValue: 0
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Explosive Distance (m) *',
				algo: true,
				metricName: 'explosiveDistance',
				defaultValue: 0
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'AVG Metabolic Power (W/Kg) *',
				algo: true,
				metricName: 'averageMetabolicPower',
				defaultValue: 0
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Distance per minute (m) *',
				algo: true,
				metricName: 'distancePerMinute',
				defaultValue: 0
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Workload Score *',
				algo: true,
				metricName: 'workload',
				defaultValue: 0
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Perceived Workload',
				algo: true,
				metricName: 'perceivedWorkload',
				defaultValue: 0
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Kinematic Workload',
				algo: true,
				metricName: 'kinematicWorkload',
				defaultValue: 0
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Workload',
				algo: true,
				metricName: 'metabolicWorkload',
				defaultValue: 0
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Mechanical Workload',
				algo: true,
				metricName: 'mechanicalWorkload',
				defaultValue: 0
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Cardio Workload',
				algo: true,
				metricName: 'cardioWorkload',
				defaultValue: 0
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Intensity',
				algo: true,
				metricName: 'intensity',
				defaultValue: 0
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Duration',
				algo: true,
				metricName: 'duration',
				defaultValue: 0
			})
		];

		this.metricsMapping = this.metricsMapping.map(val => {
			val.metricName = val.metricName.replace(/\./g, '_');
			return val;
		});

		const teamMappings: GpsProviderMapping = this.currentTeam._gpsProviderMapping;
		for (const m of teamMappings.rawMetrics) {
			const found = this.metricsMapping.find(({ metricName }) => metricName === m.name);
			if (found && m.label) found.metricLabel = m.label;
		}
	}

	getDefaultThresholds(): Threshold[] {
		let trArr: Threshold[] = [];
		for (const metric of this.metricsMapping) {
			if (metric.algo === false) {
				const tr: Threshold = new Threshold();
				tr.name = metric.metricName;
				tr.customValue = metric.defaultValue;
				tr.hidden = false;
				trArr.push(tr);
			}
		}
		// TODO: move magic numbers to readonly constant or json (other prorviders too)
		trArr.push(new Threshold({ name: 'rpe', customValue: 8, hidden: false }));
		trArr.push(new Threshold({ name: 'rpeTl', customValue: 700, hidden: false }));
		trArr.push(new Threshold({ name: 'heartRate85to90', customValue: 30, hidden: true }));
		trArr.push(new Threshold({ name: 'heartRateGr90', customValue: 20, hidden: true }));
		trArr.push(new Threshold({ name: 'totalDistance', customValue: 11, hidden: true }));
		trArr.push(new Threshold({ name: 'sprintDistance', customValue: 200, hidden: true }));
		trArr.push(new Threshold({ name: 'highspeedRunningDistance', customValue: 1000, hidden: true }));
		trArr.push(new Threshold({ name: 'powerDistance', customValue: 2500, hidden: true }));
		trArr.push(new Threshold({ name: 'highPowerDistance', customValue: 1500, hidden: true }));
		trArr.push(new Threshold({ name: 'powerPlays', customValue: 150, hidden: true }));
		trArr.push(new Threshold({ name: 'highIntensityDeceleration', customValue: 80, hidden: true }));
		trArr.push(new Threshold({ name: 'explosiveDistance', customValue: 500, hidden: true }));
		trArr.push(new Threshold({ name: 'highIntensityAcceleration', customValue: 80, hidden: true }));
		trArr.push(new Threshold({ name: 'averageMetabolicPower', customValue: 11, hidden: true }));
		trArr.push(new Threshold({ name: 'distancePerMinute', customValue: 120, hidden: true }));
		trArr.push(new Threshold({ name: 'workload', customValue: 5, hidden: true }));
		trArr.push(new Threshold({ name: 'perceivedWorkload', customValue: 1, hidden: true }));
		trArr.push(new Threshold({ name: 'kinematicWorkload', customValue: 1, hidden: true }));
		trArr.push(new Threshold({ name: 'metabolicWorkload', customValue: 1, hidden: true }));
		trArr.push(new Threshold({ name: 'mechanicalWorkload', customValue: 1, hidden: true }));
		trArr.push(new Threshold({ name: 'cardioWorkload', customValue: 1, hidden: true }));
		trArr.push(new Threshold({ name: 'intensity', customValue: 1, hidden: true }));
		trArr = trArr.map(val => {
			val.name = val.name.replace(/\./g, '_');
			return val;
		});
		return trArr;
	}

	getMetricLabel(metricName: string): string {
		const metric = this.metricsMapping.find(x => x.metricName === metricName);
		return metric ? metric.metricLabel : metricName;
	}

	getSessionsFromCsv(): SessionPlayerData[] {
		return [];
	}

	getMetricsMapping(): DeviceMetricDescriptor[] {
		return this.metricsMapping;
	}
}
