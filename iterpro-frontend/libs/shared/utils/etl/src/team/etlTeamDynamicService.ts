import { Injectable } from '@angular/core';
import {
	AvailableProviderIdField,
	DeviceMetricDescriptor,
	EtlDateType,
	EtlDurationType,
	RawMetricType,
	Team,
	TeamProviderMapping,
	TeamStat,
	ThirdPartyEtlTeamService,
	Threshold,
	getEtlDateTypeFromDateFormat,
	getEtlDurationTypeFromDurationFormat
} from '@iterpro/shared/data-access/sdk';
import { EtlDateDurationService } from '../etlDateDurationService';
import { WithNoValidFields } from '../mixins/dynamicProviderField.mixin';

@Injectable({
	providedIn: 'root'
})
export class EtlTeamDynamicService extends WithNoValidFields() implements ThirdPartyEtlTeamService {
	private metricsMapping: DeviceMetricDescriptor[];

	constructor(private etlDateService: EtlDateDurationService, private currentTeam: Team) {
		super();
		this.metricsMapping = [];

		const teamMappings: TeamProviderMapping = currentTeam._teamProviderMapping;

		for (const metric of teamMappings.rawMetrics) {
			this.metricsMapping.push(
				new DeviceMetricDescriptor({
					metricLabel: metric.label,
					algo: false,
					metricName: metric.name,
					defaultValue: 1
				})
			);
		}

		this.metricsMapping = this.metricsMapping.map(val => {
			val.metricName = val.metricName.replace(/\./g, '_');
			return val;
		});
	}
	getProviderIdField(): AvailableProviderIdField | null {
		throw new Error('Method not implemented.');
	}
	getProviderShortIdField(): string | null {
		throw new Error('Method not implemented.');
	}
	getProviderTeamIdField(): string | null {
		throw new Error('Method not implemented.');
	}
	getProviderCompetitionIdField(): string | null {
		throw new Error('Method not implemented.');
	}
	getProviderSeasonIdField(): string | null {
		throw new Error('Method not implemented.');
	}
	getProviderCurrentTeamIdField(): string | null {
		throw new Error('Method not implemented.');
	}
	getProviderSecondaryTeamIdField(): string | null {
		throw new Error('Method not implemented.');
	}
	getProviderAlternateShortIdField(): string | null {
		throw new Error('Method not implemented.');
	}
	getProviderSyncedField(): string | null {
		throw new Error('Method not implemented.');
	}
	getProviderNationalLeagueField(): string | null {
		throw new Error('Method not implemented.');
	}
	getProviderNationalCupField(): string | null {
		throw new Error('Method not implemented.');
	}
	getProviderTournamentQualifiersField(): string | null {
		throw new Error('Method not implemented.');
	}
	getProviderTournamentFinalStagesField(): string | null {
		throw new Error('Method not implemented.');
	}
	getProviderStandingTeamsFilterField(): string | null {
		throw new Error('Method not implemented.');
	}
	getProviderSecondaryIdField(): string | null {
		throw new Error('Method not implemented.');
	}

	getDefaultThresholds(): Threshold[] {
		let thresholds: Threshold[] = [];
		for (const metric of this.metricsMapping) {
			if (!metric.algo) {
				const threshold: Threshold = new Threshold();
				threshold.name = metric.metricName;
				threshold.customValue = metric.defaultValue;
				threshold.hidden = false;
				thresholds.push(threshold);
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

	getTeamStatsFromCsv(csvData: any, team: Team): TeamStat {
		const teamMappings: TeamProviderMapping = team._teamProviderMapping;
		const teamStat: any = new TeamStat();
		Object.keys(csvData).forEach(key => {
			key = key.replace(/\./g, '_');
			let field = csvData[key];
			const rawMetric = teamMappings.rawMetrics.find(({ name }) => name.replace(/\./g, '_') === key);
			if (rawMetric) {
				switch (rawMetric.type) {
					case RawMetricType.duration: {
						const correspondingEtlType = getEtlDurationTypeFromDurationFormat(rawMetric.format);
						const fieldInMinutes = this.etlDateService.getDurationFromEtlFormat(
							field,
							correspondingEtlType as EtlDurationType
						);
						field = fieldInMinutes;
						break;
					}
					case RawMetricType.date: {
						const correspondingEtlType = getEtlDateTypeFromDateFormat(rawMetric.format);
						const fieldInMinutes = this.etlDateService.getDateFromEtlFormat(
							field,
							correspondingEtlType as EtlDateType,
							team.localTimezone
						);
						field = fieldInMinutes;
						break;
					}
					case RawMetricType.number: {
						field = csvData[key] ? parseFloat(csvData[key]) : null;
						break;
					}
					default: {
						field = csvData[key];
						break;
					}
				}
			}
			teamStat[key] = field;
		});

		return teamStat;
	}

	getMetricsMapping(): DeviceMetricDescriptor[] {
		return this.metricsMapping;
	}

	getMatchResultFields(home: boolean, teamMapping: TeamProviderMapping): any {
		if (home === true) {
			return [teamMapping.goalsScoredField, teamMapping.goalsConcedField];
		} else {
			return [teamMapping.goalsConcedField, teamMapping.goalsScoredField];
		}
	}
}
