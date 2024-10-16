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
export class EtlGpsGpexeService implements BaseEtlGpsService {
	private metricsMapping: DeviceMetricDescriptor[];

	constructor(private etlDateService: EtlDateDurationService, private currentTeam: Team) {
		this.metricsMapping = [];
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Total Distance',
				algo: false,
				metricName: 'total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Equivalent Distance',
				algo: false,
				metricName: 'equivalent_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Time',
				algo: false,
				metricName: 'average_time',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Total Seconds',
				algo: false,
				metricName: 'total_seconds',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Equivalent Distance Index',
				algo: false,
				metricName: 'equivalent_distance_index',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Anaerobic Index',
				algo: false,
				metricName: 'anaerobic_index',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Power Events Total Time',
				algo: false,
				metricName: 'power_events_total_time',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Power Events Average Time',
				algo: false,
				metricName: 'power_events_avg_time',
				defaultValue: 1
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Max Values Speed',
				algo: false,
				metricName: 'max_values_speed',
				defaultValue: 1
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Max Values Acc',
				algo: false,
				metricName: 'max_values_acc',
				defaultValue: 1
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Max Values Dec',
				algo: false,
				metricName: 'max_values_dec',
				defaultValue: 1
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Max Values Power',
				algo: false,
				metricName: 'max_values_power',
				defaultValue: 1
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Max Values Cardio',
				algo: false,
				metricName: 'max_values_cardio',
				defaultValue: 1
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'Max V', algo: false, metricName: 'max_v', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'Average V', algo: false, metricName: 'average_v', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'Average HR', algo: false, metricName: 'average_hr', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'Average P', algo: false, metricName: 'average_p', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Power Aer',
				algo: false,
				metricName: 'average_power_aer',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Total Energy',
				algo: false,
				metricName: 'total_energy',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Aerobic Energy',
				algo: false,
				metricName: 'aerobic_energy',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Anaerobic Energy',
				algo: false,
				metricName: 'anaerobic_energy',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Revocery Average Time',
				algo: false,
				metricName: 'recovery_average_time',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Recovery Average Power',
				algo: false,
				metricName: 'recovery_average_power',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average hdop',
				algo: false,
				metricName: 'average_hdop',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average ',
				algo: false,
				metricName: 'average_satprsum',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'Total Time', algo: false, metricName: 'total_time', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Power Events Count',
				algo: false,
				metricName: 'power_events',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'Max DEC', algo: false, metricName: 'max_DEC', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'Max HR', algo: false, metricName: 'max_HR', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'Max POWER', algo: false, metricName: 'max_POWER', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'Max ACC', algo: false, metricName: 'max_ACC', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'Max SPEED', algo: false, metricName: 'max_SPEED', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acc Event Count',
				algo: false,
				metricName: 'acc_event_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Dec Event Count',
				algo: false,
				metricName: 'dec_event_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acc Event Duration',
				algo: false,
				metricName: 'acc_event_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Dec Event Duration',
				algo: false,
				metricName: 'dec_event_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Speed Event Count',
				algo: false,
				metricName: 'speed_event_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Speed Event Duration',
				algo: false,
				metricName: 'speed_event_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Active Muscle Load',
				algo: false,
				metricName: 'active_muscle_load',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Active Muscle Power',
				algo: false,
				metricName: 'average_active_muscle_power',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Eccentric index',
				algo: false,
				metricName: 'eccentric_index',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'walk_time', algo: false, metricName: 'walk_time', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'run_distance',
				algo: false,
				metricName: 'run_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'run_distance',
				algo: false,
				metricName: 'run_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'directional_distance_left',
				algo: false,
				metricName: 'directional_distance_left',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'directional_distance_right',
				algo: false,
				metricName: 'directional_distance_right',
				defaultValue: 1
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'run_energy',
				algo: false,
				metricName: 'run_energy',
				defaultValue: 1
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'walk_distance',
				algo: false,
				metricName: 'walk_distance',
				defaultValue: 1
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'walk_energy',
				algo: false,
				metricName: 'walk_energy',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'directional_distance_forward',
				algo: false,
				metricName: 'directional_distance_forward',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'run_time', algo: false, metricName: 'run_time', defaultValue: 1 })
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'directional_distance_backward',
				algo: false,
				metricName: 'directional_distance_backward',
				defaultValue: 1
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'speed_events',
				algo: false,
				metricName: 'speed_events',
				defaultValue: 1
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'acceleration_events',
				algo: false,
				metricName: 'acceleration_events',
				defaultValue: 1
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'deceleration_events',
				algo: false,
				metricName: 'deceleration_events',
				defaultValue: 1
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'event_impacts_count index',
				algo: false,
				metricName: 'event_impacts_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'event_jumps_count index',
				algo: false,
				metricName: 'event_jumps_count',
				defaultValue: 1
			})
		);

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'external_work',
				algo: false,
				metricName: 'external_work',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'ext_work_over',
				algo: false,
				metricName: 'ext_work_over',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'ext_work_over_neg',
				algo: false,
				metricName: 'ext_work_over_neg',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'average_external_power',
				algo: false,
				metricName: 'average_external_power',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'ext_work_over_zone0_neg',
				algo: false,
				metricName: 'ext_work_over_zone0_neg',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'ext_work_over_zone1_neg',
				algo: false,
				metricName: 'ext_work_over_zone1_neg',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'ext_work_over_zone2_neg',
				algo: false,
				metricName: 'ext_work_over_zone2_neg',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'ext_work_over_zone0',
				algo: false,
				metricName: 'ext_work_over_zone0',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'ext_work_over_zone1',
				algo: false,
				metricName: 'ext_work_over_zone1',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'ext_work_over_zone2',
				algo: false,
				metricName: 'ext_work_over_zone2',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'tot_mechanical_events',
				algo: false,
				metricName: 'tot_mechanical_events',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'tot_burst_events',
				algo: false,
				metricName: 'tot_burst_events',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'tot_brake_events',
				algo: false,
				metricName: 'tot_brake_events',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'relative_speed_events',
				algo: false,
				metricName: 'relative_speed_events',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'relative_speed',
				algo: false,
				metricName: 'relative_speed',
				defaultValue: 1
			})
		);

		const iterproMetrics = [
			'cardio',
			'power',
			'speed',
			'acceleration',
			'deceleration',
			'impactintensity',
			'jumpheight',
			'relativespeed'
		];
		const numbers = [0, 1, 2, 3, 4, 5, 6];
		const kpis = ['distance', 'power', 'energy', 'time', 'events'];
		iterproMetrics.forEach((metric, index) => {
			numbers.forEach(number => {
				kpis.forEach(kpi => {
					const metricName = `${metric}_interval_ccd_zone_${number}_${kpi}`;
					const metricNameDetail = metricName.split('_').join(' ');
					this.metricsMapping.push(
						new DeviceMetricDescriptor({
							metricLabel: metricNameDetail,
							algo: false,
							metricName,
							defaultValue: 1
						})
					);
				});
			});
		});

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'RPE *',
				algo: true,
				metricName: 'rpe',
				defaultValue: 0
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'RPE TL *',
				algo: true,
				metricName: 'rpeTl',
				defaultValue: 0
			})
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

		this.metricsMapping = this.metricsMapping.map(val => {
			val.metricName = val.metricName.replace(/\./g, '_');
			return val;
		});

		const teamMappings: GpsProviderMapping = currentTeam._gpsProviderMapping;
		for (const m of teamMappings.rawMetrics) {
			const found = this.metricsMapping.find(x => x.metricName === m.name);
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

	getSessionsFromCsv(data: any[], team: Team): SessionPlayerData[] | null {
		return null;
	}

	getMetricsMapping(): DeviceMetricDescriptor[] {
		return this.metricsMapping;
	}
}
