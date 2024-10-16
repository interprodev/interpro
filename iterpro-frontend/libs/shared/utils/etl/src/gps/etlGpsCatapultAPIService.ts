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
export class EtlGpsCatapultAPIService implements BaseEtlGpsService {
	private metricsMapping: DeviceMetricDescriptor[];

	constructor(private etlDateService: EtlDateDurationService, private currentTeam: Team) {
		this.metricsMapping = [
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 8 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band8_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 3 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band3_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 3 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band3_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 6 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band6_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band7_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Average Distance (Session)',
				defaultValue: 1,
				algo: false,
				metricName: 'average_distance_session'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band4_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Accel Decel (High Bands)',
				defaultValue: 1,
				algo: false,
				metricName: 'accel_decel_(high_bands)'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band2_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 3 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band3_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Average Velocity',
				defaultValue: 1,
				algo: false,
				metricName: 'average_velocity'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Max Vel (% Max)',
				defaultValue: 1,
				algo: false,
				metricName: 'percentage_max_velocity'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Max HR (% Max)',
				defaultValue: 1,
				algo: false,
				metricName: 'percentage_max_heart_rate'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Avg HR (% Max)',
				defaultValue: 1,
				algo: false,
				metricName: 'percentage_avg_heart_rate'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 6 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band6_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 2 Total # Efforts',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band2_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Peak Meta Power',
				defaultValue: 1,
				algo: false,
				metricName: 'peak_meta_power'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Meta Energy (KJ/kg)',
				defaultValue: 1,
				algo: false,
				metricName: 'meta_energy_kj'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 2 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band2_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Meta Energy (Cal/kg)',
				defaultValue: 1,
				algo: false,
				metricName: 'meta_energy_cal'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Equivalent Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'equivalent_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'EDI',
				defaultValue: 1,
				algo: false,
				metricName: 'equivalent_distance_index'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'High Metabolic Power Efforts',
				defaultValue: 1,
				algo: false,
				metricName: 'high_metabolic_power_efforts'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 5 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band5_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band3_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Total Energy Expenditure',
				defaultValue: 1,
				algo: false,
				metricName: 'total_energy_expenditure'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 2 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band2_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 3 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band3_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 4 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band4_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 6 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band6_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band7_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 8 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band8_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Start Time',
				defaultValue: 1,
				algo: false,
				metricName: 'start_time_h'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'End Time',
				defaultValue: 1,
				algo: false,
				metricName: 'end_time_h'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 7 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band7_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'COD (AVG)',
				defaultValue: 1,
				algo: false,
				metricName: 'cod_(avg)'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 5 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band5_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 7 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band7_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 2 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band2_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 7 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band7_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'COD',
				defaultValue: 1,
				algo: false,
				metricName: 'cod'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 5 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band5_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 4 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band4_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Accels Per Session',
				defaultValue: 1,
				algo: false,
				metricName: 'accel'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band5_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 1 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band1_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 1 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band1_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Decels',
				defaultValue: 1,
				algo: false,
				metricName: 'decels'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 4 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band4_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 7 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band7_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 6 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band6_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Total Effort Count (Set 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity2_band7_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Total Distance (Set 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity2_band4_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Total Distance (Set 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity2_band3_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Total Effort Count (Set 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity2_band5_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 1 Total Distance (Set 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity2_band1_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Total Effort Count (Set 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity2_band4_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Total Distance (Set 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity2_band6_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Total Distance (Set 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity2_band2_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Total Effort Count (Set 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity2_band3_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Total Effort Count (Set 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity2_band8_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Total Effort Count (Set 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity2_band6_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Total Distance (Set 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity2_band5_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Total Effort Count (Set 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity2_band2_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Total Distance (Set 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity2_band8_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Total Distance (Set 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity2_band7_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'SPR/min',
				defaultValue: 1,
				algo: false,
				metricName: 'spr/min'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 8 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band8_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Total COD',
				defaultValue: 1,
				algo: false,
				metricName: 'total_cod'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 6 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band6_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 4 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band4_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'MII Distance Interval 1',
				defaultValue: 1,
				algo: false,
				metricName: 'max_intensity_interval_distance_interval_1'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'MII Distance Interval 2',
				defaultValue: 1,
				algo: false,
				metricName: 'max_intensity_interval_distance_interval_2'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'MII Distance Interval 3',
				defaultValue: 1,
				algo: false,
				metricName: 'max_intensity_interval_distance_interval_3'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'MII Player Load Interval 1',
				defaultValue: 1,
				algo: false,
				metricName: 'max_intensity_interval_player_load_interval_1'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'MII Player Load Interval 2',
				defaultValue: 1,
				algo: false,
				metricName: 'max_intensity_interval_player_load_interval_2'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'MII Player Load Interval 3',
				defaultValue: 1,
				algo: false,
				metricName: 'max_intensity_interval_player_load_interval_3'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 2 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band2_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band6_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 1 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band1_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 3 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band3_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band5_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 7 Total # Efforts',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band7_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 8 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band8_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 1 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band1_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 8 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band8_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 6 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band6_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band4_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Deceleration B1 Efforts (Gen 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_acceleration_band3_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Deceleration B2 Efforts (Gen 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_acceleration_band2_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Deceleration B3 Efforts (Gen 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_acceleration_band1_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration B1 Efforts (Gen 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_acceleration_band6_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration B2 Efforts (Gen 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_acceleration_band7_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration B3 Efforts (Gen 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_acceleration_band8_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Deceleration B1 Duration (Gen 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_acceleration_band3_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Deceleration B2 Duration (Gen 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_acceleration_band2_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Deceleration B3 Duration (Gen 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_acceleration_band1_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration B1 Duration (Gen 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_acceleration_band6_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration B2 Duration (Gen 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_acceleration_band7_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration B3 Duration (Gen 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_acceleration_band8_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Deceleration B1 Distance (Gen 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_acceleration_band3_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Deceleration B2 Distance (Gen 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_acceleration_band2_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Deceleration B3 Distance (Gen 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_acceleration_band1_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration B1 Distance (Gen 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_acceleration_band6_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration B2 Distance (Gen 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_acceleration_band7_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration B3 Distance (Gen 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_acceleration_band8_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Max Acceleration',
				defaultValue: 1,
				algo: false,
				metricName: 'max_effort_acceleration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Max Deceleration',
				defaultValue: 1,
				algo: false,
				metricName: 'max_effort_deceleration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity B2+ Total # Efforts (Gen2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_velocity_band2_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity B3+ Total # Efforts (Gen2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_velocity_band3_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity B4+ Total # Efforts (Gen2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_velocity_band4_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity B5+ Total # Efforts (Gen2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_velocity_band5_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity B6+ Total # Efforts (Gen2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_velocity_band6_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity B7+ Total # Efforts (Gen2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_velocity_band7_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity B8 Total # Efforts (Gen2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_velocity_band8_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 2 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band2_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band6_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Average Peak Power',
				defaultValue: 1,
				algo: false,
				metricName: 'average_peakpower'
			}),
			new DeviceMetricDescriptor({
				metricLabel: '% - Intensity',
				defaultValue: 1,
				algo: false,
				metricName: 'mmm_-_intensity'
			}),
			new DeviceMetricDescriptor({
				metricLabel: '% - Volume',
				defaultValue: 1,
				algo: false,
				metricName: 'mmm_-_volume'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Jump Count High Band',
				defaultValue: 1,
				algo: false,
				metricName: 'ima_band3_jump_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'IMA Jump Count Med Band',
				defaultValue: 1,
				algo: false,
				metricName: 'ima_band2_jump_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Profile Max Velocity',
				defaultValue: 1,
				algo: false,
				metricName: 'athlete_max_velocity'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'RHIE Total Bouts',
				defaultValue: 1,
				algo: false,
				metricName: 'rhie_bout_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 4 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band4_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 5 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band5_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Total Jumps',
				defaultValue: 1,
				algo: false,
				metricName: 'total_jumps'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 7 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band7_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 6 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band6_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Accels',
				defaultValue: 1,
				algo: false,
				metricName: 'accels'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band2_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 4 Total # Efforts',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band4_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 4 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band4_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 2 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band2_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 5 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band5_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 5 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band5_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Anaerobic Power',
				defaultValue: 1,
				algo: false,
				metricName: 'anaerobic_power'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 3 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band3_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 1 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band1_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 1 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band1_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 6 Total # Efforts',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band6_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 6 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band6_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 1 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band1_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 1 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band1_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 3 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band3_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 2 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band2_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 3 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band3_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 1 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band1_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Decels GPS',
				defaultValue: 1,
				algo: false,
				metricName: 'decels_gps'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 3 Total # Efforts',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band3_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Aerobic Power',
				defaultValue: 1,
				algo: false,
				metricName: 'aerobic_power'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band3_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity B2+ Total # Efforts (Gen 2) (Set 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_velocity2_band2_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity B3+ Total # Efforts (Gen 2) (Set 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_velocity2_band3_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity B4+ Total # Efforts (Gen 2) (Set 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_velocity2_band4_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity B5+ Total # Efforts (Gen 2) (Set 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_velocity2_band5_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity B6+ Total # Efforts (Gen 2) (Set 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_velocity2_band6_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity B7+ Total # Efforts (Gen 2) (Set 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_velocity2_band7_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity B8 Total # Efforts (Gen 2) (Set 2)',
				defaultValue: 1,
				algo: false,
				metricName: 'gen2_velocity2_band8_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'HMLD',
				defaultValue: 1,
				algo: false,
				metricName: 'hmld'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band8_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Peak Power',
				defaultValue: 1,
				algo: false,
				metricName: 'peakpower'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 8 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band8_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 3 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band3_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 1 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band1_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 2 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band2_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 3 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band3_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 4 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band4_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 5 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band5_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 6 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band6_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 7 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band7_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 8 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band8_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Session Count',
				defaultValue: 1,
				algo: false,
				metricName: 'activity_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 7 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band7_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'HSR/min',
				defaultValue: 1,
				algo: false,
				metricName: 'hsr/min'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 6 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band6_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 7 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band7_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Total IMA',
				defaultValue: 1,
				algo: false,
				metricName: 'total_ima'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Total Dives',
				defaultValue: 1,
				algo: false,
				metricName: 'total_dives'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 1 Count',
				defaultValue: 1,
				algo: false,
				metricName: 'tackles_band1_total_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 2 Count',
				defaultValue: 1,
				algo: false,
				metricName: 'tackles_band2_total_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 3 Count',
				defaultValue: 1,
				algo: false,
				metricName: 'tackles_band3_total_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 4 Count',
				defaultValue: 1,
				algo: false,
				metricName: 'tackles_band4_total_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 5 Count',
				defaultValue: 1,
				algo: false,
				metricName: 'tackles_band5_total_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 6 Count',
				defaultValue: 1,
				algo: false,
				metricName: 'tackles_band6_total_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 7 Count',
				defaultValue: 1,
				algo: false,
				metricName: 'tackles_band7_total_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Tackle Band 8 Count',
				defaultValue: 1,
				algo: false,
				metricName: 'tackles_band8_total_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Peak Player Load',
				defaultValue: 1,
				algo: false,
				metricName: 'peak_player_load'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Work/Rest Ratio',
				defaultValue: 1,
				algo: false,
				metricName: 'vel_work_rest_ratio'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Work/Rest Ratio',
				defaultValue: 1,
				algo: false,
				metricName: 'work_rest_ratio'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Exertion',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_exertion'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 1 Total Player Load',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band1_total_power'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 2 Total Player Load',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band2_total_power'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 3 Total Player Load',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band3_total_power'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 4 Total Player Load',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band4_total_power'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 5 Total Player Load',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band5_total_power'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 6 Total Player Load',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band6_total_power'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 7 Total Player Load',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band7_total_power'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 8 Total Player Load',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band8_total_power'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 5 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band5_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'SPR',
				defaultValue: 1,
				algo: false,
				metricName: 'spr'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 4 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band4_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 5 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band5_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Per Minute',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_per_minute'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Meterage Per Minute',
				defaultValue: 1,
				algo: false,
				metricName: 'meterage_per_minute'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'RPE',
				defaultValue: 1,
				algo: false,
				metricName: 'rpe'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Average Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'average_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Total Player Load',
				defaultValue: 1,
				algo: false,
				metricName: 'total_player_load'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Average Player Load',
				defaultValue: 1,
				algo: false,
				metricName: 'average_player_load'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Maximum Velocity',
				defaultValue: 1,
				algo: false,
				metricName: 'max_vel'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Maximum Heart Rate',
				defaultValue: 1,
				algo: false,
				metricName: 'max_heart_rate'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 7 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band7_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 7 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band7_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Sprint Effts',
				defaultValue: 1,
				algo: false,
				metricName: 'sprint_effts'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 2 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band2_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Activity metricLabel',
				defaultValue: 1,
				algo: false,
				metricName: 'activity_metricLabel'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 6 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band6_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 5 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band5_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 2 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band2_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band8_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 3 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band3_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 1 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band1_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 3 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band3_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 5 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band5_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 4 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band4_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 7 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band7_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 4 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band4_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: '# of Sprints',
				defaultValue: 1,
				algo: false,
				metricName: '#_of_sprints'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'A:D/min',
				defaultValue: 1,
				algo: false,
				metricName: 'a:d/min'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 8 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band8_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 5 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band5_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'HSR',
				defaultValue: 1,
				algo: false,
				metricName: 'hsr'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 8 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band8_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 2 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band2_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 8 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band8_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 8 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band8_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Decels Per Session',
				defaultValue: 1,
				algo: false,
				metricName: 'decel'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 8 Total # Efforts',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band8_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 2 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band2_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Accels GPS',
				defaultValue: 1,
				algo: false,
				metricName: 'accels_gps'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Velocity Band 7 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'velocity_band7_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Minimum Heart Rate',
				defaultValue: 1,
				algo: false,
				metricName: 'min_heart_rate'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Avg Heart Rate',
				defaultValue: 1,
				algo: false,
				metricName: 'mean_heart_rate'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Player Load Band 4 Total Distance',
				defaultValue: 1,
				algo: false,
				metricName: 'player_load_band4_total_distance'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 8 Total Duration',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band8_total_duration'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Heart Rate Band 6 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'heart_rate_band6_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Explosive Efforts',
				defaultValue: 1,
				algo: false,
				metricName: 'explosive_efforts'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Metabolic Power Band 5 Total # Efforts',
				defaultValue: 1,
				algo: false,
				metricName: 'metabolic_power_band5_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'Acceleration Band 4 Total Effort Count',
				defaultValue: 1,
				algo: false,
				metricName: 'acceleration_band4_total_effort_count'
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'RPE *',
				algo: true,
				metricName: 'rpe',
				defaultValue: 0
			}),
			new DeviceMetricDescriptor({
				metricLabel: 'RPE TL *',
				algo: true,
				metricName: 'rpeTl',
				defaultValue: 0
			}),
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
