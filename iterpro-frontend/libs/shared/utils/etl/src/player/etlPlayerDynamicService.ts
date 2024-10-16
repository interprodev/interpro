import { Injectable } from '@angular/core';
import {
	AvailableProviderIdField,
	DeviceMetricDescriptor,
	EtlDateType,
	EtlDurationType,
	PlayerProviderMapping,
	PlayerStat,
	RawMetricType,
	Team,
	ThirdPartyEtlPlayerService,
	Threshold,
	getEtlDateTypeFromDateFormat,
	getEtlDurationTypeFromDurationFormat
} from '@iterpro/shared/data-access/sdk';
import { v4 as uuid } from 'uuid';
import { EtlDateDurationService } from '../etlDateDurationService';
import { WithNoValidFields } from '../mixins/dynamicProviderField.mixin';

@Injectable({
	providedIn: 'root'
})
export class EtlPlayerDynamicService extends WithNoValidFields() implements ThirdPartyEtlPlayerService {
	private metricsMapping: DeviceMetricDescriptor[] = [];
	private currentTeamObj: Team;

	constructor(private etlDateService: EtlDateDurationService, private currentTeam: Team) {
		super();
		this.metricsMapping = [];
		this.currentTeamObj = currentTeam;
		const playerMapping: PlayerProviderMapping = currentTeam._playerProviderMapping;

		for (const m of playerMapping.rawMetrics) {
			this.metricsMapping.push(
				new DeviceMetricDescriptor({
					metricLabel: m.label,
					algo: false,
					metricName: m.name,
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

	getPlayerStatsFromCsv(csvData: any[], team: Team): PlayerStat[] {
		const playerMappings: PlayerProviderMapping = team._playerProviderMapping;
		const playerStatsToImport: PlayerStat[] = [];
		csvData.forEach(row => {
			const playerStats = new PlayerStat({
				id: uuid(),
				playerName: playerMappings.playerField in row ? row[playerMappings.playerField] : null,
				yellowCard: playerMappings.yellowCardField in row ? Number(row[playerMappings.yellowCardField]) > 0 : undefined,
				redCard: playerMappings.redCardField in row ? Number(row[playerMappings.redCardField]) > 0 : undefined,
				substituteInMinute:
					playerMappings.substituteInMinuteField in row
						? Number(row[playerMappings.substituteInMinuteField])
						: undefined,
				substituteOutMinute:
					playerMappings.substituteOutMinuteField in row
						? Number(row[playerMappings.substituteOutMinuteField])
						: undefined,
				minutesPlayed: playerMappings.durationField in row ? Number(row[playerMappings.durationField]) : undefined,
				gameName: playerMappings.gameField in row ? row[playerMappings.gameField] : null
			});

			Object.keys(row).forEach(key => {
				key = key.replace(/\./g, '_');
				let field = row[key];
				const rawMetric = playerMappings.rawMetrics.find(({ name }) => name.replace(/\./g, '_') === key);
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
							field = row[key] ? parseFloat(row[key]) : null;
							break;
						}
						default: {
							field = row[key];
							break;
						}
					}
				}
				(playerStats as any)[key] = field;
			});

			if (playerStats.playerName) playerStatsToImport.push(playerStats);
		});
		return playerStatsToImport;
	}

	getMetricsMapping(): DeviceMetricDescriptor[] {
		return this.metricsMapping;
	}

	getSplitColumnMetric(): DeviceMetricDescriptor {
		const mName = this.currentTeamObj._playerProviderMapping.splitField;
		return new DeviceMetricDescriptor({
			metricLabel: mName,
			algo: false,
			metricName: mName,
			defaultValue: 1
		});
	}

	getPlayerNameColumnMetric(): DeviceMetricDescriptor {
		const mName = this.currentTeamObj._playerProviderMapping.playerField;
		return new DeviceMetricDescriptor({
			metricLabel: mName,
			algo: false,
			metricName: mName,
			defaultValue: 1
		});
	}

	getDurationField(): DeviceMetricDescriptor {
		const mName = this.currentTeamObj._playerProviderMapping.durationField;
		return new DeviceMetricDescriptor({
			metricLabel: mName,
			algo: false,
			metricName: mName,
			defaultValue: 1
		});
	}
}
