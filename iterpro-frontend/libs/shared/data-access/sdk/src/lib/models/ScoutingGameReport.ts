/* tslint:disable */
import {
  Team,
  Customer,
  ScoutingGame,
  PlayerScouting,
  Attachment
} from '../index';

declare var Object: any;
export interface ScoutingGameReportInterface {
  "denormalizedScoutingGameFields"?: any;
  "report"?: string;
  "level"?: string;
  "thirdPartyProviderTeamId"?: number;
  "thirdPartyProviderId"?: number;
  "teamName"?: string;
  "completed"?: boolean;
  "history"?: any;
  "templateId"?: string;
  "templateVersion"?: number;
  "displayName"?: string;
  "position"?: string;
  "downloadUrl"?: string;
  "nationality"?: string;
  "birthDate"?: Date;
  "reportData"?: any;
  "id"?: any;
  "teamId"?: any;
  "authorId"?: any;
  "scoutingGameId"?: any;
  "playerScoutingId"?: any;
  "scoutId"?: any;
  "_videos"?: Array<any>;
  "_documents"?: Array<any>;
  team?: Team;
  author?: Customer;
  scoutingGame?: ScoutingGame;
  playerScouting?: PlayerScouting;
  scout?: Customer;
  videos?: Attachment[];
  documents?: Attachment[];
}

export class ScoutingGameReport implements ScoutingGameReportInterface {
  "denormalizedScoutingGameFields": any;
  "report": string;
  "level": string;
  "thirdPartyProviderTeamId": number;
  "thirdPartyProviderId": number;
  "teamName": string;
  "completed": boolean;
  "history": any;
  "templateId": string;
  "templateVersion": number;
  "displayName": string;
  "position": string;
  "downloadUrl": string;
  "nationality": string;
  "birthDate": Date;
  "reportData": any;
  "id": any;
  "teamId": any;
  "authorId": any;
  "scoutingGameId": any;
  "playerScoutingId": any;
  "scoutId": any;
  "_videos": Array<any>;
  "_documents": Array<any>;
  team: Team;
  author: Customer;
  scoutingGame: ScoutingGame;
  playerScouting: PlayerScouting;
  scout: Customer;
  videos: Attachment[];
  documents: Attachment[];
  constructor(data?: ScoutingGameReportInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `ScoutingGameReport`.
   */
  public static getModelName() {
    return "ScoutingGameReport";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of ScoutingGameReport for dynamic purposes.
  **/
  public static factory(data: ScoutingGameReportInterface): ScoutingGameReport{
    return new ScoutingGameReport(data);
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
      name: 'ScoutingGameReport',
      plural: 'ScoutingGameReports',
      path: 'ScoutingGameReports',
      idName: 'id',
      properties: {
        "denormalizedScoutingGameFields": {
          name: 'denormalizedScoutingGameFields',
          type: 'any'
        },
        "report": {
          name: 'report',
          type: 'string'
        },
        "level": {
          name: 'level',
          type: 'string'
        },
        "thirdPartyProviderTeamId": {
          name: 'thirdPartyProviderTeamId',
          type: 'number'
        },
        "thirdPartyProviderId": {
          name: 'thirdPartyProviderId',
          type: 'number'
        },
        "teamName": {
          name: 'teamName',
          type: 'string'
        },
        "completed": {
          name: 'completed',
          type: 'boolean'
        },
        "history": {
          name: 'history',
          type: 'any'
        },
        "templateId": {
          name: 'templateId',
          type: 'string'
        },
        "templateVersion": {
          name: 'templateVersion',
          type: 'number'
        },
        "displayName": {
          name: 'displayName',
          type: 'string'
        },
        "position": {
          name: 'position',
          type: 'string'
        },
        "downloadUrl": {
          name: 'downloadUrl',
          type: 'string'
        },
        "nationality": {
          name: 'nationality',
          type: 'string'
        },
        "birthDate": {
          name: 'birthDate',
          type: 'Date'
        },
        "reportData": {
          name: 'reportData',
          type: 'any'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "teamId": {
          name: 'teamId',
          type: 'any'
        },
        "authorId": {
          name: 'authorId',
          type: 'any'
        },
        "scoutingGameId": {
          name: 'scoutingGameId',
          type: 'any'
        },
        "playerScoutingId": {
          name: 'playerScoutingId',
          type: 'any'
        },
        "scoutId": {
          name: 'scoutId',
          type: 'any'
        },
        "_videos": {
          name: '_videos',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_documents": {
          name: '_documents',
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
        author: {
          name: 'author',
          type: 'Customer',
          model: 'Customer',
          relationType: 'belongsTo',
                  keyFrom: 'authorId',
          keyTo: 'id'
        },
        scoutingGame: {
          name: 'scoutingGame',
          type: 'ScoutingGame',
          model: 'ScoutingGame',
          relationType: 'belongsTo',
                  keyFrom: 'scoutingGameId',
          keyTo: 'id'
        },
        playerScouting: {
          name: 'playerScouting',
          type: 'PlayerScouting',
          model: 'PlayerScouting',
          relationType: 'belongsTo',
                  keyFrom: 'playerScoutingId',
          keyTo: 'id'
        },
        scout: {
          name: 'scout',
          type: 'Customer',
          model: 'Customer',
          relationType: 'belongsTo',
                  keyFrom: 'scoutId',
          keyTo: 'id'
        },
        videos: {
          name: 'videos',
          type: 'Attachment[]',
          model: 'Attachment',
          relationType: 'embedsMany',
                  keyFrom: '_videos',
          keyTo: 'id'
        },
        documents: {
          name: 'documents',
          type: 'Attachment[]',
          model: 'Attachment',
          relationType: 'embedsMany',
                  keyFrom: '_documents',
          keyTo: 'id'
        },
      }
    }
  }
}
