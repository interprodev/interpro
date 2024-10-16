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
export class EtlGpsFieldwizAPIService implements BaseEtlGpsService {
	// TODO: Modificare metricsMapping l'array di metriche fieldwiz. Non abbiamo ancora la lista di metriche completa quindi quelle che ci sono sono placeholder
	private metricsMapping: DeviceMetricDescriptor[];

	constructor(private etlDateService: EtlDateDurationService, private currentTeam: Team) {
		this.metricsMapping = [];

		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Accel Medium',
				algo: false,
				metricName: 'ima_band2_accel_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Average Effort Count',
				algo: false,
				metricName: 'velocity_band2_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 1 Duration %',
				algo: false,
				metricName: 'velocity_band1_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'IMA Left M', algo: false, metricName: 'ima_left_m', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 3 Average Duration (Session)',
				algo: false,
				metricName: 'player_load_band3_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 8 Total Distance',
				algo: false,
				metricName: 'player_load_band8_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA CoD Right Medium',
				algo: false,
				metricName: 'ima_band2_right_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Unix Start Time',
				algo: false,
				metricName: 'start_time',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 3 Average Effort Count (Session)',
				algo: false,
				metricName: 'acceleration_band3_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'Unix End Time', algo: false, metricName: 'end_time', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 3 Total Distance',
				algo: false,
				metricName: 'heart_rate_band3_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'H Left', algo: false, metricName: 'ima_left_h', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 3 Total Effort Count',
				algo: false,
				metricName: 'heart_rate_band3_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Movement Load',
				algo: false,
				metricName: 'movement_load',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 6 Total Distance',
				algo: false,
				metricName: 'acceleration_band6_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 3 Average Power',
				algo: false,
				metricName: 'metabolic_power_band3_average_power',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Total Effort Count',
				algo: false,
				metricName: 'velocity_band7_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 1 Average Effort Count',
				algo: false,
				metricName: 'acceleration_band1_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 4 Average Distance (Session)',
				algo: false,
				metricName: 'player_load_band4_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 2 Duration %',
				algo: false,
				metricName: 'acceleration_band2_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Ex Eff',
				algo: false,
				metricName: 'explosive_efforts',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 7 Average Effort Count (Session)',
				algo: false,
				metricName: 'player_load_band7_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Max Effort Duration',
				algo: false,
				metricName: 'velocity_band3_max_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Decel Low',
				algo: false,
				metricName: 'ima_band1_decel_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Distance (Session)',
				algo: false,
				metricName: 'average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Min Effort Duration',
				algo: false,
				metricName: 'velocity_band2_min_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 12 O'Clock Low",
				algo: false,
				metricName: 'ima_band1_direction12_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 5 Total Duration %',
				algo: false,
				metricName: 'metabolic_power_band5_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 8 Average Distance (Session)',
				algo: false,
				metricName: 'player_load_band8_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 2 Average Distance',
				algo: false,
				metricName: 'player_load_band2_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Avg Effort Duration',
				algo: false,
				metricName: 'velocity_band4_average_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Distance Band 4 Total # Efforts',
				algo: false,
				metricName: 'velocity_band7_distance_band4_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Total Distance',
				algo: false,
				metricName: 'velocity_band4_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Distance Band 2 Total # Efforts',
				algo: false,
				metricName: 'velocity_band3_distance_band2_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Total Activities',
				algo: false,
				metricName: 'total_activities',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'MII Distance Interval 1',
				algo: false,
				metricName: 'max_intensity_interval_distance_interval_1',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'MII Distance Interval 2',
				algo: false,
				metricName: 'max_intensity_interval_distance_interval_2',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'MII Distance Interval 3',
				algo: false,
				metricName: 'max_intensity_interval_distance_interval_3',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'MII Player Load Interval 1',
				algo: false,
				metricName: 'max_intensity_interval_player_load_interval_1',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'MII Player Load Interval 2',
				algo: false,
				metricName: 'max_intensity_interval_player_load_interval_2',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'MII Player Load Interval 3',
				algo: false,
				metricName: 'max_intensity_interval_player_load_interval_3',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Max Effort Distance',
				algo: false,
				metricName: 'velocity_band2_max_effort_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Total Duration',
				algo: false,
				metricName: 'velocity_band2_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'HR 60-70% Mins',
				algo: false,
				metricName: 'heart_rate_band3_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Distance Band 6 Total # Efforts',
				algo: false,
				metricName: 'velocity_band7_distance_band6_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Recovery Band 3 Total # Efforts',
				algo: false,
				metricName: 'velocity_band3_recovery_band3_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Distance Band 6 Total # Efforts',
				algo: false,
				metricName: 'velocity_band8_distance_band6_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Max Vel (% Max)',
				algo: false,
				metricName: 'percentage_max_velocity',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Max HR (% Max)',
				algo: false,
				metricName: 'percentage_max_heart_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Aerobic Testing',
				algo: false,
				metricName: 'average_aerobictesting',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Total Jumps',
				algo: false,
				metricName: 'total_jumps',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Distance %',
				algo: false,
				metricName: 'velocity_band8_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 8 Average Effort Count (Session)',
				algo: false,
				metricName: 'acceleration_band8_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Avg HR (% Max)',
				algo: false,
				metricName: 'percentage_avg_heart_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 2 Average Effort Count (Session)',
				algo: false,
				metricName: 'acceleration_band2_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Average Distance',
				algo: false,
				metricName: 'velocity_band5_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Distance Band 2 Total # Efforts',
				algo: false,
				metricName: 'velocity_band6_distance_band2_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "10 O'Clock Average (Session)",
				algo: false,
				metricName: "10_o'clock_average_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 6 Total Duration',
				algo: false,
				metricName: 'acceleration_band6_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "High IMA 2 O'Clock (Session)",
				algo: false,
				metricName: "high_ima_2_o'clock_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 1 Total Duration %',
				algo: false,
				metricName: 'metabolic_power_band1_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 2 Total # Efforts',
				algo: false,
				metricName: 'metabolic_power_band2_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Avg Effort Duration',
				algo: false,
				metricName: 'velocity_band2_average_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Peak Meta Power',
				algo: false,
				metricName: 'peak_meta_power',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Meta Energy (KJ/kg)',
				algo: false,
				metricName: 'meta_energy_kj',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 2 Total Duration',
				algo: false,
				metricName: 'acceleration_band2_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Meta Energy (Cal/kg)',
				algo: false,
				metricName: 'meta_energy_cal',
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
				metricLabel: 'EDI',
				algo: false,
				metricName: 'equivalent_distance_index',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Average Duration',
				algo: false,
				metricName: 'velocity_band7_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 8 Average Distance (Session)',
				algo: false,
				metricName: 'acceleration_band8_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 3 Average Effort Count (Session)',
				algo: false,
				metricName: 'heart_rate_band3_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Distance Band 7 Total # Efforts',
				algo: false,
				metricName: 'velocity_band4_distance_band7_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Average Distance',
				algo: false,
				metricName: 'velocity_band6_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 5 Total Duration',
				algo: false,
				metricName: 'metabolic_power_band5_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Recovery Band 8 Total # Efforts',
				algo: false,
				metricName: 'velocity_band4_recovery_band8_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 4 Average Duration',
				algo: false,
				metricName: 'player_load_band4_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 6 Average Duration (Session)',
				algo: false,
				metricName: 'heart_rate_band6_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 1 Average Duration (Session)',
				algo: false,
				metricName: 'player_load_band1_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Average Duration (Session)',
				algo: false,
				metricName: 'velocity_band6_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "4 O'Clock Average (Session)",
				algo: false,
				metricName: "4_o'clock_average_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Total Distance',
				algo: false,
				metricName: 'velocity_band3_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Distance %',
				algo: false,
				metricName: 'velocity_band3_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 3 Distance %',
				algo: false,
				metricName: 'acceleration_band3_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 8 Total Duration %',
				algo: false,
				metricName: 'metabolic_power_band8_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Distance %',
				algo: false,
				metricName: 'velocity_band7_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 6 Average Duration',
				algo: false,
				metricName: 'acceleration_band6_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Average Distance (Session)',
				algo: false,
				metricName: 'velocity_band2_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Recovery Band 8 Total # Efforts',
				algo: false,
				metricName: 'velocity_band7_recovery_band8_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 7 Average Effort Count (Session)',
				algo: false,
				metricName: 'acceleration_band7_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 7 Average Duration (Session)',
				algo: false,
				metricName: 'acceleration_band7_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 6 O'Clock Medium",
				algo: false,
				metricName: 'ima_band2_direction6_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Max Effort Duration',
				algo: false,
				metricName: 'velocity_band8_max_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Avg Acceleration Load (Session)',
				algo: false,
				metricName: 'acceleration_load_average',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 2 Average Effort Count',
				algo: false,
				metricName: 'player_load_band2_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 8 Average Distance',
				algo: false,
				metricName: 'player_load_band8_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Recovery Band 4 Total # Efforts',
				algo: false,
				metricName: 'velocity_band3_recovery_band4_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Duration (avg)',
				algo: false,
				metricName: 'average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'HR 0-50% Mins (avg)',
				algo: false,
				metricName: 'heart_rate_band1_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 8 Average Distance',
				algo: false,
				metricName: 'heart_rate_band8_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Low Intensity Movement',
				algo: false,
				metricName: 'player_load_band2_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'QCODL', algo: false, metricName: 'qcodl', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 3 Total Distance',
				algo: false,
				metricName: 'player_load_band3_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 4 Total Duration',
				algo: false,
				metricName: 'metabolic_power_band4_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Recovery Band 2 Total # Efforts',
				algo: false,
				metricName: 'velocity_band5_recovery_band2_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Jumps/Minute',
				algo: false,
				metricName: 'jumps/minute',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 8 Duration %',
				algo: false,
				metricName: 'player_load_band8_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Average Effort Count (Session)',
				algo: false,
				metricName: 'velocity_band7_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Average Duration (Session)',
				algo: false,
				metricName: 'velocity_band5_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 6 Total Effort Count',
				algo: false,
				metricName: 'acceleration_band6_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Movement Load (time)',
				algo: false,
				metricName: 'movement_load_(time)',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 3 Average Effort Count',
				algo: false,
				metricName: 'acceleration_band3_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Start Time',
				algo: false,
				metricName: 'start_time_h',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'End Time', algo: false, metricName: 'end_time_h', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Avg Effort Duration',
				algo: false,
				metricName: 'velocity_band7_average_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Total Duration',
				algo: false,
				metricName: 'velocity_band7_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 3 Average Distance',
				algo: false,
				metricName: 'heart_rate_band3_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 8 Total Duration',
				algo: false,
				metricName: 'heart_rate_band8_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 4 Average Distance',
				algo: false,
				metricName: 'acceleration_band4_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Recovery Band 2 Total # Efforts',
				algo: false,
				metricName: 'velocity_band7_recovery_band2_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'H Left',
				algo: false,
				metricName: 'ima_band3_left_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Distance Band 5 Total # Efforts',
				algo: false,
				metricName: 'velocity_band7_distance_band5_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 7 Total Duration',
				algo: false,
				metricName: 'heart_rate_band7_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Recovery Band 4 Total # Efforts',
				algo: false,
				metricName: 'velocity_band5_recovery_band4_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 8 Average Duration (Session)',
				algo: false,
				metricName: 'acceleration_band8_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Recovery Band 7 Total # Efforts',
				algo: false,
				metricName: 'velocity_band5_recovery_band7_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Lower Body Soreness',
				algo: false,
				metricName: 'lowerbodysoreness',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 3 Total Duration %',
				algo: false,
				metricName: 'metabolic_power_band3_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Min Effort Distance',
				algo: false,
				metricName: 'velocity_band5_min_effort_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 5 Average Distance (Session)',
				algo: false,
				metricName: 'acceleration_band5_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Average Effort Count (Session)',
				algo: false,
				metricName: 'velocity_band3_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 5 Total Distance',
				algo: false,
				metricName: 'player_load_band5_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 7 Average Effort Count',
				algo: false,
				metricName: 'player_load_band7_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 7 Total Effort Count',
				algo: false,
				metricName: 'heart_rate_band7_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 8 Average Duration',
				algo: false,
				metricName: 'heart_rate_band8_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 2 Total Distance',
				algo: false,
				metricName: 'acceleration_band2_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Min Effort Duration',
				algo: false,
				metricName: 'velocity_band6_min_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 1 Average Distance (Session)',
				algo: false,
				metricName: 'acceleration_band1_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 8 Distance %',
				algo: false,
				metricName: 'heart_rate_band8_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 4 Average Duration',
				algo: false,
				metricName: 'acceleration_band4_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Avg Effort Duration',
				algo: false,
				metricName: 'velocity_band8_average_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 1 Average Duration',
				algo: false,
				metricName: 'velocity_band1_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 7 Total Duration',
				algo: false,
				metricName: 'metabolic_power_band7_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 2 Average Effort Count',
				algo: false,
				metricName: 'acceleration_band2_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Distance Band 3 Total # Efforts',
				algo: false,
				metricName: 'velocity_band5_distance_band3_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Distance Band 7 Total # Efforts',
				algo: false,
				metricName: 'velocity_band7_distance_band7_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Distance Band 4 Total # Efforts',
				algo: false,
				metricName: 'velocity_band8_distance_band4_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 4 Average Effort Count',
				algo: false,
				metricName: 'player_load_band4_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 7 Average Distance',
				algo: false,
				metricName: 'acceleration_band7_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 5 Total Duration',
				algo: false,
				metricName: 'player_load_band5_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'H Acc',
				algo: false,
				metricName: 'ima_band3_accel_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Avg Effort Distance',
				algo: false,
				metricName: 'velocity_band8_average_effort_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Distance Band 4 Total # Efforts',
				algo: false,
				metricName: 'velocity_band5_distance_band4_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA CoD Right Low',
				algo: false,
				metricName: 'ima_band1_right_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 4 Total Duration',
				algo: false,
				metricName: 'player_load_band4_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average RPE',
				algo: false,
				metricName: 'average_rpe',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Distance Band 8 Total # Efforts',
				algo: false,
				metricName: 'velocity_band8_distance_band8_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Total Effort Count',
				algo: false,
				metricName: 'velocity_band5_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 4 O'Clock High",
				algo: false,
				metricName: 'ima_band3_direction4_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "8 O'Clock Average (Session)",
				algo: false,
				metricName: "8_o'clock_average_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 5 Average Effort Count (Session)',
				algo: false,
				metricName: 'heart_rate_band5_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "High IMA 12 O'Clock (Session)",
				algo: false,
				metricName: "high_ima_12_o'clock_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 8 Average Distance (Session)',
				algo: false,
				metricName: 'heart_rate_band8_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Recovery Band 3 Total # Efforts',
				algo: false,
				metricName: 'velocity_band5_recovery_band3_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 1 Total Distance',
				algo: false,
				metricName: 'acceleration_band1_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 4 Average Distance (Session)',
				algo: false,
				metricName: 'acceleration_band4_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 1 Total Distance',
				algo: false,
				metricName: 'velocity_band1_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 8 Average Power',
				algo: false,
				metricName: 'metabolic_power_band8_average_power',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 7 Average Duration (Session)',
				algo: false,
				metricName: 'player_load_band7_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Average Distance (Session)',
				algo: false,
				metricName: 'velocity_band4_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "1 O'Clock Average (Session)",
				algo: false,
				metricName: "1_o'clock_average_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 4 Total Effort Count',
				algo: false,
				metricName: 'player_load_band4_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 6 Distance %',
				algo: false,
				metricName: 'acceleration_band6_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 7 Total Effort Count',
				algo: false,
				metricName: 'acceleration_band7_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Average Effort Count (Session)',
				algo: false,
				metricName: 'velocity_band5_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Distance Band 8 Total # Efforts',
				algo: false,
				metricName: 'velocity_band5_distance_band8_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 6 Total Distance',
				algo: false,
				metricName: 'player_load_band6_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 4 Total Duration %',
				algo: false,
				metricName: 'metabolic_power_band4_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Duration %',
				algo: false,
				metricName: 'velocity_band8_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'IMA Acc M', algo: false, metricName: 'ima_acc_m', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 8 Average Effort Count',
				algo: false,
				metricName: 'player_load_band8_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 4 Distance %',
				algo: false,
				metricName: 'acceleration_band4_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 1 Distance %',
				algo: false,
				metricName: 'player_load_band1_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 10 O'Clock Medium",
				algo: false,
				metricName: 'ima_band2_direction10_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 3 Average Distance',
				algo: false,
				metricName: 'acceleration_band3_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA CoD Left Low',
				algo: false,
				metricName: 'ima_band1_left_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 5 Average Effort Count',
				algo: false,
				metricName: 'acceleration_band5_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 1 Average Distance',
				algo: false,
				metricName: 'velocity_band1_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Recovery Band 3 Total # Efforts',
				algo: false,
				metricName: 'velocity_band2_recovery_band3_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 2 Duration %',
				algo: false,
				metricName: 'heart_rate_band2_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Duration %',
				algo: false,
				metricName: 'velocity_band6_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'Weight', algo: false, metricName: 'weight', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Distance Band 2 Total # Efforts',
				algo: false,
				metricName: 'velocity_band5_distance_band2_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 5 Duration %',
				algo: false,
				metricName: 'heart_rate_band5_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Average Effort Count (Session)',
				algo: false,
				metricName: 'velocity_band4_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Average Duration (Session)',
				algo: false,
				metricName: 'velocity_band8_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Recovery Band 4 Total # Efforts',
				algo: false,
				metricName: 'velocity_band6_recovery_band4_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Duration %',
				algo: false,
				metricName: 'velocity_band3_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 7 O'Clock Medium",
				algo: false,
				metricName: 'ima_band2_direction7_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Distance Band 7 Total # Efforts',
				algo: false,
				metricName: 'velocity_band6_distance_band7_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 11 O'Clock Low",
				algo: false,
				metricName: 'ima_band1_direction11_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 6 Distance %',
				algo: false,
				metricName: 'heart_rate_band6_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 8 Total Duration',
				algo: false,
				metricName: 'metabolic_power_band8_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 1 Duration %',
				algo: false,
				metricName: 'acceleration_band1_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'H Dec',
				algo: false,
				metricName: 'ima_band3_decel_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 1 Average Duration',
				algo: false,
				metricName: 'acceleration_band1_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Average Duration',
				algo: false,
				metricName: 'velocity_band5_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 2 Average Duration',
				algo: false,
				metricName: 'heart_rate_band2_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "5 O'Clock Average (Session)",
				algo: false,
				metricName: "5_o'clock_average_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'RHIE Bout Recovery - Min',
				algo: false,
				metricName: 'rhie_min_bout_recovery',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'RHIE Bout Recovery - Max',
				algo: false,
				metricName: 'rhie_max_bout_recovery',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'RHIE Bout Recovery - Mean',
				algo: false,
				metricName: 'rhie_average_bout_recovery',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 6 O'Clock High",
				algo: false,
				metricName: 'ima_band3_direction6_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 6 Total Effort Count',
				algo: false,
				metricName: 'player_load_band6_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 6 Average Distance',
				algo: false,
				metricName: 'acceleration_band6_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Distance Band 7 Total # Efforts',
				algo: false,
				metricName: 'velocity_band2_distance_band7_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'H Right',
				algo: false,
				metricName: 'ima_band3_right_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Distance Band 4 Total # Efforts',
				algo: false,
				metricName: 'velocity_band3_distance_band4_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'QDEC', algo: false, metricName: 'qdec', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Distance Band 8 Total # Efforts',
				algo: false,
				metricName: 'velocity_band2_distance_band8_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Upper Body Soreness',
				algo: false,
				metricName: 'upperbodysoreness',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Recovery Band 7 Total # Efforts',
				algo: false,
				metricName: 'velocity_band3_recovery_band7_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Distance %',
				algo: false,
				metricName: 'velocity_band2_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "High IMA 9 O'Clock (Session)",
				algo: false,
				metricName: "high_ima_9_o'clock_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 5 Distance %',
				algo: false,
				metricName: 'heart_rate_band5_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Max Effort Duration',
				algo: false,
				metricName: 'velocity_band5_max_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Recovery Band 7 Total # Efforts',
				algo: false,
				metricName: 'velocity_band7_recovery_band7_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Average Distance (Session)',
				algo: false,
				metricName: 'velocity_band3_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Max Effort Duration',
				algo: false,
				metricName: 'velocity_band6_max_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 2 Distance %',
				algo: false,
				metricName: 'heart_rate_band2_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 7 Average Duration',
				algo: false,
				metricName: 'acceleration_band7_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'Team Name', algo: false, metricName: 'team_name', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'Day Name', algo: false, metricName: 'day_name', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'Month Name', algo: false, metricName: 'month_name', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Period Name',
				algo: false,
				metricName: 'period_name',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'H Jumps ', algo: false, metricName: 'jumps_(>20cm)', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 4 Total Effort Count',
				algo: false,
				metricName: 'heart_rate_band4_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 9 O'Clock Low",
				algo: false,
				metricName: 'ima_band1_direction9_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Distance %',
				algo: false,
				metricName: 'velocity_band4_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Distance Band 2 Total # Efforts',
				algo: false,
				metricName: 'velocity_band8_distance_band2_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Recovery Band 2 Total # Efforts',
				algo: false,
				metricName: 'velocity_band4_recovery_band2_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'totJumps', algo: false, metricName: 'totjumps', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Average Duration (Session)',
				algo: false,
				metricName: 'velocity_band2_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 6 Average Duration',
				algo: false,
				metricName: 'player_load_band6_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'HR 50-60% Mins',
				algo: false,
				metricName: 'heart_rate_band2_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Total Duration',
				algo: false,
				metricName: 'velocity_band6_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'HR 0-50% Mins',
				algo: false,
				metricName: 'heart_rate_band1_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 3 Total Distance',
				algo: false,
				metricName: 'acceleration_band3_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "High IMA 6 O'Clock (Session)",
				algo: false,
				metricName: "high_ima_6_o'clock_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Total Duration',
				algo: false,
				metricName: 'velocity_band5_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 7 Total # Efforts',
				algo: false,
				metricName: 'metabolic_power_band7_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Aerobic Testing',
				algo: false,
				metricName: 'aerobictesting',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 8 Total Distance',
				algo: false,
				metricName: 'acceleration_band8_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 1 Total Duration',
				algo: false,
				metricName: 'acceleration_band1_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Movement Load/Min',
				algo: false,
				metricName: 'movement_load/min',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA High Avg (Session)',
				algo: false,
				metricName: 'ima_high_avg_(session)',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 8 Total Effort Count',
				algo: false,
				metricName: 'acceleration_band8_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 8 O'Clock Medium",
				algo: false,
				metricName: 'ima_band2_direction8_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Profile Max Heart Rate',
				algo: false,
				metricName: 'athlete_max_hr',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 4 Average Distance',
				algo: false,
				metricName: 'heart_rate_band4_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Profile Max Velocity',
				algo: false,
				metricName: 'athlete_max_velocity',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'TRIMP/PL', algo: false, metricName: 'trimp/pl', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'HR >90% Mins',
				algo: false,
				metricName: 'heart_rate_band6_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Average Duration',
				algo: false,
				metricName: 'velocity_band3_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Distance Band 4 Total # Efforts',
				algo: false,
				metricName: 'velocity_band6_distance_band4_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Total Effort Count',
				algo: false,
				metricName: 'velocity_band4_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 4 Duration %',
				algo: false,
				metricName: 'player_load_band4_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Avg Effort Duration',
				algo: false,
				metricName: 'velocity_band3_average_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Average Duration',
				algo: false,
				metricName: 'velocity_band6_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 4 Average Effort Count',
				algo: false,
				metricName: 'heart_rate_band4_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 2 Total Distance',
				algo: false,
				metricName: 'player_load_band2_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Total Distance',
				algo: false,
				metricName: 'velocity_band6_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Distance Band 8 Total # Efforts',
				algo: false,
				metricName: 'velocity_band6_distance_band8_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'totHIMA', algo: false, metricName: 'tothima', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 6 Average Effort Count (Session)',
				algo: false,
				metricName: 'player_load_band6_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "High IMA 10 O'Clock (Session)",
				algo: false,
				metricName: "high_ima_10_o'clock_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 8 Distance %',
				algo: false,
				metricName: 'acceleration_band8_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Recovery Band 5 Total # Efforts',
				algo: false,
				metricName: 'velocity_band7_recovery_band5_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'CI/min', algo: false, metricName: 'ci/min', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 4 Total Distance',
				algo: false,
				metricName: 'acceleration_band4_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Average Distance (Session)',
				algo: false,
				metricName: 'velocity_band8_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 8 Average Effort Count',
				algo: false,
				metricName: 'acceleration_band8_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Distance Band 7 Total # Efforts',
				algo: false,
				metricName: 'velocity_band8_distance_band7_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 4 Distance %',
				algo: false,
				metricName: 'player_load_band4_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Distance Band 7 Total # Efforts',
				algo: false,
				metricName: 'velocity_band5_distance_band7_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 5 Total Effort Count',
				algo: false,
				metricName: 'heart_rate_band5_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 7 Average Effort Count (Session)',
				algo: false,
				metricName: 'heart_rate_band7_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 1 Average Distance',
				algo: false,
				metricName: 'player_load_band1_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Recovery Band 3 Total # Efforts',
				algo: false,
				metricName: 'velocity_band8_recovery_band3_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Recovery Band 5 Total # Efforts',
				algo: false,
				metricName: 'velocity_band5_recovery_band5_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 7 Total Distance',
				algo: false,
				metricName: 'heart_rate_band7_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Average Distance (Session)',
				algo: false,
				metricName: 'velocity_band5_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'IMA Dec L', algo: false, metricName: 'ima_dec_l', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Min Effort Duration',
				algo: false,
				metricName: 'velocity_band3_min_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Average Effort Count',
				algo: false,
				metricName: 'velocity_band6_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Jump Count Band 4',
				algo: false,
				metricName: 'ima_band4_jump_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Jump Count Band 5',
				algo: false,
				metricName: 'ima_band5_jump_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Jump Count Band 6',
				algo: false,
				metricName: 'ima_band6_jump_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Jump Count Band 7',
				algo: false,
				metricName: 'ima_band7_jump_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Jump Count Band 8',
				algo: false,
				metricName: 'ima_band8_jump_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 1 Count',
				algo: false,
				metricName: 'imaimpacts_band1_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 2 Count',
				algo: false,
				metricName: 'imaimpacts_band2_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 3 Count',
				algo: false,
				metricName: 'imaimpacts_band3_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 4 Count',
				algo: false,
				metricName: 'imaimpacts_band4_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 5 Count',
				algo: false,
				metricName: 'imaimpacts_band5_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 6 Count',
				algo: false,
				metricName: 'imaimpacts_band6_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 7 Count',
				algo: false,
				metricName: 'imaimpacts_band7_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 8 Count',
				algo: false,
				metricName: 'imaimpacts_band8_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 1 Average Count',
				algo: false,
				metricName: 'imaimpacts_band1_average_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 2 Average Count',
				algo: false,
				metricName: 'imaimpacts_band2_average_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 3 Average Count',
				algo: false,
				metricName: 'imaimpacts_band3_average_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 4 Average Count',
				algo: false,
				metricName: 'imaimpacts_band4_average_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 5 Average Count',
				algo: false,
				metricName: 'imaimpacts_band5_average_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 6 Average Count',
				algo: false,
				metricName: 'imaimpacts_band6_average_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 7 Average Count',
				algo: false,
				metricName: 'imaimpacts_band7_average_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 8 Average Count',
				algo: false,
				metricName: 'imaimpacts_band8_average_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 1 Average Count (Session)',
				algo: false,
				metricName: 'imaimpacts_band1_average_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 2 Average Count (Session)',
				algo: false,
				metricName: 'imaimpacts_band2_average_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 3 Average Count (Session)',
				algo: false,
				metricName: 'imaimpacts_band3_average_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 4 Average Count (Session)',
				algo: false,
				metricName: 'imaimpacts_band4_average_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 5 Average Count (Session)',
				algo: false,
				metricName: 'imaimpacts_band5_average_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 6 Average Count (Session)',
				algo: false,
				metricName: 'imaimpacts_band6_average_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 7 Average Count (Session)',
				algo: false,
				metricName: 'imaimpacts_band7_average_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Impacts Band 8 Average Count (Session)',
				algo: false,
				metricName: 'imaimpacts_band8_average_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Density',
				algo: false,
				metricName: 'acceleration_density',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Density Index',
				algo: false,
				metricName: 'accel_load_density_index',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Total Acceleration Load',
				algo: false,
				metricName: 'acceleration_load_total',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Recovery Band 6 Total # Efforts',
				algo: false,
				metricName: 'velocity_band3_recovery_band6_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Max Effort Distance',
				algo: false,
				metricName: 'velocity_band3_max_effort_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Distance Band 2 Total # Efforts',
				algo: false,
				metricName: 'velocity_band2_distance_band2_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 6 Average Effort Count',
				algo: false,
				metricName: 'heart_rate_band6_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Avg Effort Distance',
				algo: false,
				metricName: 'velocity_band7_average_effort_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 5 O'Clock Low",
				algo: false,
				metricName: 'ima_band1_direction5_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 7 Average Distance (Session)',
				algo: false,
				metricName: 'acceleration_band7_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Right L',
				algo: false,
				metricName: 'ima_right_l',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 6 Total Duration',
				algo: false,
				metricName: 'player_load_band6_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 7 Average Power',
				algo: false,
				metricName: 'metabolic_power_band7_average_power',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'HR 50-60% Mins (avg)',
				algo: false,
				metricName: 'heart_rate_band2_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 5 Duration %',
				algo: false,
				metricName: 'acceleration_band5_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 1 Duration %',
				algo: false,
				metricName: 'player_load_band1_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 7 Average Duration',
				algo: false,
				metricName: 'player_load_band7_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'totIMA', algo: false, metricName: 'totima', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: '1RM Deadlift',
				algo: false,
				metricName: '1rmdeadlift',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 5 Average Distance (Session)',
				algo: false,
				metricName: 'player_load_band5_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 6 Average Power',
				algo: false,
				metricName: 'metabolic_power_band6_average_power',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Total Distance',
				algo: false,
				metricName: 'velocity_band2_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "High IMA 5 O'Clock (Session)",
				algo: false,
				metricName: "high_ima_5_o'clock_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 3 Average Distance',
				algo: false,
				metricName: 'player_load_band3_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'RHIE Total Bouts',
				algo: false,
				metricName: 'rhie_bout_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Min Effort Duration',
				algo: false,
				metricName: 'velocity_band4_min_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Distance Band 6 Total # Efforts',
				algo: false,
				metricName: 'velocity_band3_distance_band6_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 4 Total # Efforts',
				algo: false,
				metricName: 'metabolic_power_band4_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 7 Total Duration %',
				algo: false,
				metricName: 'metabolic_power_band7_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 5 O'Clock Medium",
				algo: false,
				metricName: 'ima_band2_direction5_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "7 O'Clock Average (Session)",
				algo: false,
				metricName: "7_o'clock_average_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'HR 70-80% Mins',
				algo: false,
				metricName: 'heart_rate_band4_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Recovery Band 4 Total # Efforts',
				algo: false,
				metricName: 'velocity_band8_recovery_band4_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 2 Total Effort Count',
				algo: false,
				metricName: 'heart_rate_band2_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 10 O'Clock High",
				algo: false,
				metricName: 'ima_band3_direction10_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Distance Band 8 Total # Efforts',
				algo: false,
				metricName: 'velocity_band3_distance_band8_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 8 Average Distance',
				algo: false,
				metricName: 'acceleration_band8_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 5 Total Distance',
				algo: false,
				metricName: 'heart_rate_band5_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "High IMA 3 O'Clock (Session)",
				algo: false,
				metricName: "high_ima_3_o'clock_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Recovery Band 4 Total # Efforts',
				algo: false,
				metricName: 'velocity_band7_recovery_band4_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Average Effort Count (Session)',
				algo: false,
				metricName: 'velocity_band6_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 5 Total Distance',
				algo: false,
				metricName: 'acceleration_band5_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Recovery Band 6 Total # Efforts',
				algo: false,
				metricName: 'velocity_band4_recovery_band6_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 7 Distance %',
				algo: false,
				metricName: 'acceleration_band7_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Recovery Band 4 Total # Efforts',
				algo: false,
				metricName: 'velocity_band4_recovery_band4_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 6 Average Duration',
				algo: false,
				metricName: 'heart_rate_band6_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Average Distance',
				algo: false,
				metricName: 'velocity_band3_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 8 Distance %',
				algo: false,
				metricName: 'player_load_band8_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "2 O'Clock Average (Session)",
				algo: false,
				metricName: "2_o'clock_average_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Distance Band 4 Total # Efforts',
				algo: false,
				metricName: 'velocity_band4_distance_band4_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Recovery Band 7 Total # Efforts',
				algo: false,
				metricName: 'velocity_band2_recovery_band7_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 4 Average Power',
				algo: false,
				metricName: 'metabolic_power_band4_average_power',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Average Duration (Session)',
				algo: false,
				metricName: 'velocity_band3_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: '%R/L', algo: false, metricName: '%r/l', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'TRIMP (avg)',
				algo: false,
				metricName: 'trimp_(avg)',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 3 Average Distance (Session)',
				algo: false,
				metricName: 'player_load_band3_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average 1RM Deadlift',
				algo: false,
				metricName: 'average_1rmdeadlift',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Max Effort Duration',
				algo: false,
				metricName: 'velocity_band7_max_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 1 Average Duration (Session)',
				algo: false,
				metricName: 'acceleration_band1_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 3 Total Duration',
				algo: false,
				metricName: 'acceleration_band3_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: '1RM Squat', algo: false, metricName: '1rmsquat', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Avg Effort Distance',
				algo: false,
				metricName: 'velocity_band2_average_effort_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Left High CoD (Session)',
				algo: false,
				metricName: 'left_high_cod_(session)',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 4 Average Effort Count',
				algo: false,
				metricName: 'acceleration_band4_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'RHIE Effort Duration - Max',
				algo: false,
				metricName: 'rhie_max_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'RHIE Effort Duration - Mean',
				algo: false,
				metricName: 'rhie_average_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 1 Total Duration',
				algo: false,
				metricName: 'velocity_band1_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 1 Total Distance',
				algo: false,
				metricName: 'player_load_band1_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Recovery Band 8 Total # Efforts',
				algo: false,
				metricName: 'velocity_band2_recovery_band8_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 7 Average Distance',
				algo: false,
				metricName: 'heart_rate_band7_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Jump Count Low Band',
				algo: false,
				metricName: 'ima_band1_jump_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Jump Count Med Band',
				algo: false,
				metricName: 'ima_band2_jump_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 6 Total Duration %',
				algo: false,
				metricName: 'metabolic_power_band6_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Jump Count High Band',
				algo: false,
				metricName: 'ima_band3_jump_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 6 Total # Efforts',
				algo: false,
				metricName: 'metabolic_power_band6_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 6 Total Duration',
				algo: false,
				metricName: 'metabolic_power_band6_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Distance %',
				algo: false,
				metricName: 'velocity_band5_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Average Distance',
				algo: false,
				metricName: 'velocity_band4_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 2 Average Effort Count',
				algo: false,
				metricName: 'heart_rate_band2_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 5 O'Clock High",
				algo: false,
				metricName: 'ima_band3_direction5_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 1 Total Duration',
				algo: false,
				metricName: 'player_load_band1_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average 1RM Bench Pull',
				algo: false,
				metricName: 'average_1rmbenchpull',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 1 Total Distance',
				algo: false,
				metricName: 'heart_rate_band1_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Avg Effort Duration',
				algo: false,
				metricName: 'velocity_band6_average_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 3 Total Duration',
				algo: false,
				metricName: 'metabolic_power_band3_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Distance Band 3 Total # Efforts',
				algo: false,
				metricName: 'velocity_band7_distance_band3_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 2 Total Duration',
				algo: false,
				metricName: 'metabolic_power_band2_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: '1RM Bench Press',
				algo: false,
				metricName: '1rmbenchpress',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 5 Average Distance',
				algo: false,
				metricName: 'acceleration_band5_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Recovery Band 6 Total # Efforts',
				algo: false,
				metricName: 'velocity_band7_recovery_band6_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 3 Total Duration',
				algo: false,
				metricName: 'player_load_band3_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 4 Average Duration',
				algo: false,
				metricName: 'heart_rate_band4_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 2 Average Effort Count (Session)',
				algo: false,
				metricName: 'player_load_band2_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 2 O'Clock Medium",
				algo: false,
				metricName: 'ima_band2_direction2_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 6 O'Clock Low",
				algo: false,
				metricName: 'ima_band1_direction6_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 1 Total Duration',
				algo: false,
				metricName: 'metabolic_power_band1_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 2 Distance %',
				algo: false,
				metricName: 'acceleration_band2_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 7 Duration %',
				algo: false,
				metricName: 'heart_rate_band7_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Distance Band 6 Total # Efforts',
				algo: false,
				metricName: 'velocity_band5_distance_band6_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average 1RM Squat',
				algo: false,
				metricName: 'average_1rmsquat',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Max Effort Distance',
				algo: false,
				metricName: 'velocity_band4_max_effort_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 3 O'Clock High",
				algo: false,
				metricName: 'ima_band3_direction3_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 7 Average Effort Count',
				algo: false,
				metricName: 'heart_rate_band7_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 3 Total # Efforts',
				algo: false,
				metricName: 'metabolic_power_band3_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'HR >90% Mins (avg)',
				algo: false,
				metricName: 'heart_rate_band6_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 6 Average Distance (Session)',
				algo: false,
				metricName: 'acceleration_band6_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Total Effort Count',
				algo: false,
				metricName: 'velocity_band3_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'CI/PL', algo: false, metricName: 'ci/pl', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Min Effort Distance',
				algo: false,
				metricName: 'velocity_band3_min_effort_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 3 Average Distance (Session)',
				algo: false,
				metricName: 'acceleration_band3_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 5 Average Duration',
				algo: false,
				metricName: 'acceleration_band5_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "3 O'Clock Average (Session)",
				algo: false,
				metricName: "3_o'clock_average_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 3 Duration %',
				algo: false,
				metricName: 'heart_rate_band3_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 6 Duration %',
				algo: false,
				metricName: 'heart_rate_band6_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Lower Body Soreness',
				algo: false,
				metricName: 'average_lowerbodysoreness',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'HJumps/totJumps',
				algo: false,
				metricName: 'hjumps/totjumps',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Average Effort Count',
				algo: false,
				metricName: 'velocity_band3_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Total Effort Count',
				algo: false,
				metricName: 'velocity_band8_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 7 Duration %',
				algo: false,
				metricName: 'player_load_band7_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 4 Average Effort Count (Session)',
				algo: false,
				metricName: 'acceleration_band4_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 1 Average Distance (Session)',
				algo: false,
				metricName: 'player_load_band1_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Peak Power',
				algo: false,
				metricName: 'average_peakpower',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 1 O'Clock Medium",
				algo: false,
				metricName: 'ima_band2_direction1_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 7 Average Duration (Session)',
				algo: false,
				metricName: 'heart_rate_band7_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Sleep Quality',
				algo: false,
				metricName: 'average_sleepquality',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 5 Average Duration',
				algo: false,
				metricName: 'heart_rate_band5_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 8 Total Effort Count',
				algo: false,
				metricName: 'player_load_band8_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 2 Average Distance',
				algo: false,
				metricName: 'heart_rate_band2_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 3 Total Effort Count',
				algo: false,
				metricName: 'acceleration_band3_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 2 Average Effort Count (Session)',
				algo: false,
				metricName: 'heart_rate_band2_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 1 Average Distance',
				algo: false,
				metricName: 'heart_rate_band1_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Min Effort Distance',
				algo: false,
				metricName: 'velocity_band4_min_effort_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 1 Total Distance',
				algo: false,
				metricName: 'metabolic_power_band1_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 2 Total Distance',
				algo: false,
				metricName: 'metabolic_power_band2_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 3 Total Distance',
				algo: false,
				metricName: 'metabolic_power_band3_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 4 Total Distance',
				algo: false,
				metricName: 'metabolic_power_band4_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 5 Total Distance',
				algo: false,
				metricName: 'metabolic_power_band5_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 6 Total Distance',
				algo: false,
				metricName: 'metabolic_power_band6_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 7 Total Distance',
				algo: false,
				metricName: 'metabolic_power_band7_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 8 Total Distance',
				algo: false,
				metricName: 'metabolic_power_band8_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Avg Effort Distance',
				algo: false,
				metricName: 'velocity_band3_average_effort_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 3 Average Duration (Session)',
				algo: false,
				metricName: 'acceleration_band3_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 3 Average Effort Count',
				algo: false,
				metricName: 'player_load_band3_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 6 Duration %',
				algo: false,
				metricName: 'player_load_band6_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'CI', algo: false, metricName: 'ci', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 8 Average Duration (Session)',
				algo: false,
				metricName: 'player_load_band8_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Distance Band 8 Total # Efforts',
				algo: false,
				metricName: 'velocity_band4_distance_band8_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 7 Total Duration',
				algo: false,
				metricName: 'player_load_band7_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 2 Average Distance (Session)',
				algo: false,
				metricName: 'acceleration_band2_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Total Effort Count',
				algo: false,
				metricName: 'velocity_band6_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "High IMA 4 O'Clock (Session)",
				algo: false,
				metricName: "high_ima_4_o'clock_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 7 Total Effort Count',
				algo: false,
				metricName: 'player_load_band7_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 1 Distance %',
				algo: false,
				metricName: 'velocity_band1_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 7 O'Clock High",
				algo: false,
				metricName: 'ima_band3_direction7_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Max Effort Distance',
				algo: false,
				metricName: 'velocity_band7_max_effort_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 8 Average Duration',
				algo: false,
				metricName: 'player_load_band8_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 4 Average Effort Count (Session)',
				algo: false,
				metricName: 'player_load_band4_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Right M',
				algo: false,
				metricName: 'ima_right_m',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Movement Load (avg) (time)',
				algo: false,
				metricName: 'movement_load_(avg)_(time)',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Average Distance',
				algo: false,
				metricName: 'velocity_band7_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 6 Average Duration (Session)',
				algo: false,
				metricName: 'player_load_band6_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 1 Distance %',
				algo: false,
				metricName: 'heart_rate_band1_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "High IMA 1 O'Clock (Session)",
				algo: false,
				metricName: "high_ima_1_o'clock_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Max Effort Duration',
				algo: false,
				metricName: 'velocity_band4_max_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Total Distance',
				algo: false,
				metricName: 'velocity_band5_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 1 Average Duration',
				algo: false,
				metricName: 'heart_rate_band1_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Recovery Band 2 Total # Efforts',
				algo: false,
				metricName: 'velocity_band2_recovery_band2_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 5 Distance %',
				algo: false,
				metricName: 'acceleration_band5_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Average Effort Count',
				algo: false,
				metricName: 'velocity_band4_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Recovery Band 5 Total # Efforts',
				algo: false,
				metricName: 'velocity_band4_recovery_band5_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Duration %',
				algo: false,
				metricName: 'velocity_band4_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Position Name',
				algo: false,
				metricName: 'position_name',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 1 Average Power',
				algo: false,
				metricName: 'metabolic_power_band1_average_power',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Average Distance',
				algo: false,
				metricName: 'velocity_band8_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 2 Average Distance',
				algo: false,
				metricName: 'acceleration_band2_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Upper Body Soreness',
				algo: false,
				metricName: 'average_upperbodysoreness',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 5 Average Effort Count',
				algo: false,
				metricName: 'player_load_band5_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average 1RM Bench Press',
				algo: false,
				metricName: 'average_1rmbenchpress',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'HR 60-70% Mins (avg)',
				algo: false,
				metricName: 'heart_rate_band3_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Distance Band 6 Total # Efforts',
				algo: false,
				metricName: 'velocity_band2_distance_band6_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 4 Total Distance',
				algo: false,
				metricName: 'heart_rate_band4_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'W:R Ratio', algo: false, metricName: 'w:r_ratio', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 9 O'Clock Medium",
				algo: false,
				metricName: 'ima_band2_direction9_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Max Effort Duration',
				algo: false,
				metricName: 'velocity_band2_max_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: '% HI Explosive Efforts',
				algo: false,
				metricName: '%_hi_explosive_efforts',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 4 Average Distance (Session)',
				algo: false,
				metricName: 'heart_rate_band4_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'TRIMP', algo: false, metricName: 'trimp', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA CoD Left Medium',
				algo: false,
				metricName: 'ima_band2_left_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Explosive Efforts (Average)',
				algo: false,
				metricName: 'explosive_efforts_(average)',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 2 O'Clock High",
				algo: false,
				metricName: 'ima_band3_direction2_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 6 Distance %',
				algo: false,
				metricName: 'player_load_band6_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 3 Distance %',
				algo: false,
				metricName: 'player_load_band3_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Recovery Band 6 Total # Efforts',
				algo: false,
				metricName: 'velocity_band5_recovery_band6_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'HR 80-90% Mins',
				algo: false,
				metricName: 'heart_rate_band5_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 6 Average Effort Count (Session)',
				algo: false,
				metricName: 'acceleration_band6_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'HR 80-90% Mins (avg)',
				algo: false,
				metricName: 'heart_rate_band5_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 2 Average Duration',
				algo: false,
				metricName: 'acceleration_band2_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 4 O'Clock Low",
				algo: false,
				metricName: 'ima_band1_direction4_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "9 O'Clock Average (Session)",
				algo: false,
				metricName: "9_o'clock_average_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 5 Average Duration (Session)',
				algo: false,
				metricName: 'acceleration_band5_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'H Right', algo: false, metricName: 'ima_right_h', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 1 Average Duration (Session)',
				algo: false,
				metricName: 'velocity_band1_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 3 O'Clock Medium",
				algo: false,
				metricName: 'ima_band2_direction3_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 7 Average Duration',
				algo: false,
				metricName: 'heart_rate_band7_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Min Effort Distance',
				algo: false,
				metricName: 'velocity_band7_min_effort_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 8 Average Duration (Session)',
				algo: false,
				metricName: 'heart_rate_band8_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'PL Min',
				algo: false,
				metricName: 'player_load_per_minute',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Per Metre',
				algo: false,
				metricName: 'player_load_per_metre',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Meterage Per Minute',
				algo: false,
				metricName: 'meterage_per_minute',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Min Effort Distance',
				algo: false,
				metricName: 'velocity_band2_min_effort_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'QCODR', algo: false, metricName: 'qcodr', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Distance Band 3 Total # Efforts',
				algo: false,
				metricName: 'velocity_band3_distance_band3_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 2 Average Power',
				algo: false,
				metricName: 'metabolic_power_band2_average_power',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Average Distance (Session)',
				algo: false,
				metricName: 'velocity_band6_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Recovery Band 3 Total # Efforts',
				algo: false,
				metricName: 'velocity_band7_recovery_band3_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 6 Average Distance (Session)',
				algo: false,
				metricName: 'heart_rate_band6_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'H Dec', algo: false, metricName: 'ima_dec_h', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Recovery Band 7 Total # Efforts',
				algo: false,
				metricName: 'velocity_band6_recovery_band7_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Average Duration',
				algo: false,
				metricName: 'velocity_band8_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Duration %',
				algo: false,
				metricName: 'velocity_band2_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Average Duration (Session)',
				algo: false,
				metricName: 'velocity_band7_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Sprint Testing',
				algo: false,
				metricName: 'sprinttesting',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Max Effort Distance',
				algo: false,
				metricName: 'velocity_band8_max_effort_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Avg Effort Distance',
				algo: false,
				metricName: 'velocity_band5_average_effort_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Recovery Band 8 Total # Efforts',
				algo: false,
				metricName: 'velocity_band3_recovery_band8_total_effort_count',
				defaultValue: 1
			})
		);
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
				metricLabel: 'Average Distance',
				algo: false,
				metricName: 'average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Tot Duration',
				algo: false,
				metricName: 'total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Duration',
				algo: false,
				metricName: 'average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Total Player Load',
				algo: false,
				metricName: 'total_player_load',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Player Load',
				algo: false,
				metricName: 'average_player_load',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Maximum Velocity',
				algo: false,
				metricName: 'max_vel',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Maximum Heart Rate',
				algo: false,
				metricName: 'max_heart_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 6 Average Distance',
				algo: false,
				metricName: 'player_load_band6_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 7 Distance %',
				algo: false,
				metricName: 'heart_rate_band7_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 11 O'Clock Medium",
				algo: false,
				metricName: 'ima_band2_direction11_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Recovery Band 2 Total # Efforts',
				algo: false,
				metricName: 'velocity_band8_recovery_band2_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Distance Band 5 Total # Efforts',
				algo: false,
				metricName: 'velocity_band3_distance_band5_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 6 Average Distance',
				algo: false,
				metricName: 'heart_rate_band6_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Distance Band 3 Total # Efforts',
				algo: false,
				metricName: 'velocity_band8_distance_band3_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Sprint Testing',
				algo: false,
				metricName: 'average_sprinttesting',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Distance Band 2 Total # Efforts',
				algo: false,
				metricName: 'velocity_band4_distance_band2_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Recovery Band 2 Total # Efforts',
				algo: false,
				metricName: 'velocity_band3_recovery_band2_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 4 Duration %',
				algo: false,
				metricName: 'acceleration_band4_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 1 Duration %',
				algo: false,
				metricName: 'heart_rate_band1_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Distance Band 5 Total # Efforts',
				algo: false,
				metricName: 'velocity_band6_distance_band5_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 1 Average Effort Count (Session)',
				algo: false,
				metricName: 'acceleration_band1_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 11 O'Clock High",
				algo: false,
				metricName: 'ima_band3_direction11_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 7 Total Distance',
				algo: false,
				metricName: 'acceleration_band7_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 6 Average Distance (Session)',
				algo: false,
				metricName: 'player_load_band6_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "High IMA 11 O'Clock (Session)",
				algo: false,
				metricName: "high_ima_11_o'clock_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 5 Duration %',
				algo: false,
				metricName: 'player_load_band5_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 7 Average Effort Count',
				algo: false,
				metricName: 'acceleration_band7_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Min Effort Distance',
				algo: false,
				metricName: 'velocity_band6_min_effort_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Recovery Band 3 Total # Efforts',
				algo: false,
				metricName: 'velocity_band4_recovery_band3_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Distance Band 5 Total # Efforts',
				algo: false,
				metricName: 'velocity_band2_distance_band5_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Recovery Band 5 Total # Efforts',
				algo: false,
				metricName: 'velocity_band6_recovery_band5_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 7 Total Duration',
				algo: false,
				metricName: 'acceleration_band7_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Vertical Jump',
				algo: false,
				metricName: 'verticaljump',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 5 Average Distance',
				algo: false,
				metricName: 'heart_rate_band5_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Avg Effort Distance',
				algo: false,
				metricName: 'velocity_band6_average_effort_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 8 Average Duration',
				algo: false,
				metricName: 'acceleration_band8_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Average Effort Count (Session)',
				algo: false,
				metricName: 'velocity_band2_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 2 Average Duration (Session)',
				algo: false,
				metricName: 'acceleration_band2_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Recovery Band 6 Total # Efforts',
				algo: false,
				metricName: 'velocity_band2_recovery_band6_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Jumps (>20cm) (Average)',
				algo: false,
				metricName: 'jumps_(>20cm)_(average)',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 4 Average Effort Count (Session)',
				algo: false,
				metricName: 'heart_rate_band4_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 4 Average Duration (Session)',
				algo: false,
				metricName: 'player_load_band4_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 2 Average Distance (Session)',
				algo: false,
				metricName: 'player_load_band2_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Distance Band 2 Total # Efforts',
				algo: false,
				metricName: 'velocity_band7_distance_band2_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Recovery Band 7 Total # Efforts',
				algo: false,
				metricName: 'velocity_band8_recovery_band7_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 2 Total Distance',
				algo: false,
				metricName: 'heart_rate_band2_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Accel Low',
				algo: false,
				metricName: 'ima_band1_accel_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 6 Total Distance',
				algo: false,
				metricName: 'heart_rate_band6_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 2 Average Duration (Session)',
				algo: false,
				metricName: 'player_load_band2_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Distance Band 3 Total # Efforts',
				algo: false,
				metricName: 'velocity_band4_distance_band3_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 5 Total Effort Count',
				algo: false,
				metricName: 'acceleration_band5_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 2 Total Effort Count',
				algo: false,
				metricName: 'player_load_band2_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 3 Distance %',
				algo: false,
				metricName: 'heart_rate_band3_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 3 Average Duration',
				algo: false,
				metricName: 'heart_rate_band3_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 6 Average Effort Count',
				algo: false,
				metricName: 'acceleration_band6_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Recovery Band 6 Total # Efforts',
				algo: false,
				metricName: 'velocity_band8_recovery_band6_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Distance Band 8 Total # Efforts',
				algo: false,
				metricName: 'velocity_band7_distance_band8_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 8 Average Effort Count (Session)',
				algo: false,
				metricName: 'player_load_band8_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Total Duration',
				algo: false,
				metricName: 'velocity_band8_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Total Duration',
				algo: false,
				metricName: 'velocity_band3_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Recovery Band 7 Total # Efforts',
				algo: false,
				metricName: 'velocity_band4_recovery_band7_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 4 Duration %',
				algo: false,
				metricName: 'heart_rate_band4_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 1 Total Effort Count',
				algo: false,
				metricName: 'acceleration_band1_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Movement Load (avg)',
				algo: false,
				metricName: 'movement_load_(avg)',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Recovery Band 5 Total # Efforts',
				algo: false,
				metricName: 'velocity_band3_recovery_band5_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Athlete Weight',
				algo: false,
				metricName: 'athlete_weight',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Decel Medium',
				algo: false,
				metricName: 'ima_band2_decel_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 7 O'Clock Low",
				algo: false,
				metricName: 'ima_band1_direction7_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 3 Duration %',
				algo: false,
				metricName: 'player_load_band3_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 3 Average Duration',
				algo: false,
				metricName: 'acceleration_band3_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 2 Distance %',
				algo: false,
				metricName: 'player_load_band2_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 3 Total Effort Count',
				algo: false,
				metricName: 'player_load_band3_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 5 Total Effort Count',
				algo: false,
				metricName: 'player_load_band5_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Total Duration',
				algo: false,
				metricName: 'velocity_band4_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 2 Average Distance (Session)',
				algo: false,
				metricName: 'heart_rate_band2_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 8 Duration %',
				algo: false,
				metricName: 'acceleration_band8_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 10 O'Clock Low",
				algo: false,
				metricName: 'ima_band1_direction10_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 7 Average Distance (Session)',
				algo: false,
				metricName: 'player_load_band7_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Distance %',
				algo: false,
				metricName: 'velocity_band6_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 9 O'Clock High",
				algo: false,
				metricName: 'ima_band3_direction9_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "High IMA 7 O'Clock (Session)",
				algo: false,
				metricName: "high_ima_7_o'clock_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Average Duration (Session)',
				algo: false,
				metricName: 'velocity_band4_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 7 Total Distance',
				algo: false,
				metricName: 'player_load_band7_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Distance Band 3 Total # Efforts',
				algo: false,
				metricName: 'velocity_band6_distance_band3_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Recovery Band 2 Total # Efforts',
				algo: false,
				metricName: 'velocity_band6_recovery_band2_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 5 Average Effort Count (Session)',
				algo: false,
				metricName: 'acceleration_band5_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Vertical Jump',
				algo: false,
				metricName: 'average_verticaljump',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 3 Duration %',
				algo: false,
				metricName: 'acceleration_band3_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 4 Average Duration (Session)',
				algo: false,
				metricName: 'acceleration_band4_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Avg Effort Duration',
				algo: false,
				metricName: 'velocity_band5_average_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 1 Distance %',
				algo: false,
				metricName: 'acceleration_band1_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Average Duration',
				algo: false,
				metricName: 'velocity_band4_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Distance Band 5 Total # Efforts',
				algo: false,
				metricName: 'velocity_band5_distance_band5_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Max Effort Distance',
				algo: false,
				metricName: 'velocity_band6_max_effort_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 1 Average BPM',
				algo: false,
				metricName: 'heart_rate_band1_average_beats_per_minute',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 2 Average BPM',
				algo: false,
				metricName: 'heart_rate_band2_average_beats_per_minute',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 3 Average BPM',
				algo: false,
				metricName: 'heart_rate_band3_average_beats_per_minute',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 4 Average BPM',
				algo: false,
				metricName: 'heart_rate_band4_average_beats_per_minute',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Average Effort Count (Session)',
				algo: false,
				metricName: 'velocity_band8_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 5 Average BPM',
				algo: false,
				metricName: 'heart_rate_band5_average_beats_per_minute',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 6 Average BPM',
				algo: false,
				metricName: 'heart_rate_band6_average_beats_per_minute',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 7 Average BPM',
				algo: false,
				metricName: 'heart_rate_band7_average_beats_per_minute',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 8 Average BPM',
				algo: false,
				metricName: 'heart_rate_band8_average_beats_per_minute',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Recovery Band 6 Total # Efforts',
				algo: false,
				metricName: 'velocity_band6_recovery_band6_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Band 8 Left Count',
				algo: false,
				metricName: 'ima_band8_left_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Average Effort Count',
				algo: false,
				metricName: 'velocity_band8_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Duration %',
				algo: false,
				metricName: 'velocity_band7_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 2 O'Clock Low",
				algo: false,
				metricName: 'ima_band1_direction2_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Recovery Band 5 Total # Efforts',
				algo: false,
				metricName: 'velocity_band2_recovery_band5_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 5 Average Duration',
				algo: false,
				metricName: 'player_load_band5_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 7 Duration %',
				algo: false,
				metricName: 'acceleration_band7_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Recovery Band 8 Total # Efforts',
				algo: false,
				metricName: 'velocity_band5_recovery_band8_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Average Distance (Session)',
				algo: false,
				metricName: 'velocity_band7_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Max Effort Distance',
				algo: false,
				metricName: 'velocity_band5_max_effort_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 5 Average Effort Count',
				algo: false,
				metricName: 'heart_rate_band5_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 5 Average Power',
				algo: false,
				metricName: 'metabolic_power_band5_average_power',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 6 Duration %',
				algo: false,
				metricName: 'acceleration_band6_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 8 O'Clock High",
				algo: false,
				metricName: 'ima_band3_direction8_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 12 O'Clock High",
				algo: false,
				metricName: 'ima_band3_direction12_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Accel Medium 1.0',
				algo: false,
				metricName: 'ima_band2_old_accel_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA CoD Right Medium 1.0',
				algo: false,
				metricName: 'ima_band2_old_right_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Decel Low 1.0',
				algo: false,
				metricName: 'ima_band1_old_decel_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 12 O'Clock Low 1.0",
				algo: false,
				metricName: 'ima_band1_old_direction12_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Average RIGHT Low (Session) 1.0',
				algo: false,
				metricName: 'ima_band1_old_average_right_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Average DECEL Low (Session) 1.0',
				algo: false,
				metricName: 'ima_band1_old_average_decel_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 6 O'Clock Medium 1.0",
				algo: false,
				metricName: 'ima_band2_old_direction6_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA CoD Left High 1.0',
				algo: false,
				metricName: 'ima_band3_old_left_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Average ACCEL High (Session) 1.0',
				algo: false,
				metricName: 'ima_band3_old_average_accel_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Accel High 1.0',
				algo: false,
				metricName: 'ima_band3_old_accel_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA CoD Right Low 1.0',
				algo: false,
				metricName: 'ima_band1_old_right_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 4 O'Clock High 1.0",
				algo: false,
				metricName: 'ima_band3_old_direction4_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 2 Average Duration',
				algo: false,
				metricName: 'player_load_band2_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Average RIGHT High (Session) 1.0',
				algo: false,
				metricName: 'ima_band3_old_average_right_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 10 O'Clock Medium 1.0",
				algo: false,
				metricName: 'ima_band2_old_direction10_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA CoD Left Low 1.0',
				algo: false,
				metricName: 'ima_band1_old_left_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 7 O'Clock Medium 1.0",
				algo: false,
				metricName: 'ima_band2_old_direction7_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 11 O'Clock Low 1.0",
				algo: false,
				metricName: 'ima_band1_old_direction11_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Decel High 1.0',
				algo: false,
				metricName: 'ima_band3_old_decel_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 6 O'Clock High 1.0",
				algo: false,
				metricName: 'ima_band3_old_direction6_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA CoD Right High 1.0',
				algo: false,
				metricName: 'ima_band3_old_right_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 9 O'Clock Low 1.0",
				algo: false,
				metricName: 'ima_band1_old_direction9_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 8 O'Clock Medium 1.0",
				algo: false,
				metricName: 'ima_band2_old_direction8_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Average ACCEL Low (Session) 1.0',
				algo: false,
				metricName: 'ima_band1_old_average_accel_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA 1 OClock High 1.0',
				algo: false,
				metricName: 'ima_band3_old_direction1_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'H Acc', algo: false, metricName: 'ima_acc_h', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 5 O'Clock Low 1.0",
				algo: false,
				metricName: 'ima_band1_old_direction5_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 5 O'Clock Medium 1.0",
				algo: false,
				metricName: 'ima_band2_old_direction5_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 10 O'Clock High 1.0",
				algo: false,
				metricName: 'ima_band3_old_direction10_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Average DECEL Medium (Session) 1.0',
				algo: false,
				metricName: 'ima_band2_old_average_decel_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Average RIGHT Medium (Session) 1.0',
				algo: false,
				metricName: 'ima_band2_old_average_right_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Average DECEL High (Session) 1.0',
				algo: false,
				metricName: 'ima_band3_old_average_decel_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 5 O'Clock High 1.0",
				algo: false,
				metricName: 'ima_band3_old_direction5_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 2 O'Clock Medium 1.0",
				algo: false,
				metricName: 'ima_band2_old_direction2_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 6 O'Clock Low 1.0",
				algo: false,
				metricName: 'ima_band1_old_direction6_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 3 O'Clock High 1.0",
				algo: false,
				metricName: 'ima_band3_old_direction3_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 1 O'Clock Medium 1.0",
				algo: false,
				metricName: 'ima_band2_old_direction1_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 7 O'Clock High 1.0",
				algo: false,
				metricName: 'ima_band3_old_direction7_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 9 O'Clock Medium 1.0",
				algo: false,
				metricName: 'ima_band2_old_direction9_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA CoD Left Medium 1.0',
				algo: false,
				metricName: 'ima_band2_old_left_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 2 O'Clock High 1.0",
				algo: false,
				metricName: 'ima_band3_old_direction2_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 4 O'Clock Low 1.0",
				algo: false,
				metricName: 'ima_band1_old_direction4_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 3 O'Clock Medium 1.0",
				algo: false,
				metricName: 'ima_band2_old_direction3_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 11 O'Clock Medium 1.0",
				algo: false,
				metricName: 'ima_band2_old_direction11_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 11 O'Clock High 1.0",
				algo: false,
				metricName: 'ima_band3_old_direction11_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 5 Average Distance',
				algo: false,
				metricName: 'player_load_band5_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Accel Low 1.0',
				algo: false,
				metricName: 'ima_band1_old_accel_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Decel Medium 1.0',
				algo: false,
				metricName: 'ima_band2_old_decel_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 7 O'Clock Low 1.0",
				algo: false,
				metricName: 'ima_band1_old_direction7_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Distance Band 5 Total # Efforts',
				algo: false,
				metricName: 'velocity_band8_distance_band5_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 10 O'Clock Low 1.0",
				algo: false,
				metricName: 'ima_band1_old_direction10_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 9 O'Clock High 1.0",
				algo: false,
				metricName: 'ima_band3_old_direction9_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 4 Total Duration',
				algo: false,
				metricName: 'acceleration_band4_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Average ACCEL Medium (Session) 1.0',
				algo: false,
				metricName: 'ima_band2_old_average_accel_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Band 8 Left Count 1.0',
				algo: false,
				metricName: 'ima_band8_old_left_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 2 O'Clock Low 1.0",
				algo: false,
				metricName: 'ima_band1_old_direction2_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 7 Average Distance (Session)',
				algo: false,
				metricName: 'heart_rate_band7_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 8 O'Clock High 1.0",
				algo: false,
				metricName: 'ima_band3_old_direction8_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 12 O'Clock High 1.0",
				algo: false,
				metricName: 'ima_band3_old_direction12_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Average LEFT Medium (Session) 1.0',
				algo: false,
				metricName: 'ima_band2_old_average_left_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Recovery Band 8 Total # Efforts',
				algo: false,
				metricName: 'velocity_band8_recovery_band8_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "6 O'Clock Average (Session)",
				algo: false,
				metricName: "6_o'clock_average_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 4 O'Clock Medium 1.0",
				algo: false,
				metricName: 'ima_band2_old_direction4_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Average LEFT High (Session) 1.0',
				algo: false,
				metricName: 'ima_band3_old_average_left_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 12 O'Clock Medium 1.0",
				algo: false,
				metricName: 'ima_band2_old_direction12_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 1 O'Clock Low 1.0",
				algo: false,
				metricName: 'ima_band1_old_direction1_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 3 O'Clock Low 1.0",
				algo: false,
				metricName: 'ima_band1_old_direction3_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Band 8 Right Count 1.0',
				algo: false,
				metricName: 'ima_band8_old_right_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 8 O'Clock Low 1.0",
				algo: false,
				metricName: 'ima_band1_old_direction8_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Average LEFT Low (Session) 1.0',
				algo: false,
				metricName: 'ima_band1_old_average_left_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'High Accel (Session)',
				algo: false,
				metricName: 'high_accel_(session)',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 4 O'Clock Medium",
				algo: false,
				metricName: 'ima_band2_direction4_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 7 Distance %',
				algo: false,
				metricName: 'player_load_band7_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'HIMA/totIMA',
				algo: false,
				metricName: 'hiima/totima',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 8 Average Effort Count',
				algo: false,
				metricName: 'heart_rate_band8_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Distance Band 7 Total # Efforts',
				algo: false,
				metricName: 'velocity_band3_distance_band7_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Distance Band 4 Total # Efforts',
				algo: false,
				metricName: 'velocity_band2_distance_band4_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Average Duration',
				algo: false,
				metricName: 'velocity_band2_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 7 Average Distance',
				algo: false,
				metricName: 'player_load_band7_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 3 Average Duration',
				algo: false,
				metricName: 'player_load_band3_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 8 Total Duration',
				algo: false,
				metricName: 'player_load_band8_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Average Distance',
				algo: false,
				metricName: 'velocity_band2_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'Peak Power', algo: false, metricName: 'peakpower', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "High IMA 8 O'Clock (Session)",
				algo: false,
				metricName: "high_ima_8_o'clock_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'IMA Dec M', algo: false, metricName: 'ima_dec_m', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Distance Band 6 Total # Efforts',
				algo: false,
				metricName: 'velocity_band4_distance_band6_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Sleep Quality',
				algo: false,
				metricName: 'sleepquality',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 5 Total Duration',
				algo: false,
				metricName: 'acceleration_band5_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'RHIE Efforts Per Bout - Min',
				algo: false,
				metricName: 'rhie_min_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'RHIE Efforts Per Bout - Max',
				algo: false,
				metricName: 'rhie_max_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'RHIE Efforts Per Bout - Mean',
				algo: false,
				metricName: 'rhie_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'RHIE Effort Duration - Min',
				algo: false,
				metricName: 'rhie_min_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 1 Average Duration',
				algo: false,
				metricName: 'player_load_band1_average_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'RHIE Effort Recovery - Min',
				algo: false,
				metricName: 'rhie_min_effort_recovery',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'RHIE Effort Recovery - Mean',
				algo: false,
				metricName: 'rhie_average_effort_recovery',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'RHIE Effort Recovery - Max',
				algo: false,
				metricName: 'rhie_max_effort_recovery',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 8 Total Distance',
				algo: false,
				metricName: 'heart_rate_band8_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Righ High CoD (Session)',
				algo: false,
				metricName: 'righ_high_cod_(session)',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Total Effort Count',
				algo: false,
				metricName: 'velocity_band2_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 8 Total Effort Count',
				algo: false,
				metricName: 'heart_rate_band8_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'Field Time', algo: false, metricName: 'field_time', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'Bench Time', algo: false, metricName: 'bench_time', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'Date', algo: false, metricName: 'date', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 6 Average Duration (Session)',
				algo: false,
				metricName: 'acceleration_band6_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Session Count',
				algo: false,
				metricName: 'activity_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 5 Average Duration (Session)',
				algo: false,
				metricName: 'player_load_band5_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'IMA Acc L', algo: false, metricName: 'ima_acc_l', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Min Effort Duration',
				algo: false,
				metricName: 'velocity_band7_min_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Avg Effort Distance',
				algo: false,
				metricName: 'velocity_band4_average_effort_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'Total IMA', algo: false, metricName: 'total_ima', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 1 Average Distance',
				algo: false,
				metricName: 'acceleration_band1_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Total Distance',
				algo: false,
				metricName: 'velocity_band8_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Ex/ Min',
				algo: false,
				metricName: 'explosive_effort_per_min',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 8 Total # Efforts',
				algo: false,
				metricName: 'metabolic_power_band8_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 1 Average Distance (Session)',
				algo: false,
				metricName: 'velocity_band1_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 12 O'Clock Medium",
				algo: false,
				metricName: 'ima_band2_direction12_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 1 Average Distance (Session)',
				algo: false,
				metricName: 'heart_rate_band1_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: '1RM Bench Pull',
				algo: false,
				metricName: '1rmbenchpull',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 2 Total Effort Count',
				algo: false,
				metricName: 'acceleration_band2_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "11 O'Clock Average (Session)",
				algo: false,
				metricName: "11_o'clock_average_(session)",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 1 O'Clock High",
				algo: false,
				metricName: 'ima_band3_direction1_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Average Effort Count',
				algo: false,
				metricName: 'velocity_band5_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'Jersey', algo: false, metricName: 'athlete_jersey', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load (2D)',
				algo: false,
				metricName: 'total_2d_player_load',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load (Slow)',
				algo: false,
				metricName: 'total_slow_player_load',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load (1D Fwd)',
				algo: false,
				metricName: 'total_1d_fwd_player_load',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load (1D Side)',
				algo: false,
				metricName: 'total_1d_side_player_load',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load (1D Up)',
				algo: false,
				metricName: 'total_1d_up_player_load',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Player Load (2D)',
				algo: false,
				metricName: 'average_2d_player_load',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Player Load (Slow)',
				algo: false,
				metricName: 'average_slow_player_load',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Player Load (1D Fwd)',
				algo: false,
				metricName: 'average_1d_fwd_player_load',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Player Load (1D Side)',
				algo: false,
				metricName: 'average_1d_side_player_load',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Player Load (1D Up)',
				algo: false,
				metricName: 'average_1d_up_player_load',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 5 Distance %',
				algo: false,
				metricName: 'player_load_band5_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Player Load (2D) (Session)',
				algo: false,
				metricName: 'average_2d_player_load_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Player Load (Slow) (Session)',
				algo: false,
				metricName: 'average_slow_player_load_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Player Load (1D Fwd) (Session)',
				algo: false,
				metricName: 'average_1d_fwd_player_load_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Player Load (1D Side) (Session)',
				algo: false,
				metricName: 'average_1d_side_player_load_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Player Load (1D Up) (Session)',
				algo: false,
				metricName: 'average_1d_up_player_load_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load (1D Fwd %)',
				algo: false,
				metricName: '1d_fwd_player_load_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load (1D Side %)',
				algo: false,
				metricName: '1d_side_player_load_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load (1D Up %)',
				algo: false,
				metricName: '1d_up_player_load_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Total Event Count 1.0',
				algo: false,
				metricName: 'ima_v1_free_run_events',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Total Time 1.0',
				algo: false,
				metricName: 'ima_v1_free_run_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Total Time % 1.0',
				algo: false,
				metricName: 'ima_v1_free_run_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Mean Stride Rate 1.0',
				algo: false,
				metricName: 'ima_v1_free_run_mean_stride_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Total Event Count',
				algo: false,
				metricName: 'ima_v2_free_run_events',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Total Time',
				algo: false,
				metricName: 'ima_v2_free_run_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Total Time %',
				algo: false,
				metricName: 'ima_v2_free_run_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Mean Stride Rate',
				algo: false,
				metricName: 'ima_v2_free_run_mean_stride_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 1 Event Count 1.0',
				algo: false,
				metricName: 'ima_v1_free_run_band1_event_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 1 Average Stride Rate 1.0',
				algo: false,
				metricName: 'ima_v1_free_run_band1_average_stride_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 2 Event Count 1.0',
				algo: false,
				metricName: 'ima_v1_free_run_band2_event_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 2 Average Stride Rate 1.0',
				algo: false,
				metricName: 'ima_v1_free_run_band2_average_stride_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 3 Event Count 1.0',
				algo: false,
				metricName: 'ima_v1_free_run_band3_event_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 3 Average Stride Rate 1.0',
				algo: false,
				metricName: 'ima_v1_free_run_band3_average_stride_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 4 Event Count 1.0',
				algo: false,
				metricName: 'ima_v1_free_run_band4_event_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 4 Average Stride Rate 1.0',
				algo: false,
				metricName: 'ima_v1_free_run_band4_average_stride_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 5 Event Count 1.0',
				algo: false,
				metricName: 'ima_v1_free_run_band5_event_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 5 Average Stride Rate 1.0',
				algo: false,
				metricName: 'ima_v1_free_run_band5_average_stride_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 6 Event Count 1.0',
				algo: false,
				metricName: 'ima_v1_free_run_band6_event_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 6 Average Stride Rate 1.0',
				algo: false,
				metricName: 'ima_v1_free_run_band6_average_stride_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 7 Event Count 1.0',
				algo: false,
				metricName: 'ima_v1_free_run_band7_event_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 7 Average Stride Rate 1.0',
				algo: false,
				metricName: 'ima_v1_free_run_band7_average_stride_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 8 Event Count 1.0',
				algo: false,
				metricName: 'ima_v1_free_run_band8_event_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 8 Average Stride Rate 1.0',
				algo: false,
				metricName: 'ima_v1_free_run_band8_average_stride_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 1 Event Count',
				algo: false,
				metricName: 'ima_v2_free_run_band1_event_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 1 Average Stride Rate',
				algo: false,
				metricName: 'ima_v2_free_run_band1_average_stride_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 2 Event Count',
				algo: false,
				metricName: 'ima_v2_free_run_band2_event_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 2 Average Stride Rate',
				algo: false,
				metricName: 'ima_v2_free_run_band2_average_stride_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 3 Event Count',
				algo: false,
				metricName: 'ima_v2_free_run_band3_event_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 3 Average Stride Rate',
				algo: false,
				metricName: 'ima_v2_free_run_band3_average_stride_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 4 Event Count',
				algo: false,
				metricName: 'ima_v2_free_run_band4_event_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 4 Average Stride Rate',
				algo: false,
				metricName: 'ima_v2_free_run_band4_average_stride_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 5 Event Count',
				algo: false,
				metricName: 'ima_v2_free_run_band5_event_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 5 Average Stride Rate',
				algo: false,
				metricName: 'ima_v2_free_run_band5_average_stride_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 6 Event Count',
				algo: false,
				metricName: 'ima_v2_free_run_band6_event_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 6 Average Stride Rate',
				algo: false,
				metricName: 'ima_v2_free_run_band6_average_stride_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 7 Event Count',
				algo: false,
				metricName: 'ima_v2_free_run_band7_event_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 7 Average Stride Rate',
				algo: false,
				metricName: 'ima_v2_free_run_band7_average_stride_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 8 Event Count',
				algo: false,
				metricName: 'ima_v2_free_run_band8_event_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Free Running Band 8 Average Stride Rate',
				algo: false,
				metricName: 'ima_v2_free_run_band8_average_stride_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 1 Count',
				algo: false,
				metricName: 'tackles_band1_total_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 1 Average Duration',
				algo: false,
				metricName: 'tackles_band1_average_tackle_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 5 Average Distance (Session)',
				algo: false,
				metricName: 'heart_rate_band5_average_distance_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'HR 70-80% Mins (avg)',
				algo: false,
				metricName: 'heart_rate_band4_average_duration_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 2 Count',
				algo: false,
				metricName: 'tackles_band2_total_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 2 Average Duration',
				algo: false,
				metricName: 'tackles_band2_average_tackle_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 3 Count',
				algo: false,
				metricName: 'tackles_band3_total_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 3 Average Duration',
				algo: false,
				metricName: 'tackles_band3_average_tackle_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 4 Count',
				algo: false,
				metricName: 'tackles_band4_total_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 4 Average Duration',
				algo: false,
				metricName: 'tackles_band4_average_tackle_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 5 Count',
				algo: false,
				metricName: 'tackles_band5_total_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 5 Average Duration',
				algo: false,
				metricName: 'tackles_band5_average_tackle_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 6 Count',
				algo: false,
				metricName: 'tackles_band6_total_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 6 Average Duration',
				algo: false,
				metricName: 'tackles_band6_average_tackle_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 7 Count',
				algo: false,
				metricName: 'tackles_band7_total_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 7 Average Duration',
				algo: false,
				metricName: 'tackles_band7_average_tackle_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 8 Count',
				algo: false,
				metricName: 'tackles_band8_total_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 8 Average Duration',
				algo: false,
				metricName: 'tackles_band8_average_tackle_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Recovery Band 1 Total # Efforts',
				algo: false,
				metricName: 'velocity_band2_recovery_band1_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Recovery Band 1 Total # Efforts',
				algo: false,
				metricName: 'velocity_band3_recovery_band1_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Recovery Band 1 Total # Efforts',
				algo: false,
				metricName: 'velocity_band4_recovery_band1_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Recovery Band 1 Total # Efforts',
				algo: false,
				metricName: 'velocity_band5_recovery_band1_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Recovery Band 1 Total # Efforts',
				algo: false,
				metricName: 'velocity_band6_recovery_band1_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Recovery Band 1 Total # Efforts',
				algo: false,
				metricName: 'velocity_band7_recovery_band1_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Recovery Band 1 Total # Efforts',
				algo: false,
				metricName: 'velocity_band8_recovery_band1_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Distance Band 1 Total # Efforts',
				algo: false,
				metricName: 'velocity_band2_distance_band1_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Distance Band 1 Total # Efforts',
				algo: false,
				metricName: 'velocity_band3_distance_band1_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Distance Band 1 Total # Efforts',
				algo: false,
				metricName: 'velocity_band4_distance_band1_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Distance Band 1 Total # Efforts',
				algo: false,
				metricName: 'velocity_band5_distance_band1_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Distance Band 1 Total # Efforts',
				algo: false,
				metricName: 'velocity_band6_distance_band1_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Distance Band 1 Total # Efforts',
				algo: false,
				metricName: 'velocity_band7_distance_band1_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Distance Band 1 Total # Efforts',
				algo: false,
				metricName: 'velocity_band8_distance_band1_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Peak Player Load',
				algo: false,
				metricName: 'peak_player_load',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Work/Rest Ratio',
				algo: false,
				metricName: 'vel_work_rest_ratio',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Work/Rest Ratio',
				algo: false,
				metricName: 'work_rest_ratio',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Exertion Index',
				algo: false,
				metricName: 'velocity_exertion',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Exertion',
				algo: false,
				metricName: 'heart_rate_exertion',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Exertion Index Per Minute',
				algo: false,
				metricName: 'velocity_exertion_per_minute',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Exertion Per Minute',
				algo: false,
				metricName: 'heart_rate_exertion_per_minute',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Exertion Per Metre',
				algo: false,
				metricName: 'heart_rate_exertion_per_metre',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Rest Load',
				algo: false,
				metricName: 'player_load_band1_total_power',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 2 Total Player Load',
				algo: false,
				metricName: 'player_load_band2_total_power',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'High Intensity Movement',
				algo: false,
				metricName: 'player_load_band3_total_power',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 4 Total Player Load',
				algo: false,
				metricName: 'player_load_band4_total_power',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 5 Total Player Load',
				algo: false,
				metricName: 'player_load_band5_total_power',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 6 Total Player Load',
				algo: false,
				metricName: 'player_load_band6_total_power',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 7 Total Player Load',
				algo: false,
				metricName: 'player_load_band7_total_power',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 8 Total Player Load',
				algo: false,
				metricName: 'player_load_band8_total_power',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Duration %',
				algo: false,
				metricName: 'velocity_band5_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 4 Distance %',
				algo: false,
				metricName: 'heart_rate_band4_distance_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'TRIMP/MIN', algo: false, metricName: 'trimp/min', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'QACC', algo: false, metricName: 'qacc', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Min Effort Distance',
				algo: false,
				metricName: 'velocity_band8_min_effort_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Average Effort Count',
				algo: false,
				metricName: 'velocity_band7_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Recovery Band 8 Total # Efforts',
				algo: false,
				metricName: 'velocity_band6_recovery_band8_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'QJUM', algo: false, metricName: 'qjum', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Distance Band 3 Total # Efforts',
				algo: false,
				metricName: 'velocity_band2_distance_band3_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Average Weight',
				algo: false,
				metricName: 'average_weight',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Total Distance',
				algo: false,
				metricName: 'velocity_band7_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Distance Band 5 Total # Efforts',
				algo: false,
				metricName: 'velocity_band4_distance_band5_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "12 O'Clock Average (Session) ",
				algo: false,
				metricName: "12_o'clock_average_(session)_",
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 3 Average Effort Count (Session)',
				algo: false,
				metricName: 'player_load_band3_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Minimum Heart Rate',
				algo: false,
				metricName: 'min_heart_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Avg Heart Rate',
				algo: false,
				metricName: 'mean_heart_rate',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 4 Total Distance',
				algo: false,
				metricName: 'player_load_band4_total_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 8 Total Duration',
				algo: false,
				metricName: 'acceleration_band8_total_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load (avg)',
				algo: false,
				metricName: 'average_player_load_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 1 O'Clock Low",
				algo: false,
				metricName: 'ima_band1_direction1_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 6 Total Effort Count',
				algo: false,
				metricName: 'heart_rate_band6_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Min Effort Duration',
				algo: false,
				metricName: 'velocity_band8_min_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 3 O'Clock Low",
				algo: false,
				metricName: 'ima_band1_direction3_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 8 Duration %',
				algo: false,
				metricName: 'heart_rate_band8_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Recovery Band 4 Total # Efforts',
				algo: false,
				metricName: 'velocity_band2_recovery_band4_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 6 Average Effort Count',
				algo: false,
				metricName: 'player_load_band6_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 5 Average Effort Count (Session)',
				algo: false,
				metricName: 'player_load_band5_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA High Avg',
				algo: false,
				metricName: 'ima_high_avg',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Recovery Band 3 Total # Efforts',
				algo: false,
				metricName: 'velocity_band6_recovery_band3_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'High Decel (Session)',
				algo: false,
				metricName: 'high_decel_(session)',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 2 Duration %',
				algo: false,
				metricName: 'player_load_band2_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Band 8 Right Count',
				algo: false,
				metricName: 'ima_band8_right_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'IMA Left L', algo: false, metricName: 'ima_left_l', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 5 Total # Efforts',
				algo: false,
				metricName: 'metabolic_power_band5_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 2 Total Duration %',
				algo: false,
				metricName: 'metabolic_power_band2_duration_percentage',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 4 Total Effort Count',
				algo: false,
				metricName: 'acceleration_band4_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 8 Average Effort Count (Session)',
				algo: false,
				metricName: 'heart_rate_band8_average_effort_count_session',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 3 Average Effort Count',
				algo: false,
				metricName: 'heart_rate_band3_average_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Recovery Band 5 Total # Efforts',
				algo: false,
				metricName: 'velocity_band8_recovery_band5_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Min Effort Duration',
				algo: false,
				metricName: 'velocity_band5_min_effort_duration',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Distance Band 6 Total # Efforts',
				algo: false,
				metricName: 'velocity_band6_distance_band6_total_effort_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'RPE', algo: false, metricName: 'rpe', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({ metricLabel: 'Duration', algo: false, metricName: 'duration', defaultValue: 1 })
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: "IMA 8 O'Clock Low",
				algo: false,
				metricName: 'ima_band1_direction8_count',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 4 Average Distance',
				algo: false,
				metricName: 'player_load_band4_average_distance',
				defaultValue: 1
			})
		);
		this.metricsMapping.push(
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 3 Average Distance (Session)',
				algo: false,
				metricName: 'heart_rate_band3_average_distance_session',
				defaultValue: 1
			})
		);
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

	getSessionsFromCsv(): SessionPlayerData[] | null {
		return null;
	}

	getMetricsMapping(): DeviceMetricDescriptor[] {
		return this.metricsMapping;
	}
}
