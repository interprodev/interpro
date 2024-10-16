import { Injectable } from '@angular/core';
import {
	DeviceMetricDescriptor,
	EtlDateType,
	EtlDurationType,
	GpsProviderMapping,
	RawMetricType,
	SessionPlayerData,
	Team,
	Threshold,
	getEtlDateTypeFromDateFormat,
	getEtlDurationTypeFromDurationFormat
} from '@iterpro/shared/data-access/sdk';
import { sanitizeExpression } from '@iterpro/shared/utils/common-utils';
import { evaluate } from 'mathjs';
import * as moment from 'moment';
import { EtlDateDurationService } from '../etlDateDurationService';
import { BaseEtlGpsService } from './baseEtlGpsService';

@Injectable({
	providedIn: 'root'
})
export class EtlGpsDynamicService implements BaseEtlGpsService {
	private metricsMapping: DeviceMetricDescriptor[];

	constructor(
		private etlDateService: EtlDateDurationService,
		private currentTeam: Team
	) {
		this.metricsMapping = new Array<DeviceMetricDescriptor>();
		const teamMappings: GpsProviderMapping = currentTeam._gpsProviderMapping;
		for (const m of teamMappings.rawMetrics) {
			this.metricsMapping.push(
				new DeviceMetricDescriptor({
					metricLabel: m.label,
					algo: false,
					metricName: m.name,
					defaultValue: 1
				})
			);
		}
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
			val.metricName = val.metricName && val.metricName.replace(/\./g, '_');
			return val;
		});
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
		trArr.push(
			new Threshold({
				name: 'highspeedRunningDistance',
				customValue: 1000,
				hidden: true
			})
		);
		trArr.push(new Threshold({ name: 'powerDistance', customValue: 2500, hidden: true }));
		trArr.push(new Threshold({ name: 'highPowerDistance', customValue: 1500, hidden: true }));
		trArr.push(new Threshold({ name: 'powerPlays', customValue: 150, hidden: true }));
		trArr.push(
			new Threshold({
				name: 'highIntensityDeceleration',
				customValue: 80,
				hidden: true
			})
		);
		trArr.push(new Threshold({ name: 'explosiveDistance', customValue: 500, hidden: true }));
		trArr.push(
			new Threshold({
				name: 'highIntensityAcceleration',
				customValue: 80,
				hidden: true
			})
		);
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

	getSessionsFromCsv(data: any[], team: Team): SessionPlayerData[] {
		const sessionsToImport: SessionPlayerData[] = [];
		for (const object of data) {
			const session: any = new SessionPlayerData();
			const scope = {};
			let splitNameField = null;

			session.playerName = object[team._gpsProviderMapping.playerNameColumn]?.trim() || null;
			session.date = this.etlDateService.getDateFromEtlFormat(
				object[team._gpsProviderMapping.dateColumn],
				team._gpsProviderMapping.dateColumnFormat,
				team.localTimezone
			);
			session.splitStartTime = this.etlDateService.getDateFromEtlFormat(
				object[team._gpsProviderMapping.startTimeColumn],
				team._gpsProviderMapping.startTimeColumnFormat,
				team.localTimezone,
				session.date
			);
			session.splitEndTime = this.etlDateService.getDateFromEtlFormat(
				object[team._gpsProviderMapping.endTimeColumn],
				team._gpsProviderMapping.endTimeColumnFormat,
				team.localTimezone,
				session.date
			);
			if (
				team._gpsProviderMapping.dateColumnFormat === EtlDateType.DDMMYY ||
				team._gpsProviderMapping.dateColumnFormat === EtlDateType.DDMMYYYY
			) {
				session.date = this.etlDateService.adjustDateWithStartTime(session.date, session.splitStartTime);
			}
			Object.keys(object).forEach(key => {
				const newKey: string = key.replace(/\./g, '_').replace(/�/g, '_');
				session[newKey] = object[key];
				let newField = session[newKey];
				const rawMetric = team._gpsProviderMapping.rawMetrics.find((metric: any) => metric.name.replace(/\./g, '_') === newKey);
				if (rawMetric?.type === RawMetricType.duration) {
					newField = this.etlDateService.getDurationFromEtlFormat(
						newField,
						getEtlDurationTypeFromDurationFormat(rawMetric.format) as EtlDurationType
					);
				} else if (rawMetric?.type === RawMetricType.number) {
					newField = parseFloat(session[newKey].replace(',', '.'));
				} else if (rawMetric?.type === RawMetricType.date) {
					newField = this.etlDateService.getDateFromEtlFormat(
						newField,
						getEtlDateTypeFromDateFormat(rawMetric.format) as EtlDateType,
						team.localTimezone,
						session.date
					);
				} else {
					newField = session[newKey];
				}
				session[newKey] = newField;
				const sanitizedKey = sanitizeExpression('{' + key + '}');
				(scope as any)[sanitizedKey] = newField;
				if (team._gpsProviderMapping.splitNameColumn && key === team._gpsProviderMapping.splitNameColumn) splitNameField = key;
			});

			if (splitNameField) session.splitName = object[splitNameField];
			else session.splitName = team.mainSplitName;

			if (session.splitName && session.splitName !== 'all') {
				if (session.splitName === team.mainGameName || session.splitName === team.mainSplitName) {
					session.mainSession = true;
				}
			}

			if (team._gpsProviderMapping.durationColumn) {
				session.duration = this.etlDateService.getDurationFromEtlFormat(
					object[team._gpsProviderMapping.durationColumn],
					team._gpsProviderMapping.durationColumnFormat
				);
				session.splitEndTime = moment(session.splitStartTime).add(session.duration, 'minute').toDate();
			} else session.duration = moment(session.splitEndTime).diff(moment(session.splitStartTime), 'minutes');

			for (const defaultMetric of team._gpsProviderMapping._gpsMetricsMapping) {
				const formula = defaultMetric.expression;
				let valueExpression = null;
				if (formula) {
					const sanitized = sanitizeExpression(formula);
					valueExpression = this.evalExpression(scope, sanitized);
					session[defaultMetric.columnName] = valueExpression;
				} else session[defaultMetric.columnName] = session[defaultMetric.columnName] ? session[defaultMetric.columnName] : null;
			}

			if (session.splitName && session.splitName !== '') sessionsToImport.push(session);
		}

		return sessionsToImport;
	}

	getMetricsMapping(): DeviceMetricDescriptor[] {
		return this.metricsMapping;
	}

	evalExpression(scope: any, formula: any): number | null {
		let valueCalculated = 0;
		try {
			valueCalculated = evaluate(formula, scope) || scope[formula];
			return valueCalculated;
		} catch (error) {
			console.error(error);
			valueCalculated = 1;
			return null;
		}
	}
}
