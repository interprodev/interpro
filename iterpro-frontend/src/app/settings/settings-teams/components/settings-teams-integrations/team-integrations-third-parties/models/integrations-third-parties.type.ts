import { RawMetricFormat, RawMetricType, Team } from '@iterpro/shared/data-access/sdk';
import { FormArray, FormControl, FormGroup } from '@angular/forms';

export type TeamIntegration =
	Pick<Team, 'id' | 'fieldwizId' | 'gpexeId' | 'statsportId' | 'sonraId' | 'wimuId' | 'wyscoutId' | 'instatId' |
	'sepGps' | 'sepTeam' | 'sepPlayer' | 'mainSplitName' | 'mainGameName' | 'localTimezone' | 'device' | 'providerTeam' | // General Fields
	'_gpsProviderMapping' | 'mappingPreset' | 'thirdPartyCredentials' | // GPS Mapping Fields
	'_teamProviderMapping' | 'mappingPresetTeam' | // Game Stats Team Mapping Fields
	'_playerProviderMapping' | 'mappingPresetPlayer' | 'providerPlayer'>; // Game Stats Player Mapping Fields

// region General
export type IntegrationGeneralForm = {
	sepGps: FormControl<string>;
	sepTeam: FormControl<string>;
	sepPlayer: FormControl<string>;
	mainSplitName: FormControl<string>;
	mainGameName: FormControl<string>;
	localTimezone: FormControl<string>;
}

export type IntegrationGeneral = {sepGps: string, sepTeam: string, sepPlayer: string, mainSplitName: string, mainGameName: string, localTimezone: string};
// endregion

// region GPS Mapping
export type GpsMappingForm = {
	primarySettings: FormGroup<GpsMappingPrimarySettingsForm>;
	defaultMetrics: FormArray<FormGroup<DefaultMetricsForm>>;
	rawMetrics: FormArray<FormGroup<RawMetricsForm>>;
	security: FormGroup<SecurityForm>;
}

export type GpsMappingPrimarySettingsForm = { // team._gpsProviderMapping._gpsMetricsMapping
	id: FormControl<string>;
	playerNameColumn: FormControl<string>;
	splitNameColumn: FormControl<string>;
	dateColumn: FormControl<string>;
	dateColumnFormat: FormControl<number>;
	startTimeColumn: FormControl<string>;
	startTimeColumnFormat: FormControl<number>;
	endTimeColumn: FormControl<string>;
	endTimeColumnFormat: FormControl<number>;
	durationColumn: FormControl<string>;
	durationColumnFormat: FormControl<number>;
	mappingPreset: FormControl<string>;
	custom: FormControl<boolean>;
}

export type DefaultMetricsForm = { // array of team._gpsProviderMapping._gpsMetricsMapping
	id: FormControl<string>;
	columnName: FormControl<string>;
	columnLabel: FormControl<string>;
	expression: FormControl<string>;
}

export type RawMetricsForm = { // array of team._gpsProviderMapping.rawMetrics
	name: FormControl<string>;
	label: FormControl<string>;
	type: FormControl<RawMetricType>;
	format: FormControl<RawMetricFormat>;
}

export type SecurityForm = {
	gpexeUsername: FormControl<string>;
	gpexePassword: FormControl<string>;
	statsportAccessKey: FormControl<string>;
	statsportSecretKey: FormControl<string>;
	catapultBaseUrl: FormControl<string>;
	catapultLongLivedToken: FormControl<string>;
	catapultTeamName: FormControl<string>;
	catapultGameTag: FormControl<string>;
	wimuUsername: FormControl<string>;
	wimuPassword: FormControl<string>;
}

export type PrimarySettings = {label: string, value: PrimarySettingValue, format?: PrimarySettingFormat};
export type DefaultMetrics = {id: string, columnName: string, columnLabel: string, expression: string};
export type RawMetrics = {name: string, label: string, type: RawMetricType, format: RawMetricFormat};
export type Security = {gpexeUsername: string, gpexePassword: string, statsportAccessKey: string, statsportSecretKey: string, catapultBaseUrl: string, catapultLongLivedToken: string, catapultTeamName: string, catapultGameTag: string, wimuUsername: string, wimuPassword: string};
type PrimarySettingValue = 'dateColumn' | 'startTimeColumn' | 'endTimeColumn' | 'durationColumn' | 'playerNameColumn' | 'splitNameColumn';
type PrimarySettingFormat = 'dateColumnFormat' | 'startTimeColumnFormat' | 'endTimeColumnFormat' | 'durationColumnFormat';
export type GPSMappingProvider = 'Playertek' | 'STATSport' | 'K-Sport';
export const basicGpsPrimarySettings: PrimarySettings[] = [
	{ label: 'Player name', value: 'playerNameColumn'},
	{ label: 'Split', value: 'splitNameColumn'},
	{
		label: 'Date',
		value: 'dateColumn',
		format: 'dateColumnFormat',
	},
	{
		label: 'Start time',
		value: 'startTimeColumn',
		format: 'startTimeColumnFormat',
	},
	{
		label: 'End time',
		value: 'endTimeColumn',
		format: 'endTimeColumnFormat',
	},
	{
		label: 'Duration',
		value: 'durationColumn',
		format: 'durationColumnFormat',
	}
];

//endregion

//region Game Team Mapping
export type GameTeamPrimarySettingsForm = {
	id: FormControl<string>;
	goalsScoredField: FormControl<string>;
	goalsConcedField: FormControl<string>;
	gameField: FormControl<string>;
	mappingPresetTeam: FormControl<string>;
	custom: FormControl<boolean>;
}
export type GameTeamMappingForm = {
	primarySettings: FormGroup<GameTeamPrimarySettingsForm>;
	rawMetrics: FormArray<FormGroup<RawMetricsForm>>;
}
export const basicsGameTeamPrimarySettings = [
	{ label: 'Game Field', value: 'gameField' },
	{ label: 'Goals Scored', value: 'goalsScoredField' },
	{ label: 'Goals Conceded', value: 'goalsConcedField' }
];
//endregion

//region Game Player Mapping
export type GamePlayerPrimarySettingsForm = {
	id: FormControl<string>;
	gameField: FormControl<string>;
	splitField: FormControl<string>;
	durationField: FormControl<string>;
	playerField: FormControl<string>;
	yellowCardField: FormControl<string>;
	redCardField: FormControl<string>;
	substituteInMinuteField: FormControl<string>;
	substituteOutMinuteField: FormControl<string>;
	scoreField: FormControl<string>;
	mappingPresetPlayer: FormControl<string>;
	custom: FormControl<boolean>;
}

export const basicsGamePlayerPrimarySettings = [
	{ label: 'Game Field', value: 'gameField', },
	{ label: 'Split Field ', value: 'splitField' },
	{ label: 'Minutes Played', value: 'durationField' },
	{ label: 'Player Field', value: 'playerField' },
	{ label: 'Yellow Card Field', value: 'yellowCardField' },
	{ label: 'Red Card Field', value: 'redCardField' },
	{ label: 'Substitute in Field', value: 'substituteInMinuteField' },
	{ label: 'Substitute out Field', value: 'substituteOutMinuteField' },
	{ label: 'Score Field', value: 'scoreField' }
];

export type GamePlayerMappingForm = {
	primarySettings: FormGroup<GamePlayerPrimarySettingsForm>;
	rawMetrics: FormArray<FormGroup<RawMetricsForm>>;
}
//endregion

//region Team Integrations Form
export type TeamIntegrationsThirdPartiesForm = {
	general: FormGroup<IntegrationGeneralForm>;
	gpsMapping: FormGroup<GpsMappingForm>;
	gameTeamMapping: FormGroup<GameTeamMappingForm>;
	gamePlayerMapping: FormGroup<GamePlayerMappingForm>;
}
//endregion
