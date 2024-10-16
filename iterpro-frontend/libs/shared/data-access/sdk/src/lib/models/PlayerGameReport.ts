/* tslint:disable */
import {
  Team,
  Customer,
  Event,
  Player
} from '../index';

declare var Object: any;
export interface PlayerGameReportInterface {
  "denormalizedEventFields"?: any;
  "notes"?: string;
  "reportDataHistory"?: any;
  "notesHistory"?: any;
  "reportDataShareWithPlayer"?: boolean;
  "notesShareWithPlayer"?: boolean;
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
  "eventId"?: any;
  "playerId"?: any;
  team?: Team;
  author?: Customer;
  event?: Event;
  player?: Player;
}

export class PlayerGameReport implements PlayerGameReportInterface {
  "denormalizedEventFields": any;
  "notes": string;
  "reportDataHistory": any;
  "notesHistory": any;
  "reportDataShareWithPlayer": boolean;
  "notesShareWithPlayer": boolean;
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
  "eventId": any;
  "playerId": any;
  team: Team;
  author: Customer;
  event: Event;
  player: Player;
  constructor(data?: PlayerGameReportInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `PlayerGameReport`.
   */
  public static getModelName() {
    return "PlayerGameReport";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of PlayerGameReport for dynamic purposes.
  **/
  public static factory(data: PlayerGameReportInterface): PlayerGameReport{
    return new PlayerGameReport(data);
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
      name: 'PlayerGameReport',
      plural: 'PlayerGameReports',
      path: 'PlayerGameReports',
      idName: 'id',
      properties: {
        "denormalizedEventFields": {
          name: 'denormalizedEventFields',
          type: 'any'
        },
        "notes": {
          name: 'notes',
          type: 'string'
        },
        "reportDataHistory": {
          name: 'reportDataHistory',
          type: 'any'
        },
        "notesHistory": {
          name: 'notesHistory',
          type: 'any'
        },
        "reportDataShareWithPlayer": {
          name: 'reportDataShareWithPlayer',
          type: 'boolean'
        },
        "notesShareWithPlayer": {
          name: 'notesShareWithPlayer',
          type: 'boolean'
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
        "eventId": {
          name: 'eventId',
          type: 'any'
        },
        "playerId": {
          name: 'playerId',
          type: 'any'
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
        event: {
          name: 'event',
          type: 'Event',
          model: 'Event',
          relationType: 'belongsTo',
                  keyFrom: 'eventId',
          keyTo: 'id'
        },
        player: {
          name: 'player',
          type: 'Player',
          model: 'Player',
          relationType: 'belongsTo',
                  keyFrom: 'playerId',
          keyTo: 'id'
        },
      }
    }
  }
}
