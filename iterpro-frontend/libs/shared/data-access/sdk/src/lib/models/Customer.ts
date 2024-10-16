/* tslint:disable */
import {
  AccessToken,
  EntityChangelog,
  CustomerTeamSettings,
  Notification,
  Club,
  Staff
} from '../index';

declare var Object: any;
export interface CustomerInterface {
  "firstName"?: string;
  "lastName"?: string;
  "isTempPassword"?: boolean;
  "telephone"?: string;
  "profilePhotoUrl"?: string;
  "downloadUrl"?: string;
  "profilePhotoName"?: string;
  "currentTeamId"?: string;
  "currentTeamSeasonId"?: string;
  "currentLanguage"?: string;
  "currentDateFormat"?: number;
  "_customPresets"?: any;
  "_customPresetsTeam"?: any;
  "_customPresetsPlayer"?: any;
  "playersTableHiddenFields"?: any;
  "admin"?: boolean;
  "notificationTransfers"?: boolean;
  "notificationScouting"?: boolean;
  "notificationScoutingPlayers"?: string;
  "notificationScoutingMessages"?: boolean;
  "notificationScoutingMessagesPlayers"?: string;
  "notificationScoutingGameReport"?: boolean;
  "notificationScoutingGameInvitation"?: boolean;
  "notificationScoutingGameReminder"?: any;
  "webLatestLogin"?: Date;
  "directorLatestLogin"?: Date;
  "coachingLatestLogin"?: Date;
  "realm"?: string;
  "username"?: string;
  "email": string;
  "emailVerified"?: boolean;
  "id"?: any;
  "clubId"?: any;
  "password"?: string;
  accessTokens?: AccessToken[];
  changelog?: EntityChangelog[];
  teamSettings?: CustomerTeamSettings[];
  notifications?: Notification[];
  club?: Club;
  staff?: Staff;
}

export class Customer implements CustomerInterface {
  "firstName": string;
  "lastName": string;
  "isTempPassword": boolean;
  "telephone": string;
  "profilePhotoUrl": string;
  "downloadUrl": string;
  "profilePhotoName": string;
  "currentTeamId": string;
  "currentTeamSeasonId": string;
  "currentLanguage": string;
  "currentDateFormat": number;
  "_customPresets": any;
  "_customPresetsTeam": any;
  "_customPresetsPlayer": any;
  "playersTableHiddenFields": any;
  "admin": boolean;
  "notificationTransfers": boolean;
  "notificationScouting": boolean;
  "notificationScoutingPlayers": string;
  "notificationScoutingMessages": boolean;
  "notificationScoutingMessagesPlayers": string;
  "notificationScoutingGameReport": boolean;
  "notificationScoutingGameInvitation": boolean;
  "notificationScoutingGameReminder": any;
  "webLatestLogin": Date;
  "directorLatestLogin": Date;
  "coachingLatestLogin": Date;
  "realm": string;
  "username": string;
  "email": string;
  "emailVerified": boolean;
  "id": any;
  "clubId": any;
  "password": string;
  accessTokens: AccessToken[];
  changelog: EntityChangelog[];
  teamSettings: CustomerTeamSettings[];
  notifications: Notification[];
  club: Club;
  staff: Staff;
  constructor(data?: CustomerInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Customer`.
   */
  public static getModelName() {
    return "Customer";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Customer for dynamic purposes.
  **/
  public static factory(data: CustomerInterface): Customer{
    return new Customer(data);
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
      name: 'Customer',
      plural: 'customers',
      path: 'customers',
      idName: 'id',
      properties: {
        "firstName": {
          name: 'firstName',
          type: 'string'
        },
        "lastName": {
          name: 'lastName',
          type: 'string'
        },
        "isTempPassword": {
          name: 'isTempPassword',
          type: 'boolean'
        },
        "telephone": {
          name: 'telephone',
          type: 'string'
        },
        "profilePhotoUrl": {
          name: 'profilePhotoUrl',
          type: 'string'
        },
        "downloadUrl": {
          name: 'downloadUrl',
          type: 'string'
        },
        "profilePhotoName": {
          name: 'profilePhotoName',
          type: 'string'
        },
        "currentTeamId": {
          name: 'currentTeamId',
          type: 'string'
        },
        "currentTeamSeasonId": {
          name: 'currentTeamSeasonId',
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
        "_customPresets": {
          name: '_customPresets',
          type: 'any'
        },
        "_customPresetsTeam": {
          name: '_customPresetsTeam',
          type: 'any'
        },
        "_customPresetsPlayer": {
          name: '_customPresetsPlayer',
          type: 'any'
        },
        "playersTableHiddenFields": {
          name: 'playersTableHiddenFields',
          type: 'any'
        },
        "admin": {
          name: 'admin',
          type: 'boolean'
        },
        "notificationTransfers": {
          name: 'notificationTransfers',
          type: 'boolean',
          default: false
        },
        "notificationScouting": {
          name: 'notificationScouting',
          type: 'boolean',
          default: false
        },
        "notificationScoutingPlayers": {
          name: 'notificationScoutingPlayers',
          type: 'string'
        },
        "notificationScoutingMessages": {
          name: 'notificationScoutingMessages',
          type: 'boolean',
          default: false
        },
        "notificationScoutingMessagesPlayers": {
          name: 'notificationScoutingMessagesPlayers',
          type: 'string'
        },
        "notificationScoutingGameReport": {
          name: 'notificationScoutingGameReport',
          type: 'boolean',
          default: false
        },
        "notificationScoutingGameInvitation": {
          name: 'notificationScoutingGameInvitation',
          type: 'boolean',
          default: false
        },
        "notificationScoutingGameReminder": {
          name: 'notificationScoutingGameReminder',
          type: 'any'
        },
        "webLatestLogin": {
          name: 'webLatestLogin',
          type: 'Date'
        },
        "directorLatestLogin": {
          name: 'directorLatestLogin',
          type: 'Date'
        },
        "coachingLatestLogin": {
          name: 'coachingLatestLogin',
          type: 'Date'
        },
        "realm": {
          name: 'realm',
          type: 'string'
        },
        "username": {
          name: 'username',
          type: 'string'
        },
        "email": {
          name: 'email',
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
        changelog: {
          name: 'changelog',
          type: 'EntityChangelog[]',
          model: 'EntityChangelog',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'entityId'
        },
        teamSettings: {
          name: 'teamSettings',
          type: 'CustomerTeamSettings[]',
          model: 'CustomerTeamSettings',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'customerId'
        },
        notifications: {
          name: 'notifications',
          type: 'Notification[]',
          model: 'Notification',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'customerId'
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
          type: 'Staff',
          model: 'Staff',
          relationType: 'hasOne',
                  keyFrom: 'id',
          keyTo: 'customerId'
        },
      }
    }
  }
}
