/* tslint:disable */
import {
  Team,
  Player,
  Match,
  SessionPlayerData,
  SessionImportData,
  DrillInstance,
  TestInstance,
  Attachment,
  TeamSeason,
  PlayerMatchStat,
  Staff,
  PlayerGameReport,
  PlayerTrainingReport,
  MedicalTreatment
} from '../index';

declare var Object: any;
export interface EventInterface {
  "csvGps"?: string;
  "csvPlayer"?: string;
  "csvTeam"?: string;
  "wyscoutSynced"?: boolean;
  "instatSynced"?: boolean;
  "title": string;
  "wyscoutId"?: number;
  "instatId"?: number;
  "allDay"?: boolean;
  "start": Date;
  "end"?: Date;
  "author"?: string;
  "duration"?: number;
  "description"?: string;
  "notes"?: string;
  "format"?: string;
  "subformat"?: any;
  "subformatDetails"?: string;
  "type"?: string;
  "where"?: string;
  "result"?: string;
  "resultFlag"?: boolean;
  "workload"?: number;
  "intensity"?: number;
  "theme"?: string;
  "subtheme"?: string;
  "home"?: boolean;
  "teamReport"?: any;
  "friendly"?: boolean;
  "destination"?: string;
  "recoveryStrategy"?: any;
  "nutritionalPre"?: any;
  "nutritionalDuring"?: any;
  "nutritionalPost"?: any;
  "opponent"?: string;
  "opponentImageUrl"?: string;
  "opponentWyscoutId"?: number;
  "opponentInstatId"?: number;
  "gpsSessionLoaded"?: boolean;
  "playersSessionLoaded"?: boolean;
  "lastUpdateDate"?: Date;
  "lastUpdateAuthor"?: string;
  "individual"?: boolean;
  "testModel"?: string;
  "medicalType"?: string;
  "injuryId"?: string;
  "clubGameHomeTeam"?: string;
  "clubGameAwayTeam"?: string;
  "id"?: any;
  "teamId"?: any;
  "playerIds"?: Array<any>;
  "_sessionPlayers"?: Array<any>;
  "_sessionImport"?: any;
  "_drillsExecuted"?: Array<any>;
  "_drills"?: Array<any>;
  "_attachments"?: Array<any>;
  "_video"?: any;
  "teamSeasonId"?: any;
  "_playerMatchStats"?: Array<any>;
  "_opponentPlayerMatchStats"?: Array<any>;
  "staffIds"?: Array<any>;
  team?: Team;
  players?: Player[];
  match?: Match;
  sessionPlayers?: SessionPlayerData[];
  sessionImport?: SessionImportData[];
  drillsExecuted?: DrillInstance[];
  drills?: DrillInstance[];
  testInstance?: TestInstance;
  attachments?: Attachment[];
  video?: Attachment[];
  teamSeason?: TeamSeason;
  playerMatchStats?: PlayerMatchStat[];
  opponentPlayerMatchStats?: PlayerMatchStat[];
  staff?: Staff[];
  gameReports?: PlayerGameReport[];
  trainingReports?: PlayerTrainingReport[];
  medicalTreatments?: MedicalTreatment[];
}

export class Event implements EventInterface {
  "csvGps": string;
  "csvPlayer": string;
  "csvTeam": string;
  "wyscoutSynced": boolean;
  "instatSynced": boolean;
  "title": string;
  "wyscoutId": number;
  "instatId": number;
  "allDay": boolean;
  "start": Date;
  "end": Date;
  "author": string;
  "duration": number;
  "description": string;
  "notes": string;
  "format": string;
  "subformat": any;
  "subformatDetails": string;
  "type": string;
  "where": string;
  "result": string;
  "resultFlag": boolean;
  "workload": number;
  "intensity": number;
  "theme": string;
  "subtheme": string;
  "home": boolean;
  "teamReport": any;
  "friendly": boolean;
  "destination": string;
  "recoveryStrategy": any;
  "nutritionalPre": any;
  "nutritionalDuring": any;
  "nutritionalPost": any;
  "opponent": string;
  "opponentImageUrl": string;
  "opponentWyscoutId": number;
  "opponentInstatId": number;
  "gpsSessionLoaded": boolean;
  "playersSessionLoaded": boolean;
  "lastUpdateDate": Date;
  "lastUpdateAuthor": string;
  "individual": boolean;
  "testModel": string;
  "medicalType": string;
  "injuryId": string;
  "clubGameHomeTeam": string;
  "clubGameAwayTeam": string;
  "id": any;
  "teamId": any;
  "playerIds": Array<any>;
  "_sessionPlayers": Array<any>;
  "_sessionImport": any;
  "_drillsExecuted": Array<any>;
  "_drills": Array<any>;
  "_attachments": Array<any>;
  "_video": any;
  "teamSeasonId": any;
  "_playerMatchStats": Array<any>;
  "_opponentPlayerMatchStats": Array<any>;
  "staffIds": Array<any>;
  team: Team;
  players: Player[];
  match: Match;
  sessionPlayers: SessionPlayerData[];
  sessionImport: SessionImportData[];
  drillsExecuted: DrillInstance[];
  drills: DrillInstance[];
  testInstance: TestInstance;
  attachments: Attachment[];
  video: Attachment[];
  teamSeason: TeamSeason;
  playerMatchStats: PlayerMatchStat[];
  opponentPlayerMatchStats: PlayerMatchStat[];
  staff: Staff[];
  gameReports: PlayerGameReport[];
  trainingReports: PlayerTrainingReport[];
  medicalTreatments: MedicalTreatment[];
  constructor(data?: EventInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Event`.
   */
  public static getModelName() {
    return "Event";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Event for dynamic purposes.
  **/
  public static factory(data: EventInterface): Event{
    return new Event(data);
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
      name: 'Event',
      plural: 'Events',
      path: 'Events',
      idName: 'id',
      properties: {
        "csvGps": {
          name: 'csvGps',
          type: 'string'
        },
        "csvPlayer": {
          name: 'csvPlayer',
          type: 'string'
        },
        "csvTeam": {
          name: 'csvTeam',
          type: 'string'
        },
        "wyscoutSynced": {
          name: 'wyscoutSynced',
          type: 'boolean',
          default: false
        },
        "instatSynced": {
          name: 'instatSynced',
          type: 'boolean',
          default: false
        },
        "title": {
          name: 'title',
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
        "allDay": {
          name: 'allDay',
          type: 'boolean'
        },
        "start": {
          name: 'start',
          type: 'Date'
        },
        "end": {
          name: 'end',
          type: 'Date'
        },
        "author": {
          name: 'author',
          type: 'string'
        },
        "duration": {
          name: 'duration',
          type: 'number'
        },
        "description": {
          name: 'description',
          type: 'string'
        },
        "notes": {
          name: 'notes',
          type: 'string'
        },
        "format": {
          name: 'format',
          type: 'string'
        },
        "subformat": {
          name: 'subformat',
          type: 'any'
        },
        "subformatDetails": {
          name: 'subformatDetails',
          type: 'string'
        },
        "type": {
          name: 'type',
          type: 'string'
        },
        "where": {
          name: 'where',
          type: 'string'
        },
        "result": {
          name: 'result',
          type: 'string'
        },
        "resultFlag": {
          name: 'resultFlag',
          type: 'boolean'
        },
        "workload": {
          name: 'workload',
          type: 'number'
        },
        "intensity": {
          name: 'intensity',
          type: 'number'
        },
        "theme": {
          name: 'theme',
          type: 'string'
        },
        "subtheme": {
          name: 'subtheme',
          type: 'string'
        },
        "home": {
          name: 'home',
          type: 'boolean'
        },
        "teamReport": {
          name: 'teamReport',
          type: 'any',
          default: <any>null
        },
        "friendly": {
          name: 'friendly',
          type: 'boolean'
        },
        "destination": {
          name: 'destination',
          type: 'string'
        },
        "recoveryStrategy": {
          name: 'recoveryStrategy',
          type: 'any'
        },
        "nutritionalPre": {
          name: 'nutritionalPre',
          type: 'any'
        },
        "nutritionalDuring": {
          name: 'nutritionalDuring',
          type: 'any'
        },
        "nutritionalPost": {
          name: 'nutritionalPost',
          type: 'any'
        },
        "opponent": {
          name: 'opponent',
          type: 'string'
        },
        "opponentImageUrl": {
          name: 'opponentImageUrl',
          type: 'string'
        },
        "opponentWyscoutId": {
          name: 'opponentWyscoutId',
          type: 'number'
        },
        "opponentInstatId": {
          name: 'opponentInstatId',
          type: 'number'
        },
        "gpsSessionLoaded": {
          name: 'gpsSessionLoaded',
          type: 'boolean',
          default: false
        },
        "playersSessionLoaded": {
          name: 'playersSessionLoaded',
          type: 'boolean',
          default: false
        },
        "lastUpdateDate": {
          name: 'lastUpdateDate',
          type: 'Date'
        },
        "lastUpdateAuthor": {
          name: 'lastUpdateAuthor',
          type: 'string'
        },
        "individual": {
          name: 'individual',
          type: 'boolean',
          default: false
        },
        "testModel": {
          name: 'testModel',
          type: 'string'
        },
        "medicalType": {
          name: 'medicalType',
          type: 'string'
        },
        "injuryId": {
          name: 'injuryId',
          type: 'string'
        },
        "clubGameHomeTeam": {
          name: 'clubGameHomeTeam',
          type: 'string'
        },
        "clubGameAwayTeam": {
          name: 'clubGameAwayTeam',
          type: 'string'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "teamId": {
          name: 'teamId',
          type: 'any'
        },
        "playerIds": {
          name: 'playerIds',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_sessionPlayers": {
          name: '_sessionPlayers',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_sessionImport": {
          name: '_sessionImport',
          type: 'any'
        },
        "_drillsExecuted": {
          name: '_drillsExecuted',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_drills": {
          name: '_drills',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_attachments": {
          name: '_attachments',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_video": {
          name: '_video',
          type: 'any'
        },
        "teamSeasonId": {
          name: 'teamSeasonId',
          type: 'any'
        },
        "_playerMatchStats": {
          name: '_playerMatchStats',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_opponentPlayerMatchStats": {
          name: '_opponentPlayerMatchStats',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "staffIds": {
          name: 'staffIds',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
      },
      relations: {
        team: {
          name: 'team',
          type: 'Team',
          model: 'Team',
          relationType: 'belongsTo',
                  keyFrom: 'teamId',
          keyTo: 'id'
        },
        players: {
          name: 'players',
          type: 'Player[]',
          model: 'Player',
          relationType: 'referencesMany',
                  keyFrom: 'playerIds',
          keyTo: 'id'
        },
        match: {
          name: 'match',
          type: 'Match',
          model: 'Match',
          relationType: 'hasOne',
                  keyFrom: 'id',
          keyTo: 'eventId'
        },
        sessionPlayers: {
          name: 'sessionPlayers',
          type: 'SessionPlayerData[]',
          model: 'SessionPlayerData',
          relationType: 'embedsMany',
                  keyFrom: '_sessionPlayers',
          keyTo: 'id'
        },
        sessionImport: {
          name: 'sessionImport',
          type: 'SessionImportData[]',
          model: 'SessionImportData',
          relationType: 'embedsOne',
                  keyFrom: '_sessionImport',
          keyTo: 'id'
        },
        drillsExecuted: {
          name: 'drillsExecuted',
          type: 'DrillInstance[]',
          model: 'DrillInstance',
          relationType: 'embedsMany',
                  keyFrom: '_drillsExecuted',
          keyTo: 'id'
        },
        drills: {
          name: 'drills',
          type: 'DrillInstance[]',
          model: 'DrillInstance',
          relationType: 'embedsMany',
                  keyFrom: '_drills',
          keyTo: 'id'
        },
        testInstance: {
          name: 'testInstance',
          type: 'TestInstance',
          model: 'TestInstance',
          relationType: 'hasOne',
                  keyFrom: 'id',
          keyTo: 'eventId'
        },
        attachments: {
          name: 'attachments',
          type: 'Attachment[]',
          model: 'Attachment',
          relationType: 'embedsMany',
                  keyFrom: '_attachments',
          keyTo: 'id'
        },
        video: {
          name: 'video',
          type: 'Attachment[]',
          model: 'Attachment',
          relationType: 'embedsOne',
                  keyFrom: '_video',
          keyTo: 'id'
        },
        teamSeason: {
          name: 'teamSeason',
          type: 'TeamSeason',
          model: 'TeamSeason',
          relationType: 'belongsTo',
                  keyFrom: 'teamSeasonId',
          keyTo: 'id'
        },
        playerMatchStats: {
          name: 'playerMatchStats',
          type: 'PlayerMatchStat[]',
          model: 'PlayerMatchStat',
          relationType: 'embedsMany',
                  keyFrom: '_playerMatchStats',
          keyTo: 'id'
        },
        opponentPlayerMatchStats: {
          name: 'opponentPlayerMatchStats',
          type: 'PlayerMatchStat[]',
          model: 'PlayerMatchStat',
          relationType: 'embedsMany',
                  keyFrom: '_opponentPlayerMatchStats',
          keyTo: 'id'
        },
        staff: {
          name: 'staff',
          type: 'Staff[]',
          model: 'Staff',
          relationType: 'referencesMany',
                  keyFrom: 'staffIds',
          keyTo: 'id'
        },
        gameReports: {
          name: 'gameReports',
          type: 'PlayerGameReport[]',
          model: 'PlayerGameReport',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'eventId'
        },
        trainingReports: {
          name: 'trainingReports',
          type: 'PlayerTrainingReport[]',
          model: 'PlayerTrainingReport',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'eventId'
        },
        medicalTreatments: {
          name: 'medicalTreatments',
          type: 'MedicalTreatment[]',
          model: 'MedicalTreatment',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'eventId'
        },
      }
    }
  }
}
