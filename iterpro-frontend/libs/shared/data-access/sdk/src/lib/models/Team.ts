/* tslint:disable */
import {
  EntityChangelog,
  Player,
  SessionImportData,
  Drill,
  Test,
  Match,
  Threshold,
  Event,
  TeamGroup,
  Attachment,
  TeamSeason,
  GpsProviderMapping,
  TeamProviderMapping,
  PlayerProviderMapping,
  PlayerScouting,
  Club,
  Staff,
  ScoutingLineup,
  VideoAsset,
  ScoutingGame,
  TeamTableFilterTemplate
} from '../index';

declare var Object: any;
export interface TeamInterface {
  "name"?: string;
  "urlImage"?: string;
  "mappingPreset"?: string;
  "mappingPresetTeam"?: string;
  "mappingPresetPlayer"?: string;
  "device"?: string;
  "accountType"?: string;
  "providerTeam"?: string;
  "providerPlayer"?: string;
  "sepGps"?: string;
  "sepTeam"?: string;
  "sepPlayer"?: string;
  "mainSplitName"?: string;
  "mainGameName"?: string;
  "localTimezone"?: string;
  "mobileWellnessNotification"?: boolean;
  "botHourMessage"?: string;
  "botGmt"?: number;
  "goSettings"?: any;
  "crest"?: string;
  "wyscoutId"?: number;
  "instatId"?: number;
  "gpexeId"?: number;
  "catapultId"?: any;
  "fieldwizId"?: any;
  "statsportId"?: any;
  "sonraId"?: any;
  "wimuId"?: string;
  "videoExternalPlatform"?: boolean;
  "wyscoutCompetitionId"?: number;
  "instatCompetitionId"?: number;
  "wyscoutStandingTeamsFilter"?: any;
  "instatStandingTeamsFilter"?: any;
  "wyscoutAreas"?: any;
  "instatAreas"?: any;
  "thirdPartyCredentials"?: any;
  "contractExportCredentials"?: any;
  "customersLimit"?: number;
  "metricsTests"?: any;
  "treatmentMetrics"?: any;
  "drillTacticalGoals"?: Array<any>;
  "drillTechnicalGoals"?: Array<any>;
  "drillPhysicalGoals"?: Array<any>;
  "drillThemes"?: Array<any>;
  "enabledModules"?: any;
  "playerApp"?: boolean;
  "playerAppLimit"?: number;
  "gender"?: string;
  "altScouting"?: boolean;
  "pinnedTreatments"?: any;
  "landingPage"?: string;
  "activePlayersLimit"?: number;
  "archivedPlayersLimit"?: number;
  "playerAttributes"?: Array<any>;
  "gameReportSettings"?: any;
  "trainingReportSettings"?: any;
  "id"?: any;
  "_thresholdsTeam"?: Array<any>;
  "_presetTestAttachments"?: Array<any>;
  "_gpsProviderMapping"?: any;
  "_teamProviderMapping"?: any;
  "_playerProviderMapping"?: any;
  "clubId"?: any;
  changelog?: EntityChangelog[];
  players?: Player[];
  sessionImportData?: SessionImportData[];
  drills?: Drill[];
  tests?: Test[];
  match?: Match[];
  thresholdsTeam?: Threshold[];
  events?: Event[];
  teamGroups?: TeamGroup[];
  presetTestAttachments?: Attachment[];
  teamSeasons?: TeamSeason[];
  gpsProviderMapping?: GpsProviderMapping[];
  teamProviderMapping?: TeamProviderMapping[];
  playerProviderMapping?: PlayerProviderMapping[];
  playersScouting?: PlayerScouting[];
  club?: Club;
  staff?: Staff[];
  scoutingScenarios?: ScoutingLineup[];
  videoAssets?: VideoAsset[];
  scoutingGames?: ScoutingGame[];
  tableFilterTemplates?: TeamTableFilterTemplate[];
}

export class Team implements TeamInterface {
  "name": string;
  "urlImage": string;
  "mappingPreset": string;
  "mappingPresetTeam": string;
  "mappingPresetPlayer": string;
  "device": string;
  "accountType": string;
  "providerTeam": string;
  "providerPlayer": string;
  "sepGps": string;
  "sepTeam": string;
  "sepPlayer": string;
  "mainSplitName": string;
  "mainGameName": string;
  "localTimezone": string;
  "mobileWellnessNotification": boolean;
  "botHourMessage": string;
  "botGmt": number;
  "goSettings": any;
  "crest": string;
  "wyscoutId": number;
  "instatId": number;
  "gpexeId": number;
  "catapultId": any;
  "fieldwizId": any;
  "statsportId": any;
  "sonraId": any;
  "wimuId": string;
  "videoExternalPlatform": boolean;
  "wyscoutCompetitionId": number;
  "instatCompetitionId": number;
  "wyscoutStandingTeamsFilter": any;
  "instatStandingTeamsFilter": any;
  "wyscoutAreas": any;
  "instatAreas": any;
  "thirdPartyCredentials": any;
  "contractExportCredentials": any;
  "customersLimit": number;
  "metricsTests": any;
  "treatmentMetrics": any;
  "drillTacticalGoals": Array<any>;
  "drillTechnicalGoals": Array<any>;
  "drillPhysicalGoals": Array<any>;
  "drillThemes": Array<any>;
  "enabledModules": any;
  "playerApp": boolean;
  "playerAppLimit": number;
  "gender": string;
  "altScouting": boolean;
  "pinnedTreatments": any;
  "landingPage": string;
  "activePlayersLimit": number;
  "archivedPlayersLimit": number;
  "playerAttributes": Array<any>;
  "gameReportSettings": any;
  "trainingReportSettings": any;
  "id": any;
  "_thresholdsTeam": Array<any>;
  "_presetTestAttachments": Array<any>;
  "_gpsProviderMapping": any;
  "_teamProviderMapping": any;
  "_playerProviderMapping": any;
  "clubId": any;
  changelog: EntityChangelog[];
  players: Player[];
  sessionImportData: SessionImportData[];
  drills: Drill[];
  tests: Test[];
  match: Match[];
  thresholdsTeam: Threshold[];
  events: Event[];
  teamGroups: TeamGroup[];
  presetTestAttachments: Attachment[];
  teamSeasons: TeamSeason[];
  gpsProviderMapping: GpsProviderMapping[];
  teamProviderMapping: TeamProviderMapping[];
  playerProviderMapping: PlayerProviderMapping[];
  playersScouting: PlayerScouting[];
  club: Club;
  staff: Staff[];
  scoutingScenarios: ScoutingLineup[];
  videoAssets: VideoAsset[];
  scoutingGames: ScoutingGame[];
  tableFilterTemplates: TeamTableFilterTemplate[];
  constructor(data?: TeamInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Team`.
   */
  public static getModelName() {
    return "Team";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Team for dynamic purposes.
  **/
  public static factory(data: TeamInterface): Team{
    return new Team(data);
  }
  /**
  * @method getModelDefinition
  * @author Julien Ledun
  * @license MIT
  * This method returns an object that represents some of the model
  * definitions.
  **/
  public static getModelDefinition() {
    return {
      name: 'Team',
      plural: 'teams',
      path: 'teams',
      idName: 'id',
      properties: {
        "name": {
          name: 'name',
          type: 'string'
        },
        "urlImage": {
          name: 'urlImage',
          type: 'string'
        },
        "mappingPreset": {
          name: 'mappingPreset',
          type: 'string'
        },
        "mappingPresetTeam": {
          name: 'mappingPresetTeam',
          type: 'string'
        },
        "mappingPresetPlayer": {
          name: 'mappingPresetPlayer',
          type: 'string'
        },
        "device": {
          name: 'device',
          type: 'string'
        },
        "accountType": {
          name: 'accountType',
          type: 'string'
        },
        "providerTeam": {
          name: 'providerTeam',
          type: 'string'
        },
        "providerPlayer": {
          name: 'providerPlayer',
          type: 'string'
        },
        "sepGps": {
          name: 'sepGps',
          type: 'string',
          default: ';'
        },
        "sepTeam": {
          name: 'sepTeam',
          type: 'string',
          default: ';'
        },
        "sepPlayer": {
          name: 'sepPlayer',
          type: 'string',
          default: ';'
        },
        "mainSplitName": {
          name: 'mainSplitName',
          type: 'string',
          default: 'session'
        },
        "mainGameName": {
          name: 'mainGameName',
          type: 'string',
          default: 'game'
        },
        "localTimezone": {
          name: 'localTimezone',
          type: 'string'
        },
        "mobileWellnessNotification": {
          name: 'mobileWellnessNotification',
          type: 'boolean',
          default: true
        },
        "botHourMessage": {
          name: 'botHourMessage',
          type: 'string',
          default: '09:00'
        },
        "botGmt": {
          name: 'botGmt',
          type: 'number',
          default: 0
        },
        "goSettings": {
          name: 'goSettings',
          type: 'any'
        },
        "crest": {
          name: 'crest',
          type: 'string'
        },
        "wyscoutId": {
          name: 'wyscoutId',
          type: 'number'
        },
        "instatId": {
          name: 'instatId',
          type: 'number'
        },
        "gpexeId": {
          name: 'gpexeId',
          type: 'number'
        },
        "catapultId": {
          name: 'catapultId',
          type: 'any'
        },
        "fieldwizId": {
          name: 'fieldwizId',
          type: 'any'
        },
        "statsportId": {
          name: 'statsportId',
          type: 'any'
        },
        "sonraId": {
          name: 'sonraId',
          type: 'any'
        },
        "wimuId": {
          name: 'wimuId',
          type: 'string'
        },
        "videoExternalPlatform": {
          name: 'videoExternalPlatform',
          type: 'boolean'
        },
        "wyscoutCompetitionId": {
          name: 'wyscoutCompetitionId',
          type: 'number'
        },
        "instatCompetitionId": {
          name: 'instatCompetitionId',
          type: 'number'
        },
        "wyscoutStandingTeamsFilter": {
          name: 'wyscoutStandingTeamsFilter',
          type: 'any'
        },
        "instatStandingTeamsFilter": {
          name: 'instatStandingTeamsFilter',
          type: 'any'
        },
        "wyscoutAreas": {
          name: 'wyscoutAreas',
          type: 'any'
        },
        "instatAreas": {
          name: 'instatAreas',
          type: 'any'
        },
        "thirdPartyCredentials": {
          name: 'thirdPartyCredentials',
          type: 'any'
        },
        "contractExportCredentials": {
          name: 'contractExportCredentials',
          type: 'any'
        },
        "customersLimit": {
          name: 'customersLimit',
          type: 'number'
        },
        "metricsTests": {
          name: 'metricsTests',
          type: 'any'
        },
        "treatmentMetrics": {
          name: 'treatmentMetrics',
          type: 'any'
        },
        "drillTacticalGoals": {
          name: 'drillTacticalGoals',
          type: 'Array&lt;any&gt;'
        },
        "drillTechnicalGoals": {
          name: 'drillTechnicalGoals',
          type: 'Array&lt;any&gt;'
        },
        "drillPhysicalGoals": {
          name: 'drillPhysicalGoals',
          type: 'Array&lt;any&gt;'
        },
        "drillThemes": {
          name: 'drillThemes',
          type: 'Array&lt;any&gt;'
        },
        "enabledModules": {
          name: 'enabledModules',
          type: 'any'
        },
        "playerApp": {
          name: 'playerApp',
          type: 'boolean',
          default: false
        },
        "playerAppLimit": {
          name: 'playerAppLimit',
          type: 'number',
          default: 30
        },
        "gender": {
          name: 'gender',
          type: 'string',
          default: 'male'
        },
        "altScouting": {
          name: 'altScouting',
          type: 'boolean',
          default: false
        },
        "pinnedTreatments": {
          name: 'pinnedTreatments',
          type: 'any'
        },
        "landingPage": {
          name: 'landingPage',
          type: 'string'
        },
        "activePlayersLimit": {
          name: 'activePlayersLimit',
          type: 'number'
        },
        "archivedPlayersLimit": {
          name: 'archivedPlayersLimit',
          type: 'number'
        },
        "playerAttributes": {
          name: 'playerAttributes',
          type: 'Array&lt;any&gt;'
        },
        "gameReportSettings": {
          name: 'gameReportSettings',
          type: 'any'
        },
        "trainingReportSettings": {
          name: 'trainingReportSettings',
          type: 'any'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "_thresholdsTeam": {
          name: '_thresholdsTeam',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_presetTestAttachments": {
          name: '_presetTestAttachments',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_gpsProviderMapping": {
          name: '_gpsProviderMapping',
          type: 'any'
        },
        "_teamProviderMapping": {
          name: '_teamProviderMapping',
          type: 'any'
        },
        "_playerProviderMapping": {
          name: '_playerProviderMapping',
          type: 'any'
        },
        "clubId": {
          name: 'clubId',
          type: 'any'
        },
      },
      relations: {
        changelog: {
          name: 'changelog',
          type: 'EntityChangelog[]',
          model: 'EntityChangelog',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'entityId'
        },
        players: {
          name: 'players',
          type: 'Player[]',
          model: 'Player',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'teamId'
        },
        sessionImportData: {
          name: 'sessionImportData',
          type: 'SessionImportData[]',
          model: 'SessionImportData',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'teamId'
        },
        drills: {
          name: 'drills',
          type: 'Drill[]',
          model: 'Drill',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'teamId'
        },
        tests: {
          name: 'tests',
          type: 'Test[]',
          model: 'Test',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'teamId'
        },
        match: {
          name: 'match',
          type: 'Match[]',
          model: 'Match',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'teamId'
        },
        thresholdsTeam: {
          name: 'thresholdsTeam',
          type: 'Threshold[]',
          model: 'Threshold',
          relationType: 'embedsMany',
                  keyFrom: '_thresholdsTeam',
          keyTo: 'id'
        },
        events: {
          name: 'events',
          type: 'Event[]',
          model: 'Event',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'teamId'
        },
        teamGroups: {
          name: 'teamGroups',
          type: 'TeamGroup[]',
          model: 'TeamGroup',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'teamId'
        },
        presetTestAttachments: {
          name: 'presetTestAttachments',
          type: 'Attachment[]',
          model: 'Attachment',
          relationType: 'embedsMany',
                  keyFrom: '_presetTestAttachments',
          keyTo: 'id'
        },
        teamSeasons: {
          name: 'teamSeasons',
          type: 'TeamSeason[]',
          model: 'TeamSeason',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'teamId'
        },
        gpsProviderMapping: {
          name: 'gpsProviderMapping',
          type: 'GpsProviderMapping[]',
          model: 'GpsProviderMapping',
          relationType: 'embedsOne',
                  keyFrom: '_gpsProviderMapping',
          keyTo: 'id'
        },
        teamProviderMapping: {
          name: 'teamProviderMapping',
          type: 'TeamProviderMapping[]',
          model: 'TeamProviderMapping',
          relationType: 'embedsOne',
                  keyFrom: '_teamProviderMapping',
          keyTo: 'id'
        },
        playerProviderMapping: {
          name: 'playerProviderMapping',
          type: 'PlayerProviderMapping[]',
          model: 'PlayerProviderMapping',
          relationType: 'embedsOne',
                  keyFrom: '_playerProviderMapping',
          keyTo: 'id'
        },
        playersScouting: {
          name: 'playersScouting',
          type: 'PlayerScouting[]',
          model: 'PlayerScouting',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'teamId'
        },
        club: {
          name: 'club',
          type: 'Club',
          model: 'Club',
          relationType: 'belongsTo',
                  keyFrom: 'clubId',
          keyTo: 'id'
        },
        staff: {
          name: 'staff',
          type: 'Staff[]',
          model: 'Staff',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'teamId'
        },
        scoutingScenarios: {
          name: 'scoutingScenarios',
          type: 'ScoutingLineup[]',
          model: 'ScoutingLineup',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'teamId'
        },
        videoAssets: {
          name: 'videoAssets',
          type: 'VideoAsset[]',
          model: 'VideoAsset',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'teamId'
        },
        scoutingGames: {
          name: 'scoutingGames',
          type: 'ScoutingGame[]',
          model: 'ScoutingGame',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'teamId'
        },
        tableFilterTemplates: {
          name: 'tableFilterTemplates',
          type: 'TeamTableFilterTemplate[]',
          model: 'TeamTableFilterTemplate',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'teamId'
        },
      }
    }
  }
}
