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
export class EtlGpsStatSportsAPIService implements BaseEtlGpsService {
	private metricsMapping: DeviceMetricDescriptor[];

	constructor(private etlDateService: EtlDateDurationService, private currentTeam: Team) {
		this.metricsMapping = [];
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'totalTime', algo: false, metricName: 'totalTime', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'totaldistance',
				algo: false,
				metricName: 'totaldistance',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZonal',
				algo: false,
				metricName: 'distanceZonal',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZone1Rel',
				algo: false,
				metricName: 'distanceZone1Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZone2Rel',
				algo: false,
				metricName: 'distanceZone2Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZone3Rel',
				algo: false,
				metricName: 'distanceZone3Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZone4Rel',
				algo: false,
				metricName: 'distanceZone4Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZone5Rel',
				algo: false,
				metricName: 'distanceZone5Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZone6Rel',
				algo: false,
				metricName: 'distanceZone6Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZone1Ab',
				algo: false,
				metricName: 'distanceZone1Ab',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZone2Ab',
				algo: false,
				metricName: 'distanceZone2Ab',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZone3Ab',
				algo: false,
				metricName: 'distanceZone3Ab',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZone4Ab',
				algo: false,
				metricName: 'distanceZone4Ab',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZone5Ab',
				algo: false,
				metricName: 'distanceZone5Ab',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZone6Ab',
				algo: false,
				metricName: 'distanceZone6Ab',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeZone1Rel',
				algo: false,
				metricName: 'timeZone1Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeZone2Rel',
				algo: false,
				metricName: 'timeZone2Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeZone3Rel',
				algo: false,
				metricName: 'timeZone3Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeZone4Rel',
				algo: false,
				metricName: 'timeZone4Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeZone5Rel',
				algo: false,
				metricName: 'timeZone5Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeZone6Rel',
				algo: false,
				metricName: 'timeZone6Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeZone1Ab',
				algo: false,
				metricName: 'timeZone1Ab',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeZone2Ab',
				algo: false,
				metricName: 'timeZone2Ab',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeZone3Ab',
				algo: false,
				metricName: 'timeZone3Ab',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeZone4Ab',
				algo: false,
				metricName: 'timeZone4Ab',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeZone5Ab',
				algo: false,
				metricName: 'timeZone5Ab',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeZone6Ab',
				algo: false,
				metricName: 'timeZone6Ab',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'entriesZone3Rel',
				algo: false,
				metricName: 'entriesZone3Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'entriesZone4Rel',
				algo: false,
				metricName: 'entriesZone4Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'entriesZone5Rel',
				algo: false,
				metricName: 'entriesZone5Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'entriesZone6Rel',
				algo: false,
				metricName: 'entriesZone6Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'entriesZone3Ab',
				algo: false,
				metricName: 'entriesZone3Ab',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'entriesZone4Ab',
				algo: false,
				metricName: 'entriesZone4Ab',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'entriesZone5Ab',
				algo: false,
				metricName: 'entriesZone5Ab',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'entriesZone6Ab',
				algo: false,
				metricName: 'entriesZone6Ab',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'sprintDistance',
				algo: false,
				metricName: 'sprintDistance',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationTotalDistanceZone1',
				algo: false,
				metricName: 'accelerationTotalDistanceZone1',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationTotalDistanceZone2',
				algo: false,
				metricName: 'accelerationTotalDistanceZone2',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationTotalDistanceZone3',
				algo: false,
				metricName: 'accelerationTotalDistanceZone3',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationTotalDistanceZone4',
				algo: false,
				metricName: 'accelerationTotalDistanceZone4',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationTotalDistanceZone5',
				algo: false,
				metricName: 'accelerationTotalDistanceZone5',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationTotalDistanceZone6',
				algo: false,
				metricName: 'accelerationTotalDistanceZone6',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationTotalDistanceZone1',
				algo: false,
				metricName: 'decelerationTotalDistanceZone1',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationTotalDistanceZone2',
				algo: false,
				metricName: 'decelerationTotalDistanceZone2',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationTotalDistanceZone3',
				algo: false,
				metricName: 'decelerationTotalDistanceZone3',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationTotalDistanceZone4',
				algo: false,
				metricName: 'decelerationTotalDistanceZone4',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationTotalDistanceZone5',
				algo: false,
				metricName: 'decelerationTotalDistanceZone5',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationTotalDistanceZone6',
				algo: false,
				metricName: 'decelerationTotalDistanceZone6',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'acuteVsChronicRatio',
				algo: false,
				metricName: 'acuteVsChronicRatio',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationImpulse',
				algo: false,
				metricName: 'accelerationImpulse',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'powerAcceleration',
				algo: false,
				metricName: 'powerAcceleration',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'totalDecelerationLoading',
				algo: false,
				metricName: 'totalDecelerationLoading',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerZone1Time',
				algo: false,
				metricName: 'metabolicPowerZone1Time',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerZone2Time',
				algo: false,
				metricName: 'metabolicPowerZone2Time',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerZone3Time',
				algo: false,
				metricName: 'metabolicPowerZone3Time',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerZone4Time',
				algo: false,
				metricName: 'metabolicPowerZone4Time',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerZone5Time',
				algo: false,
				metricName: 'metabolicPowerZone5Time',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerZone6Time',
				algo: false,
				metricName: 'metabolicPowerZone6Time',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerZone1Distance',
				algo: false,
				metricName: 'metabolicPowerZone1Distance',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerZone2Distance',
				algo: false,
				metricName: 'metabolicPowerZone2Distance',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerZone3Distance',
				algo: false,
				metricName: 'metabolicPowerZone3Distance',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerZone4Distance',
				algo: false,
				metricName: 'metabolicPowerZone4Distance',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerZone5Distance',
				algo: false,
				metricName: 'metabolicPowerZone5Distance',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerZone6Distance',
				algo: false,
				metricName: 'metabolicPowerZone6Distance',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'heartRateRecovery',
				algo: false,
				metricName: 'heartRateRecovery',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'energyExpenditure',
				algo: false,
				metricName: 'energyExpenditure',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'highMetabolicPowerTime',
				algo: false,
				metricName: 'highMetabolicPowerTime',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'equivalentMetabolicDistance',
				algo: false,
				metricName: 'equivalentMetabolicDistance',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distancePerMinute',
				algo: false,
				metricName: 'distancePerMinute',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'hmlDistancePerMinute',
				algo: false,
				metricName: 'hmlDistancePerMinute',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'highSpeedRunningRel',
				algo: false,
				metricName: 'highSpeedRunningRel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'highSpeedRunningAb',
				algo: false,
				metricName: 'highSpeedRunningAb',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'averageSpeed',
				algo: false,
				metricName: 'averageSpeed',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'maxSpeed', algo: false, metricName: 'maxSpeed', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'speedExertion',
				algo: false,
				metricName: 'speedExertion',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'speedExertionZone1',
				algo: false,
				metricName: 'speedExertionZone1',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'speedExertionZone2',
				algo: false,
				metricName: 'speedExertionZone2',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'speedExertionZone3',
				algo: false,
				metricName: 'speedExertionZone3',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'speedExertionZone4',
				algo: false,
				metricName: 'speedExertionZone4',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'speedExertionZone5',
				algo: false,
				metricName: 'speedExertionZone5',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'speedExertionZone6',
				algo: false,
				metricName: 'speedExertionZone6',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'sprints', algo: false, metricName: 'sprints', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'explosivePowerEfforts',
				algo: false,
				metricName: 'explosivePowerEfforts',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'highIntensityBurstNumber',
				algo: false,
				metricName: 'highIntensityBurstNumber',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'highIntensityBurstDuration',
				algo: false,
				metricName: 'highIntensityBurstDuration',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'highSpeedRunningPerMinute',
				algo: false,
				metricName: 'highSpeedRunningPerMinute',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'dynamicStressLoad',
				algo: false,
				metricName: 'dynamicStressLoad',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'dynamicStressLoadZone1',
				algo: false,
				metricName: 'dynamicStressLoadZone1',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'dynamicStressLoadZone2',
				algo: false,
				metricName: 'dynamicStressLoadZone2',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'dynamicStressLoadZone3',
				algo: false,
				metricName: 'dynamicStressLoadZone3',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'dynamicStressLoadZone4',
				algo: false,
				metricName: 'dynamicStressLoadZone4',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'dynamicStressLoadZone5',
				algo: false,
				metricName: 'dynamicStressLoadZone5',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'dynamicStressLoadZone6',
				algo: false,
				metricName: 'dynamicStressLoadZone6',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'dynamicLoadMag',
				algo: false,
				metricName: 'dynamicLoadMag',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'dynamicLoadVert',
				algo: false,
				metricName: 'dynamicLoadVert',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'dynamicLoadLat',
				algo: false,
				metricName: 'dynamicLoadLat',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'dynamicLoadAnt',
				algo: false,
				metricName: 'dynamicLoadAnt',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'dynamicLoadSlow',
				algo: false,
				metricName: 'dynamicLoadSlow',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeInHeartRateZone1',
				algo: false,
				metricName: 'timeInHeartRateZone1',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeInHeartRateZone2',
				algo: false,
				metricName: 'timeInHeartRateZone2',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeInHeartRateZone3',
				algo: false,
				metricName: 'timeInHeartRateZone3',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeInHeartRateZone4',
				algo: false,
				metricName: 'timeInHeartRateZone4',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeInHeartRateZone5',
				algo: false,
				metricName: 'timeInHeartRateZone5',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeInHeartRateZone6',
				algo: false,
				metricName: 'timeInHeartRateZone6',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeInredZone',
				algo: false,
				metricName: 'timeInredZone',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeInRedZonePerMinute',
				algo: false,
				metricName: 'timeInRedZonePerMinute',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'heartRateExertion',
				algo: false,
				metricName: 'heartRateExertion',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'maxHeartRate',
				algo: false,
				metricName: 'maxHeartRate',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'averageHeartRate',
				algo: false,
				metricName: 'averageHeartRate',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'impacts', algo: false, metricName: 'impacts', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'impactsZone1',
				algo: false,
				metricName: 'impactsZone1',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'impactsZone2',
				algo: false,
				metricName: 'impactsZone2',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'impactsZone3',
				algo: false,
				metricName: 'impactsZone3',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'impactsZone4',
				algo: false,
				metricName: 'impactsZone4',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'impactsZone5',
				algo: false,
				metricName: 'impactsZone5',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'impactsZone6',
				algo: false,
				metricName: 'impactsZone6',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'leftVerticalImpact',
				algo: false,
				metricName: 'leftVerticalImpact',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'leftAverageVertImpact',
				algo: false,
				metricName: 'leftAverageVertImpact',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'leftLaterialImpact',
				algo: false,
				metricName: 'leftLaterialImpact',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'leftAntPostImpact',
				algo: false,
				metricName: 'leftAntPostImpact',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'leftMagImpact',
				algo: false,
				metricName: 'leftMagImpact',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'rightVerticalImpact',
				algo: false,
				metricName: 'rightVerticalImpact',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'rightLaterialImpact',
				algo: false,
				metricName: 'rightLaterialImpact',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'rightAntPostImpact',
				algo: false,
				metricName: 'rightAntPostImpact',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'rightMagImpact',
				algo: false,
				metricName: 'rightMagImpact',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'rightAverageVertImpact',
				algo: false,
				metricName: 'rightAverageVertImpact',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations',
				algo: false,
				metricName: 'accelerations',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationsZone1',
				algo: false,
				metricName: 'accelerationsZone1',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationsZone2',
				algo: false,
				metricName: 'accelerationsZone2',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationsZone3',
				algo: false,
				metricName: 'accelerationsZone3',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationsZone4',
				algo: false,
				metricName: 'accelerationsZone4',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationsZone5',
				algo: false,
				metricName: 'accelerationsZone5',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationsZone6',
				algo: false,
				metricName: 'accelerationsZone6',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'maxAcceleration',
				algo: false,
				metricName: 'maxAcceleration',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerations',
				algo: false,
				metricName: 'decelerations',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationsZone1',
				algo: false,
				metricName: 'decelerationsZone1',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationsZone2',
				algo: false,
				metricName: 'decelerationsZone2',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationsZone3',
				algo: false,
				metricName: 'decelerationsZone3',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationsZone4',
				algo: false,
				metricName: 'decelerationsZone4',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationsZone5',
				algo: false,
				metricName: 'decelerationsZone5',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationsZone6',
				algo: false,
				metricName: 'decelerationsZone6',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'maxDeceleration',
				algo: false,
				metricName: 'maxDeceleration',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'totalLeftSteps',
				algo: false,
				metricName: 'totalLeftSteps',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'totalRightSteps',
				algo: false,
				metricName: 'totalRightSteps',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'stepBalance',
				algo: false,
				metricName: 'stepBalance',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'totalMetabolicPower',
				algo: false,
				metricName: 'totalMetabolicPower',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'averageMetabolicPower',
				algo: false,
				metricName: 'averageMetabolicPower',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'HML', algo: false, metricName: 'HML', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'equivalantMetabolicDistance',
				algo: false,
				metricName: 'equivalantMetabolicDistance',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'highMetbolicPowerTime',
				algo: false,
				metricName: 'highMetbolicPowerTime',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicDistanceZonal',
				algo: false,
				metricName: 'metabolicDistanceZonal',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerDistanceZone1',
				algo: false,
				metricName: 'metabolicPowerDistanceZone1',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerDistanceZone2',
				algo: false,
				metricName: 'metabolicPowerDistanceZone2',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerDistanceZone3',
				algo: false,
				metricName: 'metabolicPowerDistanceZone3',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerDistanceZone4',
				algo: false,
				metricName: 'metabolicPowerDistanceZone4',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerDistanceZone5',
				algo: false,
				metricName: 'metabolicPowerDistanceZone5',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerDistanceZone6',
				algo: false,
				metricName: 'metabolicPowerDistanceZone6',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicTimeZonal',
				algo: false,
				metricName: 'metabolicTimeZonal',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerTimeZone1',
				algo: false,
				metricName: 'metabolicPowerTimeZone1',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerTimeZone2',
				algo: false,
				metricName: 'metabolicPowerTimeZone2',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerTimeZone3',
				algo: false,
				metricName: 'metabolicPowerTimeZone3',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerTimeZone4',
				algo: false,
				metricName: 'metabolicPowerTimeZone4',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerTimeZone5',
				algo: false,
				metricName: 'metabolicPowerTimeZone5',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicPowerTimeZone6',
				algo: false,
				metricName: 'metabolicPowerTimeZone6',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'fatigueIndex',
				algo: false,
				metricName: 'fatigueIndex',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'collisionsNumber',
				algo: false,
				metricName: 'collisionsNumber',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'collisionsLoad',
				algo: false,
				metricName: 'collisionsLoad',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'scrumsNumber',
				algo: false,
				metricName: 'scrumsNumber',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'scrumsLoad', algo: false, metricName: 'scrumsLoad', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'tacklesNumber',
				algo: false,
				metricName: 'tacklesNumber',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'carrysNumber',
				algo: false,
				metricName: 'carrysNumber',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'rucksNumber',
				algo: false,
				metricName: 'rucksNumber',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'RPE *', algo: true, metricName: 'rpe', defaultValue: 0 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'RPE TL *', algo: true, metricName: 'rpeTl', defaultValue: 0 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'HR 85-90 (min) *',
				algo: true,
				metricName: 'heartRate85to90',
				defaultValue: 0
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'HR >90 (min) *',
				algo: true,
				metricName: 'heartRateGr90',
				defaultValue: 0
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Total Distance (Km) *',
				algo: true,
				metricName: 'totalDistance',
				defaultValue: 0
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Sprint Distance (m) *',
				algo: true,
				metricName: 'sprintDistance',
				defaultValue: 0
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'High Speed Running Distance (m) *',
				algo: true,
				metricName: 'highspeedRunningDistance',
				defaultValue: 0
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Power Distance (m) *',
				algo: true,
				metricName: 'powerDistance',
				defaultValue: 0
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'High Power Distance (m) *',
				algo: true,
				metricName: 'highPowerDistance',
				defaultValue: 0
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Power Plays (No) *',
				algo: true,
				metricName: 'powerPlays',
				defaultValue: 0
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'High Intensity Decel (No) *',
				algo: true,
				metricName: 'highIntensityDeceleration',
				defaultValue: 0
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'High Intensity Accel (No) *',
				algo: true,
				metricName: 'highIntensityAcceleration',
				defaultValue: 0
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Explosive Distance (m) *',
				algo: true,
				metricName: 'explosiveDistance',
				defaultValue: 0
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'AVG Metabolic Power (W/Kg) *',
				algo: true,
				metricName: 'averageMetabolicPower',
				defaultValue: 0
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Distance per minute (m) *',
				algo: true,
				metricName: 'distancePerMinute',
				defaultValue: 0
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Workload Score *',
				algo: true,
				metricName: 'workload',
				defaultValue: 0
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Perceived Workload',
				algo: true,
				metricName: 'perceivedWorkload',
				defaultValue: 0
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Kinematic Workload',
				algo: true,
				metricName: 'kinematicWorkload',
				defaultValue: 0
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Workload',
				algo: true,
				metricName: 'metabolicWorkload',
				defaultValue: 0
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Mechanical Workload',
				algo: true,
				metricName: 'mechanicalWorkload',
				defaultValue: 0
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Cardio Workload',
				algo: true,
				metricName: 'cardioWorkload',
				defaultValue: 0
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Intensity',
				algo: true,
				metricName: 'intensity',
				defaultValue: 0
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Duration',
				algo: true,
				metricName: 'duration',
				defaultValue: 0
			})
		);
		const teamMappings: GpsProviderMapping = currentTeam._gpsProviderMapping;
		for (const m of teamMappings.rawMetrics) {
			const found = this.metricsMapping.find(x => x.metricName === m.name);
			if (found && m.label) found.metricLabel = m.label;
		}
		// this.metricsMapping = this.metricsMapping.map((val) => {val.metricName = val.metricName.replace(/\./g, '_'); return val; });
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

	getSessionsFromCsv(): SessionPlayerData[] | null {
		return null;
	}

	getMetricsMapping(): DeviceMetricDescriptor[] {
		return this.metricsMapping;
	}
}
