/* tslint:disable */
import {
  CustomerPlayer
} from '../index';

declare var Object: any;
export interface PlayerNotificationInterface {
  "message"?: string;
  "type"?: string;
  "date"?: Date;
  "playerId"?: string;
  "read"?: boolean;
  "eventId"?: string;
  "img"?: string;
  "messageEn"?: string;
  "id"?: any;
  "customerId"?: any;
  customer?: CustomerPlayer;
}

export class PlayerNotification implements PlayerNotificationInterface {
  "message": string;
  "type": string;
  "date": Date;
  "playerId": string;
  "read": boolean;
  "eventId": string;
  "img": string;
  "messageEn": string;
  "id": any;
  "customerId": any;
  customer: CustomerPlayer;
  constructor(data?: PlayerNotificationInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `PlayerNotification`.
   */
  public static getModelName() {
    return "PlayerNotification";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of PlayerNotification for dynamic purposes.
  **/
  public static factory(data: PlayerNotificationInterface): PlayerNotification{
    return new PlayerNotification(data);
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
      name: 'PlayerNotification',
      plural: 'PlayerNotifications',
      path: 'PlayerNotifications',
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
        "date": {
          name: 'date',
          type: 'Date'
        },
        "playerId": {
          name: 'playerId',
          type: 'string'
        },
        "read": {
          name: 'read',
          type: 'boolean',
          default: false
        },
        "eventId": {
          name: 'eventId',
          type: 'string'
        },
        "img": {
          name: 'img',
          type: 'string'
        },
        "messageEn": {
          name: 'messageEn',
          type: 'string'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "customerId": {
          name: 'customerId',
          type: 'any'
        },
      },
      relations: {
        customer: {
          name: 'customer',
          type: 'CustomerPlayer',
          model: 'CustomerPlayer',
          relationType: 'belongsTo',
                  keyFrom: 'customerId',
          keyTo: 'id'
        },
      }
    }
  }
}
