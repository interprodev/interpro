/* tslint:disable */
import {
  Team,
  Club,
  PlayerMatchStat,
  Attachment,
  ScoutingGameReport
} from '../index';

declare var Object: any;
export interface ScoutingGameInterface {
  "title"?: string;
  "assignedTo"?: any;
  "thirdPartyProvider"?: string;
  "thirdPartyProviderCompetitionId"?: number;
  "thirdPartyProviderMatchId"?: number;
  "thirdPartyProviderHomeTeamId"?: number;
  "thirdPartyProviderAwayTeamId"?: number;
  "timezone"?: string;
  "start": Date;
  "startTime"?: string;
  "endTime"?: string;
  "homeTeam"?: string;
  "awayTeam"?: string;
  "location"?: string;
  "result"?: string;
  "author"?: string;
  "completed"?: boolean;
  "history"?: any;
  "sent"?: boolean;
  "gameReportsTemplateId"?: string;
  "gameReportsTemplateVersion"?: number;
  "notes"?: string;
  "id"?: any;
  "teamId"?: any;
  "clubId"?: any;
  "playerMatchStats"?: Array<any>;
  "_attachments"?: Array<any>;
  team?: Team;
  club?: Club;
  _playerMatchStats?: PlayerMatchStat[];
  attachments?: Attachment[];
  gameReports?: ScoutingGameReport[];
}

export class ScoutingGame implements ScoutingGameInterface {
  "title": string;
  "assignedTo": any;
  "thirdPartyProvider": string;
  "thirdPartyProviderCompetitionId": number;
  "thirdPartyProviderMatchId": number;
  "thirdPartyProviderHomeTeamId": number;
  "thirdPartyProviderAwayTeamId": number;
  "timezone": string;
  "start": Date;
  "startTime": string;
  "endTime": string;
  "homeTeam": string;
  "awayTeam": string;
  "location": string;
  "result": string;
  "author": string;
  "completed": boolean;
  "history": any;
  "sent": boolean;
  "gameReportsTemplateId": string;
  "gameReportsTemplateVersion": number;
  "notes": string;
  "id": any;
  "teamId": any;
  "clubId": any;
  "playerMatchStats": Array<any>;
  "_attachments": Array<any>;
  team: Team;
  club: Club;
  _playerMatchStats: PlayerMatchStat[];
  attachments: Attachment[];
  gameReports: ScoutingGameReport[];
  constructor(data?: ScoutingGameInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `ScoutingGame`.
   */
  public static getModelName() {
    return "ScoutingGame";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of ScoutingGame for dynamic purposes.
  **/
  public static factory(data: ScoutingGameInterface): ScoutingGame{
    return new ScoutingGame(data);
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
      name: 'ScoutingGame',
      plural: 'ScoutingGames',
      path: 'ScoutingGames',
      idName: 'id',
      properties: {
        "title": {
          name: 'title',
          type: 'string'
        },
        "assignedTo": {
          name: 'assignedTo',
          type: 'any'
        },
        "thirdPartyProvider": {
          name: 'thirdPartyProvider',
          type: 'string',
          default: 'Wyscout'
        },
        "thirdPartyProviderCompetitionId": {
          name: 'thirdPartyProviderCompetitionId',
          type: 'number'
        },
        "thirdPartyProviderMatchId": {
          name: 'thirdPartyProviderMatchId',
          type: 'number'
        },
        "thirdPartyProviderHomeTeamId": {
          name: 'thirdPartyProviderHomeTeamId',
          type: 'number'
        },
        "thirdPartyProviderAwayTeamId": {
          name: 'thirdPartyProviderAwayTeamId',
          type: 'number'
        },
        "timezone": {
          name: 'timezone',
          type: 'string'
        },
        "start": {
          name: 'start',
          type: 'Date'
        },
        "startTime": {
          name: 'startTime',
          type: 'string'
        },
        "endTime": {
          name: 'endTime',
          type: 'string'
        },
        "homeTeam": {
          name: 'homeTeam',
          type: 'string'
        },
        "awayTeam": {
          name: 'awayTeam',
          type: 'string'
        },
        "location": {
          name: 'location',
          type: 'string'
        },
        "result": {
          name: 'result',
          type: 'string'
        },
        "author": {
          name: 'author',
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
        "sent": {
          name: 'sent',
          type: 'boolean',
          default: false
        },
        "gameReportsTemplateId": {
          name: 'gameReportsTemplateId',
          type: 'string'
        },
        "gameReportsTemplateVersion": {
          name: 'gameReportsTemplateVersion',
          type: 'number'
        },
        "notes": {
          name: 'notes',
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
        "clubId": {
          name: 'clubId',
          type: 'any'
        },
        "playerMatchStats": {
          name: 'playerMatchStats',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_attachments": {
          name: '_attachments',
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
        club: {
          name: 'club',
          type: 'Club',
          model: 'Club',
          relationType: 'belongsTo',
                  keyFrom: 'clubId',
          keyTo: 'id'
        },
        _playerMatchStats: {
          name: '_playerMatchStats',
          type: 'PlayerMatchStat[]',
          model: 'PlayerMatchStat',
          relationType: 'embedsMany',
                  keyFrom: 'playerMatchStats',
          keyTo: 'id'
        },
        attachments: {
          name: 'attachments',
          type: 'Attachment[]',
          model: 'Attachment',
          relationType: 'embedsMany',
                  keyFrom: '_attachments',
          keyTo: 'id'
        },
        gameReports: {
          name: 'gameReports',
          type: 'ScoutingGameReport[]',
          model: 'ScoutingGameReport',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'scoutingGameId'
        },
      }
    }
  }
}
