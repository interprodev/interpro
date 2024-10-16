/* tslint:disable */
import {
  Team,
  Customer
} from '../index';

declare var Object: any;
export interface NotificationInterface {
  "message"?: string;
  "type"?: string;
  "subtype"?: string;
  "date"?: Date;
  "sessionId"?: string;
  "playerId"?: string;
  "staffId"?: string;
  "anamnesysId"?: string;
  "read"?: boolean;
  "metrics"?: any;
  "eventId"?: string;
  "img"?: string;
  "eventDate"?: Date;
  "messageEn"?: string;
  "playerArchived"?: boolean;
  "videoId"?: string;
  "matchId"?: string;
  "scoutingGameReportId"?: string;
  "scoutingGameId"?: string;
  "id"?: any;
  "teamId"?: any;
  "customerId"?: any;
  team?: Team;
  customer?: Customer;
}

export class Notification implements NotificationInterface {
  "message": string;
  "type": string;
  "subtype": string;
  "date": Date;
  "sessionId": string;
  "playerId": string;
  "staffId": string;
  "anamnesysId": string;
  "read": boolean;
  "metrics": any;
  "eventId": string;
  "img": string;
  "eventDate": Date;
  "messageEn": string;
  "playerArchived": boolean;
  "videoId": string;
  "matchId": string;
  "scoutingGameReportId": string;
  "scoutingGameId": string;
  "id": any;
  "teamId": any;
  "customerId": any;
  team: Team;
  customer: Customer;
  constructor(data?: NotificationInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Notification`.
   */
  public static getModelName() {
    return "Notification";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Notification for dynamic purposes.
  **/
  public static factory(data: NotificationInterface): Notification{
    return new Notification(data);
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
      name: 'Notification',
      plural: 'Notifications',
      path: 'Notifications',
      idName: 'id',
      properties: {
        "message": {
          name: 'message',
          type: 'string'
        },
        "type": {
          name: 'type',
          type: 'string'
        },
        "subtype": {
          name: 'subtype',
          type: 'string'
        },
        "date": {
          name: 'date',
          type: 'Date'
        },
        "sessionId": {
          name: 'sessionId',
          type: 'string'
        },
        "playerId": {
          name: 'playerId',
          type: 'string'
        },
        "staffId": {
          name: 'staffId',
          type: 'string'
        },
        "anamnesysId": {
          name: 'anamnesysId',
          type: 'string'
        },
        "read": {
          name: 'read',
          type: 'boolean',
          default: false
        },
        "metrics": {
          name: 'metrics',
          type: 'any'
        },
        "eventId": {
          name: 'eventId',
          type: 'string'
        },
        "img": {
          name: 'img',
          type: 'string'
        },
        "eventDate": {
          name: 'eventDate',
          type: 'Date'
        },
        "messageEn": {
          name: 'messageEn',
          type: 'string'
        },
        "playerArchived": {
          name: 'playerArchived',
          type: 'boolean'
        },
        "videoId": {
          name: 'videoId',
          type: 'string'
        },
        "matchId": {
          name: 'matchId',
          type: 'string'
        },
        "scoutingGameReportId": {
          name: 'scoutingGameReportId',
          type: 'string'
        },
        "scoutingGameId": {
          name: 'scoutingGameId',
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
        "customerId": {
          name: 'customerId',
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
        customer: {
          name: 'customer',
          type: 'Customer',
          model: 'Customer',
          relationType: 'belongsTo',
                  keyFrom: 'customerId',
          keyTo: 'id'
        },
      }
    }
  }
}
