/* tslint:disable */
import {
  AccessToken,
  Player,
  Club
} from '../index';

declare var Object: any;
export interface CustomerPlayerInterface {
  "isTempPassword"?: boolean;
  "notificationEvents"?: boolean;
  "notificationSurveys"?: boolean;
  "notificationVideoShared"?: boolean;
  "notificationVideoComments"?: boolean;
  "eventReminders"?: any;
  "globalEventReminders"?: any;
  "mobileLatestLogin"?: Date;
  "email"?: string;
  "currentLanguage"?: string;
  "currentDateFormat"?: number;
  "realm"?: string;
  "username"?: string;
  "emailVerified"?: boolean;
  "id"?: any;
  "playerId"?: any;
  "clubId"?: any;
  "password"?: string;
  accessTokens?: AccessToken[];
  player?: Player;
  club?: Club;
}

export class CustomerPlayer implements CustomerPlayerInterface {
  "isTempPassword": boolean;
  "notificationEvents": boolean;
  "notificationSurveys": boolean;
  "notificationVideoShared": boolean;
  "notificationVideoComments": boolean;
  "eventReminders": any;
  "globalEventReminders": any;
  "mobileLatestLogin": Date;
  "email": string;
  "currentLanguage": string;
  "currentDateFormat": number;
  "realm": string;
  "username": string;
  "emailVerified": boolean;
  "id": any;
  "playerId": any;
  "clubId": any;
  "password": string;
  accessTokens: AccessToken[];
  player: Player;
  club: Club;
  constructor(data?: CustomerPlayerInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `CustomerPlayer`.
   */
  public static getModelName() {
    return "CustomerPlayer";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of CustomerPlayer for dynamic purposes.
  **/
  public static factory(data: CustomerPlayerInterface): CustomerPlayer{
    return new CustomerPlayer(data);
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
      name: 'CustomerPlayer',
      plural: 'customerPlayers',
      path: 'customerPlayers',
      idName: 'id',
      properties: {
        "isTempPassword": {
          name: 'isTempPassword',
          type: 'boolean',
          default: false
        },
        "notificationEvents": {
          name: 'notificationEvents',
          type: 'boolean',
          default: false
        },
        "notificationSurveys": {
          name: 'notificationSurveys',
          type: 'boolean',
          default: false
        },
        "notificationVideoShared": {
          name: 'notificationVideoShared',
          type: 'boolean',
          default: false
        },
        "notificationVideoComments": {
          name: 'notificationVideoComments',
          type: 'boolean',
          default: false
        },
        "eventReminders": {
          name: 'eventReminders',
          type: 'any'
        },
        "globalEventReminders": {
          name: 'globalEventReminders',
          type: 'any'
        },
        "mobileLatestLogin": {
          name: 'mobileLatestLogin',
          type: 'Date'
        },
        "email": {
          name: 'email',
          type: 'string'
        },
        "currentLanguage": {
          name: 'currentLanguage',
          type: 'string',
          default: 'en-GB'
        },
        "currentDateFormat": {
          name: 'currentDateFormat',
          type: 'number',
          default: 1
        },
        "realm": {
          name: 'realm',
          type: 'string'
        },
        "username": {
          name: 'username',
          type: 'string'
        },
        "emailVerified": {
          name: 'emailVerified',
          type: 'boolean'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "playerId": {
          name: 'playerId',
          type: 'any'
        },
        "clubId": {
          name: 'clubId',
          type: 'any'
        },
        "password": {
          name: 'password',
          type: 'string'
        },
      },
      relations: {
        accessTokens: {
          name: 'accessTokens',
          type: 'AccessToken[]',
          model: 'AccessToken',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'userId'
        },
        player: {
          name: 'player',
          type: 'Player',
          model: 'Player',
          relationType: 'belongsTo',
                  keyFrom: 'playerId',
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
      }
    }
  }
}
