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
export class EtlGpsSonraAPIService implements BaseEtlGpsService {
	private metricsMapping: DeviceMetricDescriptor[];

	constructor(private etlDateService: EtlDateDurationService, private currentTeam: Team) {
		this.metricsMapping = [];
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'totalTime', algo: false, metricName: '_totalTime', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceTotal',
				algo: false,
				metricName: '_distanceTotal',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distancePerMin',
				algo: false,
				metricName: '_distancePerMin',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZ1Rel',
				algo: false,
				metricName: '_distanceZ1Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZ2Rel',
				algo: false,
				metricName: '_distanceZ2Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZ3Rel',
				algo: false,
				metricName: '_distanceZ3Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZ4Rel',
				algo: false,
				metricName: '_distanceZ4Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZ5Rel',
				algo: false,
				metricName: '_distanceZ5Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZ6Rel',
				algo: false,
				metricName: '_distanceZ6Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'highSpeedRunningRel',
				algo: false,
				metricName: '_highSpeedRunningRel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'hsrRelPerMin',
				algo: false,
				metricName: '_hsrRelPerMin',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZ1Abs',
				algo: false,
				metricName: '_distanceZ1Abs',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZ2Abs',
				algo: false,
				metricName: '_distanceZ2Abs',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZ3Abs',
				algo: false,
				metricName: '_distanceZ3Abs',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZ4Abs',
				algo: false,
				metricName: '_distanceZ4Abs',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZ5Abs',
				algo: false,
				metricName: '_distanceZ5Abs',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'distanceZ6Abs',
				algo: false,
				metricName: '_distanceZ6Abs',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'highSpeedRunningAbs',
				algo: false,
				metricName: '_highSpeedRunningAbs',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'hsrAbsPerMin',
				algo: false,
				metricName: '_hsrAbsPerMin',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'timeZ1Rel', algo: false, metricName: '_timeZ1Rel', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'timeZ2Rel', algo: false, metricName: '_timeZ2Rel', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'timeZ3Rel', algo: false, metricName: '_timeZ3Rel', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'timeZ4Rel', algo: false, metricName: '_timeZ4Rel', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'timeZ5Rel', algo: false, metricName: '_timeZ5Rel', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'timeZ6Rel', algo: false, metricName: '_timeZ6Rel', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'timeZ1Abs', algo: false, metricName: '_timeZ1Abs', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'timeZ2Abs', algo: false, metricName: '_timeZ2Abs', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'timeZ3Abs', algo: false, metricName: '_timeZ3Abs', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'timeZ4Abs', algo: false, metricName: '_timeZ4Abs', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'timeZ5Abs', algo: false, metricName: '_timeZ5Abs', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'timeZ6Abs', algo: false, metricName: '_timeZ6Abs', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'emd', algo: false, metricName: '_emd', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicDistanceZ1',
				algo: false,
				metricName: '_metabolicDistanceZ1',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicDistanceZ2',
				algo: false,
				metricName: '_metabolicDistanceZ2',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicDistanceZ3',
				algo: false,
				metricName: '_metabolicDistanceZ3',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicDistanceZ4',
				algo: false,
				metricName: '_metabolicDistanceZ4',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicDistanceZ5',
				algo: false,
				metricName: '_metabolicDistanceZ5',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicDistanceZ6',
				algo: false,
				metricName: '_metabolicDistanceZ6',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicTimeZ1',
				algo: false,
				metricName: '_metabolicTimeZ1',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicTimeZ2',
				algo: false,
				metricName: '_metabolicTimeZ2',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicTimeZ3',
				algo: false,
				metricName: '_metabolicTimeZ3',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicTimeZ4',
				algo: false,
				metricName: '_metabolicTimeZ4',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicTimeZ5',
				algo: false,
				metricName: '_metabolicTimeZ5',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'metabolicTimeZ6',
				algo: false,
				metricName: '_metabolicTimeZ6',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'maxSpeed', algo: false, metricName: '_maxSpeed', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'averageSpeed',
				algo: false,
				metricName: '_averageSpeed',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'hmld', algo: false, metricName: '_hmld', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'hmlTime', algo: false, metricName: '_hmlTime', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'dsl', algo: false, metricName: '_dsl', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'dslZ1', algo: false, metricName: '_dslZ1', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'dslZ2', algo: false, metricName: '_dslZ2', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'dslZ3', algo: false, metricName: '_dslZ3', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'dslZ4', algo: false, metricName: '_dslZ4', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'dslZ5', algo: false, metricName: '_dslZ5', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'dslZ6', algo: false, metricName: '_dslZ6', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'dslZ1Time', algo: false, metricName: '_dslZ1Time', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'dslZ2Time', algo: false, metricName: '_dslZ2Time', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'dslZ3Time', algo: false, metricName: '_dslZ3Time', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'dslZ4Time', algo: false, metricName: '_dslZ4Time', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'dslZ5Time', algo: false, metricName: '_dslZ5Time', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'dslZ6Time', algo: false, metricName: '_dslZ6Time', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'speedIntensity',
				algo: false,
				metricName: '_speedIntensity',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'speedIntensityZ1Rel',
				algo: false,
				metricName: '_speedIntensityZ1Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'speedIntensityZ2Rel',
				algo: false,
				metricName: '_speedIntensityZ2Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'speedIntensityZ3Rel',
				algo: false,
				metricName: '_speedIntensityZ3Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'speedIntensityZ4Rel',
				algo: false,
				metricName: '_speedIntensityZ4Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'speedIntensityZ5Rel',
				algo: false,
				metricName: '_speedIntensityZ5Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'speedIntensityZ6Rel',
				algo: false,
				metricName: '_speedIntensityZ6Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'speedIntensityZ1Abs',
				algo: false,
				metricName: '_speedIntensityZ1Abs',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'speedIntensityZ2Abs',
				algo: false,
				metricName: '_speedIntensityZ2Abs',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'speedIntensityZ3Abs',
				algo: false,
				metricName: '_speedIntensityZ3Abs',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'speedIntensityZ4Abs',
				algo: false,
				metricName: '_speedIntensityZ4Abs',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'speedIntensityZ5Abs',
				algo: false,
				metricName: '_speedIntensityZ5Abs',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'speedIntensityZ6Abs',
				algo: false,
				metricName: '_speedIntensityZ6Abs',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'totalMetabolicPower',
				algo: false,
				metricName: '_totalMetabolicPower',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'averageMetabolicPower',
				algo: false,
				metricName: '_averageMetabolicPower',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'impacts', algo: false, metricName: '_impacts', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'impactsZ1', algo: false, metricName: '_impactsZ1', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'impactsZ2', algo: false, metricName: '_impactsZ2', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'impactsZ3', algo: false, metricName: '_impactsZ3', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'impactsZ4', algo: false, metricName: '_impactsZ4', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'impactsZ5', algo: false, metricName: '_impactsZ5', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'impactsZ6', algo: false, metricName: '_impactsZ6', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerations',
				algo: false,
				metricName: '_accelerations',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationsZ1',
				algo: false,
				metricName: '_accelerationsZ1',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationsZ2',
				algo: false,
				metricName: '_accelerationsZ2',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationsZ3',
				algo: false,
				metricName: '_accelerationsZ3',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationsZ4',
				algo: false,
				metricName: '_accelerationsZ4',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationsZ5',
				algo: false,
				metricName: '_accelerationsZ5',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationsZ6',
				algo: false,
				metricName: '_accelerationsZ6',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationDistanceZ1',
				algo: false,
				metricName: '_accelerationDistanceZ1',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationDistanceZ2',
				algo: false,
				metricName: '_accelerationDistanceZ2',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationDistanceZ3',
				algo: false,
				metricName: '_accelerationDistanceZ3',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationDistanceZ4',
				algo: false,
				metricName: '_accelerationDistanceZ4',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationDistanceZ5',
				algo: false,
				metricName: '_accelerationDistanceZ5',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationDistanceZ6',
				algo: false,
				metricName: '_accelerationDistanceZ6',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationTimeZ1',
				algo: false,
				metricName: '_accelerationTimeZ1',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationTimeZ2',
				algo: false,
				metricName: '_accelerationTimeZ2',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationTimeZ3',
				algo: false,
				metricName: '_accelerationTimeZ3',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationTimeZ4',
				algo: false,
				metricName: '_accelerationTimeZ4',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationTimeZ5',
				algo: false,
				metricName: '_accelerationTimeZ5',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelerationTimeZ6',
				algo: false,
				metricName: '_accelerationTimeZ6',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'maxAcceleration',
				algo: false,
				metricName: '_maxAcceleration',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerations',
				algo: false,
				metricName: '_decelerations',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationsZ1',
				algo: false,
				metricName: '_decelerationsZ1',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationsZ2',
				algo: false,
				metricName: '_decelerationsZ2',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationsZ3',
				algo: false,
				metricName: '_decelerationsZ3',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationsZ4',
				algo: false,
				metricName: '_decelerationsZ4',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationsZ5',
				algo: false,
				metricName: '_decelerationsZ5',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationsZ6',
				algo: false,
				metricName: '_decelerationsZ6',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationDistanceZ1',
				algo: false,
				metricName: '_decelerationDistanceZ1',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationDistanceZ2',
				algo: false,
				metricName: '_decelerationDistanceZ2',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationDistanceZ3',
				algo: false,
				metricName: '_decelerationDistanceZ3',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationDistanceZ4',
				algo: false,
				metricName: '_decelerationDistanceZ4',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationDistanceZ5',
				algo: false,
				metricName: '_decelerationDistanceZ5',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationDistanceZ6',
				algo: false,
				metricName: '_decelerationDistanceZ6',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationTimeZ1',
				algo: false,
				metricName: '_decelerationTimeZ1',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationTimeZ2',
				algo: false,
				metricName: '_decelerationTimeZ2',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationTimeZ3',
				algo: false,
				metricName: '_decelerationTimeZ3',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationTimeZ4',
				algo: false,
				metricName: '_decelerationTimeZ4',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationTimeZ5',
				algo: false,
				metricName: '_decelerationTimeZ5',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'decelerationTimeZ6',
				algo: false,
				metricName: '_decelerationTimeZ6',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'maxDeceleration',
				algo: false,
				metricName: '_maxDeceleration',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'sprints', algo: false, metricName: '_sprints', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'sprintDistance',
				algo: false,
				metricName: '_sprintDistance',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'entriesZ1Rel',
				algo: false,
				metricName: '_entriesZ1Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'entriesZ2Rel',
				algo: false,
				metricName: '_entriesZ2Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'entriesZ3Rel',
				algo: false,
				metricName: '_entriesZ3Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'entriesZ4Rel',
				algo: false,
				metricName: '_entriesZ4Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'entriesZ5Rel',
				algo: false,
				metricName: '_entriesZ5Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'entriesZ6Rel',
				algo: false,
				metricName: '_entriesZ6Rel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'entriesZ1Abs',
				algo: false,
				metricName: '_entriesZ1Abs',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'entriesZ2Abs',
				algo: false,
				metricName: '_entriesZ2Abs',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'entriesZ3Abs',
				algo: false,
				metricName: '_entriesZ3Abs',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'entriesZ4Abs',
				algo: false,
				metricName: '_entriesZ4Abs',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'entriesZ5Abs',
				algo: false,
				metricName: '_entriesZ5Abs',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'entriesZ6Abs',
				algo: false,
				metricName: '_entriesZ6Abs',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'maxHeartrate',
				algo: false,
				metricName: '_maxHeartrate',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'hrExertion',
				algo: false,
				metricName: '_hrExertion',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeHeartrateZ1',
				algo: false,
				metricName: '_timeHeartrateZ1',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeHeartrateZ2',
				algo: false,
				metricName: '_timeHeartrateZ2',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeHeartrateZ3',
				algo: false,
				metricName: '_timeHeartrateZ3',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeHeartrateZ4',
				algo: false,
				metricName: '_timeHeartrateZ4',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeHeartrateZ5',
				algo: false,
				metricName: '_timeHeartrateZ5',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeHeartrateZ6',
				algo: false,
				metricName: '_timeHeartrateZ6',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'timeInRedZone',
				algo: false,
				metricName: '_timeInRedZone',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'hrLoad', algo: false, metricName: '_hrLoad', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'explosiveDistanceRel',
				algo: false,
				metricName: '_explosiveDistanceRel',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'explosiveDistanceAbs',
				algo: false,
				metricName: '_explosiveDistanceAbs',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'fatigueIndex',
				algo: false,
				metricName: '_fatigueIndex',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'accelImpulseTotal',
				algo: false,
				metricName: '_accelImpulseTotal',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'externalWork',
				algo: false,
				metricName: '_externalWork',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'hrv', algo: false, metricName: '_hrv', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'hrrPercent',
				algo: false,
				metricName: '_hrrPercent',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'hrrBeats', algo: false, metricName: '_hrrBeats', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'stepBalance',
				algo: false,
				metricName: '_stepBalance',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'dynamicLoadVert',
				algo: false,
				metricName: '_dynamicLoadVert',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'dynamicLoadLat',
				algo: false,
				metricName: '_dynamicLoadLat',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'dynamicLoadAnt',
				algo: false,
				metricName: '_dynamicLoadAnt',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'dynamicLoadMag',
				algo: false,
				metricName: '_dynamicLoadMag',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'dynamicLoadSlow',
				algo: false,
				metricName: '_dynamicLoadSlow',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'totalRightSteps',
				algo: false,
				metricName: '_totalRightSteps',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'rightVerticalImpact',
				algo: false,
				metricName: '_rightVerticalImpact',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'rightLateralImpact',
				algo: false,
				metricName: '_rightLateralImpact',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'rightAntPostImpact',
				algo: false,
				metricName: '_rightAntPostImpact',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'rightMagImpact',
				algo: false,
				metricName: '_rightMagImpact',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'rightAverageVertImpact',
				algo: false,
				metricName: '_rightAverageVertImpact',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'totalLeftSteps',
				algo: false,
				metricName: '_totalLeftSteps',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'leftVerticalImpact',
				algo: false,
				metricName: '_leftVerticalImpact',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'leftLateralImpact',
				algo: false,
				metricName: '_leftLateralImpact',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'leftAntPostImpact',
				algo: false,
				metricName: '_leftAntPostImpact',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'leftMagImpact',
				algo: false,
				metricName: '_leftMagImpact',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'leftAverageVertImpact',
				algo: false,
				metricName: '_leftAverageVertImpact',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'hibsNumber',
				algo: false,
				metricName: '_hibsNumber',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'hibsDuration',
				algo: false,
				metricName: '_hibsDuration',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'hibsDistance',
				algo: false,
				metricName: '_hibsDistance',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'hibsMaxSpeed',
				algo: false,
				metricName: '_hibsMaxSpeed',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'energyExpenditure',
				algo: false,
				metricName: '_energyExpenditure',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'totalDecelLoading',
				algo: false,
				metricName: '_totalDecelLoading',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'totalAccelLoading',
				algo: false,
				metricName: '_totalAccelLoading',
				defaultValue: 10
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'acute', algo: false, metricName: '_acute', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'chronic', algo: false, metricName: '_chronic', defaultValue: 10 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'acuteChronicRatio',
				algo: false,
				metricName: '_acuteChronicRatio',
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
