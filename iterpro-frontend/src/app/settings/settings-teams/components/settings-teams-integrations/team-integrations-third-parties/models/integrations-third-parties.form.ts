import {
	DefaultMetrics,
	DefaultMetricsForm,
	GpsMappingForm,
	IntegrationGeneralForm,
	GpsMappingPrimarySettingsForm,
	RawMetrics,
	RawMetricsForm,
	Security,
	SecurityForm,
	TeamIntegration,
	TeamIntegrationsThirdPartiesForm,
	GameTeamMappingForm,
	GameTeamPrimarySettingsForm,
	GamePlayerMappingForm,
	GamePlayerPrimarySettingsForm
} from './integrations-third-parties.type';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import {
	DeviceType,
	GpsProviderMapping,
	PlayerProviderMapping,
	ProviderType,
	TeamProviderMapping
} from '@iterpro/shared/data-access/sdk';
import {
	isGamePlayerMappingDisabled,
	isGameTeamMappingDisabled,
	isGpsMappingDisabled,
	isSecuritySettingDisabled
} from '../utils/setting-team-integration.utils';
import { DEFAULT_GPS_METRIC_MAPPING } from '../utils/setting-team-integration.constants';
import { sortBy } from 'lodash';

//region General
function toGeneralForm(team: TeamIntegration): IntegrationGeneralForm {
	return {
		sepGps: new FormControl({value: team.sepGps, disabled: true}, {
			nonNullable: true,
		}),
		sepTeam: new FormControl({value: team.sepTeam, disabled: true}, {
			nonNullable: true,
		}),
		sepPlayer: new FormControl({value: team.sepPlayer, disabled: true}, {
			nonNullable: true,
		}),
		mainSplitName: new FormControl({value: team.mainSplitName, disabled: true}, {
			nonNullable: true,
			validators: Validators.compose([Validators.required])
		}),
		mainGameName: new FormControl({value: team.mainGameName, disabled: true}, {
			nonNullable: true,
			validators: Validators.compose([Validators.required])
		}),
		localTimezone: new FormControl({value: team.localTimezone, disabled: true}, {
			nonNullable: true,
			validators: Validators.compose([Validators.required])
		})
	}
}
//endregion

//region GPS Mapping
function toGpsMappingPrimarySettingsForm(mappingPreset: string, _gpsProviderMapping: GpsProviderMapping, device: DeviceType): GpsMappingPrimarySettingsForm {
	const required = isGpsMappingDisabled(device) ? null : Validators.required;
	return {
		id: new FormControl({value: _gpsProviderMapping.id, disabled: true}),
		playerNameColumn: new FormControl({value: _gpsProviderMapping.playerNameColumn, disabled: true}, required),
		splitNameColumn: new FormControl({value: _gpsProviderMapping.splitNameColumn, disabled: true}, required),
		dateColumn: new FormControl({value: _gpsProviderMapping.dateColumn, disabled: true}, required),
		dateColumnFormat: new FormControl({value: _gpsProviderMapping.dateColumnFormat, disabled: true}, required),
		startTimeColumn: new FormControl({value: _gpsProviderMapping.startTimeColumn, disabled: true}, required),
		startTimeColumnFormat: new FormControl({value: _gpsProviderMapping.startTimeColumnFormat, disabled: true}, required),
		endTimeColumn: new FormControl({value: _gpsProviderMapping.endTimeColumn, disabled: true}, required),
		endTimeColumnFormat: new FormControl({value: _gpsProviderMapping.endTimeColumnFormat, disabled: true}, required),
		durationColumn: new FormControl({value: _gpsProviderMapping.durationColumn, disabled: true}, required),
		durationColumnFormat: new FormControl({value: _gpsProviderMapping.durationColumnFormat, disabled: true}, required),
		mappingPreset: new FormControl({value: mappingPreset, disabled: true}),
		//@ts-ignore
		custom: new FormControl({value: _gpsProviderMapping.custom, disabled: true}),
	}
}

export function toDefaultMetricsForm(defaultMetric: DefaultMetrics): DefaultMetricsForm {
	return {
		id: new FormControl({value: defaultMetric.id, disabled: true}),
		columnName: new FormControl({value: defaultMetric.columnName, disabled: true}, Validators.required),
		columnLabel: new FormControl({value: defaultMetric.columnLabel, disabled: true}, Validators.required),
		expression: new FormControl({value: defaultMetric.expression, disabled: true}),
	}
}

export function toRawMetricsForm(rawMetric: RawMetrics): RawMetricsForm {
	return {
		name: new FormControl({value: rawMetric.name, disabled: true}, Validators.required),
		label: new FormControl({value: rawMetric.label, disabled: true}, Validators.required),
		type: new FormControl({value: rawMetric.type, disabled: true}, Validators.required),
		format: new FormControl({value: rawMetric.format, disabled: true}),
	}
}
export function toSecurityForm(security: Security, device: DeviceType): SecurityForm {
	const required = isSecuritySettingDisabled(device) ? null : Validators.required;
	return {
		gpexeUsername: new FormControl({value: security?.gpexeUsername, disabled: true}, device === 'Gpexe' ? required : null),
		gpexePassword: new FormControl({value: security?.gpexePassword, disabled: true}, device === 'Gpexe' ? required : null),
		statsportAccessKey: new FormControl({value: security?.statsportAccessKey, disabled: true}, device === 'StatsportAPI' ? required : null),
		statsportSecretKey: new FormControl({value: security?.statsportSecretKey, disabled: true}, device === 'StatsportAPI' ? required : null),
		catapultBaseUrl: new FormControl({value: security?.catapultBaseUrl, disabled: true}, device === 'Catapult' ? required : null),
		catapultLongLivedToken: new FormControl({value: security?.catapultLongLivedToken, disabled: true}, device === 'Catapult' ? required : null),
		catapultTeamName: new FormControl({value: security?.catapultTeamName, disabled: true}, device === 'Catapult' ? required : null),
		catapultGameTag: new FormControl({value: security?.catapultGameTag, disabled: true}, device === 'Catapult' ? required : null),
		wimuUsername: new FormControl({value: security?.wimuUsername, disabled: true}, device === 'Wimu' ? required : null),
		wimuPassword: new FormControl({value: security?.wimuPassword, disabled: true}, device === 'Wimu' ? required : null),
	}
}
//endregion

//region Game Team Mapping
function toGameTeamPrimarySettingsForm(mappingPresetTeam: string, _teamProviderMapping: TeamProviderMapping, providerTeam: ProviderType): GameTeamPrimarySettingsForm {
	const required = isGameTeamMappingDisabled(providerTeam) ? null : Validators.required;
	return {
		id: new FormControl({value: _teamProviderMapping?.id, disabled: true}),
		goalsScoredField: new FormControl({value: _teamProviderMapping?.goalsScoredField, disabled: true}, required),
		goalsConcedField: new FormControl({value: _teamProviderMapping?.goalsConcedField, disabled: true}, required),
		mappingPresetTeam: new FormControl({value: mappingPresetTeam, disabled: true}),
		//@ts-ignore
		gameField: new FormControl({value: _teamProviderMapping?.gameField, disabled: true}, required),
		//@ts-ignore
		custom: new FormControl({value: _teamProviderMapping?.custom, disabled: true}),
	}
}
//endregion

//region Game Player Mapping
function toGamePlayerPrimarySettingsForm(mappingPresetPlayer: string, _playerProviderMapping: PlayerProviderMapping, providerPlayer: ProviderType): GamePlayerPrimarySettingsForm {
	const required = isGamePlayerMappingDisabled(providerPlayer) ? null : Validators.required;
	return {
		id: new FormControl({value: _playerProviderMapping?.id, disabled: true}),
		gameField: new FormControl({value: _playerProviderMapping?.gameField, disabled: true}, required),
		splitField: new FormControl({value: _playerProviderMapping?.splitField, disabled: true}, required),
		durationField: new FormControl({value: _playerProviderMapping?.durationField, disabled: true}, required),
		playerField: new FormControl({value: _playerProviderMapping?.playerField, disabled: true}, required),
		yellowCardField: new FormControl({value: _playerProviderMapping?.yellowCardField, disabled: true}, required),
		redCardField: new FormControl({value: _playerProviderMapping?.redCardField, disabled: true}, required),
		substituteInMinuteField: new FormControl({value: _playerProviderMapping?.substituteInMinuteField, disabled: true}, required),
		substituteOutMinuteField: new FormControl({value: _playerProviderMapping?.substituteOutMinuteField, disabled: true}, required),
		scoreField: new FormControl({value: _playerProviderMapping?.scoreField, disabled: true}, required),
		mappingPresetPlayer: new FormControl({value: mappingPresetPlayer, disabled: true}),
		//@ts-ignore
		custom: new FormControl({value: _playerProviderMapping?.custom, disabled: true}),
	}
}
//endregion

//region To Form
export function toTeamIntegrationsForm(team: TeamIntegration): TeamIntegrationsThirdPartiesForm {
	return {
		general: new FormGroup<IntegrationGeneralForm>(toGeneralForm(team)),
		gpsMapping: new FormGroup<GpsMappingForm>({
			primarySettings: new FormGroup<GpsMappingPrimarySettingsForm>(toGpsMappingPrimarySettingsForm(team.mappingPreset, team._gpsProviderMapping, team.device as DeviceType)),
			defaultMetrics: new FormArray<FormGroup<DefaultMetricsForm>>((team._gpsProviderMapping._gpsMetricsMapping || DEFAULT_GPS_METRIC_MAPPING).map((metric: DefaultMetrics) => new FormGroup<DefaultMetricsForm>(toDefaultMetricsForm(metric)))),
			rawMetrics: new FormArray<FormGroup<RawMetricsForm>>(sortBy((team._gpsProviderMapping?.rawMetrics || []), 'label').map((metric: RawMetrics) => new FormGroup<RawMetricsForm>(toRawMetricsForm(metric)))),
			security: new FormGroup<SecurityForm>(toSecurityForm(team?.thirdPartyCredentials, team.device as DeviceType))
		}),
		gameTeamMapping: new FormGroup<GameTeamMappingForm>({
			primarySettings: new FormGroup<GameTeamPrimarySettingsForm>(toGameTeamPrimarySettingsForm(team.mappingPresetTeam, team._teamProviderMapping, team.providerTeam as ProviderType)),
			rawMetrics: new FormArray<FormGroup<RawMetricsForm>>(sortBy((team._teamProviderMapping?.rawMetrics || []), 'label').map((metric: RawMetrics) => new FormGroup<RawMetricsForm>(toRawMetricsForm(metric)))),
		}),
		gamePlayerMapping: new FormGroup<GamePlayerMappingForm>({
			primarySettings: new FormGroup<GamePlayerPrimarySettingsForm>(toGamePlayerPrimarySettingsForm(team.mappingPresetPlayer, team._playerProviderMapping, team.providerPlayer as ProviderType)),
			rawMetrics: new FormArray<FormGroup<RawMetricsForm>>(sortBy((team._playerProviderMapping?.rawMetrics || []), 'label').map((metric: RawMetrics) => new FormGroup<RawMetricsForm>(toRawMetricsForm(metric)))),
		})
	}
}
//endregion
