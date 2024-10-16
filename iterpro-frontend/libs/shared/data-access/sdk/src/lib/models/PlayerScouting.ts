/* tslint:disable */
import {
  Player,
  ClubTransfer,
  VideoAsset,
  PlayerDescriptionEntry,
  PlayerAttributesEntry,
  ScoutingGameReport,
  EmploymentContract,
  TransferContract
} from '../index';

declare var Object: any;
export interface PlayerScoutingInterface {
  "wyscoutId"?: number;
  "instatId"?: number;
  "gpexeId"?: number;
  "catapultId"?: any;
  "fieldwizId"?: any;
  "statsportId"?: any;
  "wimuId"?: any;
  "name"?: string;
  "lastName"?: string;
  "displayName"?: string;
  "profilePhotoName"?: string;
  "profilePhotoUrl"?: string;
  "downloadUrl"?: string;
  "gender"?: string;
  "nationality"?: string;
  "altNationality"?: string;
  "shoeSize"?: string;
  "captain"?: boolean;
  "inTeamFrom"?: Date;
  "inTeamTo"?: Date;
  "facebook"?: string;
  "twitter"?: string;
  "instagram"?: string;
  "linkedin"?: string;
  "snapchat"?: string;
  "mobilePhone"?: string;
  "otherMobile"?: any;
  "education"?: string;
  "school"?: string;
  "birthDate"?: Date;
  "birthPlace"?: string;
  "weight"?: number;
  "height"?: number;
  "position"?: string;
  "role1"?: Array<any>;
  "position2"?: string;
  "role2"?: Array<any>;
  "position3"?: string;
  "role3"?: Array<any>;
  "foot"?: string;
  "jersey"?: number;
  "valueField"?: string;
  "value"?: number;
  "clubValue"?: number;
  "agentValue"?: number;
  "wage"?: number;
  "contractStart"?: Date;
  "contractEnd"?: Date;
  "phone"?: string;
  "email"?: string;
  "address"?: any;
  "domicile"?: any;
  "botId"?: string;
  "botMessageUrl"?: string;
  "anamnesys"?: any;
  "archived"?: boolean;
  "archivedDate"?: Date;
  "currentStatus"?: string;
  "statusDetails"?: any;
  "movOnBall"?: Array<any>;
  "movOffBall"?: Array<any>;
  "passing"?: Array<any>;
  "finishing"?: Array<any>;
  "defending"?: Array<any>;
  "technique"?: Array<any>;
  "documents"?: Array<any>;
  "nationalityOrigin"?: string;
  "fiscalIssue"?: string;
  "ageGroup"?: string;
  "biography"?: string;
  "federalMembership"?: Array<any>;
  "maritalStatus"?: string;
  "contractDetails"?: any;
  "_statusHistory"?: Array<any>;
  "recommended"?: number;
  "notesThreads"?: Array<any>;
  "agent"?: string;
  "agentEmail"?: string;
  "agentPhone"?: string;
  "associatedPosition"?: number;
  "associatedRole"?: string;
  "lastUpdate"?: Date;
  "lastAuthor"?: string;
  "feeFrom"?: number;
  "feeTo"?: number;
  "wageFrom"?: number;
  "wageTo"?: number;
  "currentTeam"?: string;
  "passport"?: string;
  "altPassport"?: string;
  "currentLeague"?: string;
  "observerTeams"?: any;
  "observed"?: boolean;
  "id"?: any;
  "associatedPlayerId"?: any;
  "teamId"?: any;
  "clubId"?: any;
  associatedPlayer?: Player;
  transfer?: ClubTransfer;
  videos?: VideoAsset[];
  descriptions?: PlayerDescriptionEntry[];
  attributes?: PlayerAttributesEntry[];
  gameReports?: ScoutingGameReport[];
  employmentContracts?: EmploymentContract[];
  transferContracts?: TransferContract[];
}

export class PlayerScouting implements PlayerScoutingInterface {
  "wyscoutId": number;
  "instatId": number;
  "gpexeId": number;
  "catapultId": any;
  "fieldwizId": any;
  "statsportId": any;
  "wimuId": any;
  "name": string;
  "lastName": string;
  "displayName": string;
  "profilePhotoName": string;
  "profilePhotoUrl": string;
  "downloadUrl": string;
  "gender": string;
  "nationality": string;
  "altNationality": string;
  "shoeSize": string;
  "captain": boolean;
  "inTeamFrom": Date;
  "inTeamTo": Date;
  "facebook": string;
  "twitter": string;
  "instagram": string;
  "linkedin": string;
  "snapchat": string;
  "mobilePhone": string;
  "otherMobile": any;
  "education": string;
  "school": string;
  "birthDate": Date;
  "birthPlace": string;
  "weight": number;
  "height": number;
  "position": string;
  "role1": Array<any>;
  "position2": string;
  "role2": Array<any>;
  "position3": string;
  "role3": Array<any>;
  "foot": string;
  "jersey": number;
  "valueField": string;
  "value": number;
  "clubValue": number;
  "agentValue": number;
  "wage": number;
  "contractStart": Date;
  "contractEnd": Date;
  "phone": string;
  "email": string;
  "address": any;
  "domicile": any;
  "botId": string;
  "botMessageUrl": string;
  "anamnesys": any;
  "archived": boolean;
  "archivedDate": Date;
  "currentStatus": string;
  "statusDetails": any;
  "movOnBall": Array<any>;
  "movOffBall": Array<any>;
  "passing": Array<any>;
  "finishing": Array<any>;
  "defending": Array<any>;
  "technique": Array<any>;
  "documents": Array<any>;
  "nationalityOrigin": string;
  "fiscalIssue": string;
  "ageGroup": string;
  "biography": string;
  "federalMembership": Array<any>;
  "maritalStatus": string;
  "contractDetails": any;
  "_statusHistory": Array<any>;
  "recommended": number;
  "notesThreads": Array<any>;
  "agent": string;
  "agentEmail": string;
  "agentPhone": string;
  "associatedPosition": number;
  "associatedRole": string;
  "lastUpdate": Date;
  "lastAuthor": string;
  "feeFrom": number;
  "feeTo": number;
  "wageFrom": number;
  "wageTo": number;
  "currentTeam": string;
  "passport": string;
  "altPassport": string;
  "currentLeague": string;
  "observerTeams": any;
  "observed": boolean;
  "id": any;
  "associatedPlayerId": any;
  "teamId": any;
  "clubId": any;
  associatedPlayer: Player;
  transfer: ClubTransfer;
  videos: VideoAsset[];
  descriptions: PlayerDescriptionEntry[];
  attributes: PlayerAttributesEntry[];
  gameReports: ScoutingGameReport[];
  employmentContracts: EmploymentContract[];
  transferContracts: TransferContract[];
  constructor(data?: PlayerScoutingInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `PlayerScouting`.
   */
  public static getModelName() {
    return "PlayerScouting";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of PlayerScouting for dynamic purposes.
  **/
  public static factory(data: PlayerScoutingInterface): PlayerScouting{
    return new PlayerScouting(data);
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
      name: 'PlayerScouting',
      plural: 'PlayerScoutings',
      path: 'PlayerScoutings',
      idName: 'id',
      properties: {
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
        "wimuId": {
          name: 'wimuId',
          type: 'any'
        },
        "name": {
          name: 'name',
          type: 'string'
        },
        "lastName": {
          name: 'lastName',
          type: 'string'
        },
        "displayName": {
          name: 'displayName',
          type: 'string'
        },
        "profilePhotoName": {
          name: 'profilePhotoName',
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
        "gender": {
          name: 'gender',
          type: 'string'
        },
        "nationality": {
          name: 'nationality',
          type: 'string'
        },
        "altNationality": {
          name: 'altNationality',
          type: 'string'
        },
        "shoeSize": {
          name: 'shoeSize',
          type: 'string'
        },
        "captain": {
          name: 'captain',
          type: 'boolean'
        },
        "inTeamFrom": {
          name: 'inTeamFrom',
          type: 'Date'
        },
        "inTeamTo": {
          name: 'inTeamTo',
          type: 'Date'
        },
        "facebook": {
          name: 'facebook',
          type: 'string'
        },
        "twitter": {
          name: 'twitter',
          type: 'string'
        },
        "instagram": {
          name: 'instagram',
          type: 'string'
        },
        "linkedin": {
          name: 'linkedin',
          type: 'string'
        },
        "snapchat": {
          name: 'snapchat',
          type: 'string'
        },
        "mobilePhone": {
          name: 'mobilePhone',
          type: 'string'
        },
        "otherMobile": {
          name: 'otherMobile',
          type: 'any'
        },
        "education": {
          name: 'education',
          type: 'string'
        },
        "school": {
          name: 'school',
          type: 'string'
        },
        "birthDate": {
          name: 'birthDate',
          type: 'Date',
          default: new Date('1990-01-01T00:00:00.000Z')
        },
        "birthPlace": {
          name: 'birthPlace',
          type: 'string'
        },
        "weight": {
          name: 'weight',
          type: 'number'
        },
        "height": {
          name: 'height',
          type: 'number'
        },
        "position": {
          name: 'position',
          type: 'string'
        },
        "role1": {
          name: 'role1',
          type: 'Array&lt;any&gt;'
        },
        "position2": {
          name: 'position2',
          type: 'string'
        },
        "role2": {
          name: 'role2',
          type: 'Array&lt;any&gt;'
        },
        "position3": {
          name: 'position3',
          type: 'string'
        },
        "role3": {
          name: 'role3',
          type: 'Array&lt;any&gt;'
        },
        "foot": {
          name: 'foot',
          type: 'string'
        },
        "jersey": {
          name: 'jersey',
          type: 'number'
        },
        "valueField": {
          name: 'valueField',
          type: 'string'
        },
        "value": {
          name: 'value',
          type: 'number'
        },
        "clubValue": {
          name: 'clubValue',
          type: 'number'
        },
        "agentValue": {
          name: 'agentValue',
          type: 'number'
        },
        "wage": {
          name: 'wage',
          type: 'number'
        },
        "contractStart": {
          name: 'contractStart',
          type: 'Date'
        },
        "contractEnd": {
          name: 'contractEnd',
          type: 'Date'
        },
        "phone": {
          name: 'phone',
          type: 'string'
        },
        "email": {
          name: 'email',
          type: 'string'
        },
        "address": {
          name: 'address',
          type: 'any'
        },
        "domicile": {
          name: 'domicile',
          type: 'any'
        },
        "botId": {
          name: 'botId',
          type: 'string'
        },
        "botMessageUrl": {
          name: 'botMessageUrl',
          type: 'string'
        },
        "anamnesys": {
          name: 'anamnesys',
          type: 'any'
        },
        "archived": {
          name: 'archived',
          type: 'boolean',
          default: false
        },
        "archivedDate": {
          name: 'archivedDate',
          type: 'Date'
        },
        "currentStatus": {
          name: 'currentStatus',
          type: 'string'
        },
        "statusDetails": {
          name: 'statusDetails',
          type: 'any'
        },
        "movOnBall": {
          name: 'movOnBall',
          type: 'Array&lt;any&gt;'
        },
        "movOffBall": {
          name: 'movOffBall',
          type: 'Array&lt;any&gt;'
        },
        "passing": {
          name: 'passing',
          type: 'Array&lt;any&gt;'
        },
        "finishing": {
          name: 'finishing',
          type: 'Array&lt;any&gt;'
        },
        "defending": {
          name: 'defending',
          type: 'Array&lt;any&gt;'
        },
        "technique": {
          name: 'technique',
          type: 'Array&lt;any&gt;'
        },
        "documents": {
          name: 'documents',
          type: 'Array&lt;any&gt;'
        },
        "nationalityOrigin": {
          name: 'nationalityOrigin',
          type: 'string'
        },
        "fiscalIssue": {
          name: 'fiscalIssue',
          type: 'string'
        },
        "ageGroup": {
          name: 'ageGroup',
          type: 'string'
        },
        "biography": {
          name: 'biography',
          type: 'string'
        },
        "federalMembership": {
          name: 'federalMembership',
          type: 'Array&lt;any&gt;'
        },
        "maritalStatus": {
          name: 'maritalStatus',
          type: 'string'
        },
        "contractDetails": {
          name: 'contractDetails',
          type: 'any'
        },
        "_statusHistory": {
          name: '_statusHistory',
          type: 'Array&lt;any&gt;'
        },
        "recommended": {
          name: 'recommended',
          type: 'number'
        },
        "notesThreads": {
          name: 'notesThreads',
          type: 'Array&lt;any&gt;'
        },
        "agent": {
          name: 'agent',
          type: 'string'
        },
        "agentEmail": {
          name: 'agentEmail',
          type: 'string'
        },
        "agentPhone": {
          name: 'agentPhone',
          type: 'string'
        },
        "associatedPosition": {
          name: 'associatedPosition',
          type: 'number'
        },
        "associatedRole": {
          name: 'associatedRole',
          type: 'string'
        },
        "lastUpdate": {
          name: 'lastUpdate',
          type: 'Date'
        },
        "lastAuthor": {
          name: 'lastAuthor',
          type: 'string'
        },
        "feeFrom": {
          name: 'feeFrom',
          type: 'number'
        },
        "feeTo": {
          name: 'feeTo',
          type: 'number'
        },
        "wageFrom": {
          name: 'wageFrom',
          type: 'number'
        },
        "wageTo": {
          name: 'wageTo',
          type: 'number'
        },
        "currentTeam": {
          name: 'currentTeam',
          type: 'string'
        },
        "passport": {
          name: 'passport',
          type: 'string'
        },
        "altPassport": {
          name: 'altPassport',
          type: 'string'
        },
        "currentLeague": {
          name: 'currentLeague',
          type: 'string'
        },
        "observerTeams": {
          name: 'observerTeams',
          type: 'any',
          default: <any>null
        },
        "observed": {
          name: 'observed',
          type: 'boolean',
          default: true
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "associatedPlayerId": {
          name: 'associatedPlayerId',
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
      },
      relations: {
        associatedPlayer: {
          name: 'associatedPlayer',
          type: 'Player',
          model: 'Player',
          relationType: 'belongsTo',
                  keyFrom: 'associatedPlayerId',
          keyTo: 'id'
        },
        transfer: {
          name: 'transfer',
          type: 'ClubTransfer',
          model: 'ClubTransfer',
          relationType: 'hasOne',
                  keyFrom: 'id',
          keyTo: 'personId'
        },
        videos: {
          name: 'videos',
          type: 'VideoAsset[]',
          model: 'VideoAsset',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'playerScoutingId'
        },
        descriptions: {
          name: 'descriptions',
          type: 'PlayerDescriptionEntry[]',
          model: 'PlayerDescriptionEntry',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'personId'
        },
        attributes: {
          name: 'attributes',
          type: 'PlayerAttributesEntry[]',
          model: 'PlayerAttributesEntry',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'personId'
        },
        gameReports: {
          name: 'gameReports',
          type: 'ScoutingGameReport[]',
          model: 'ScoutingGameReport',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'playerScoutingId'
        },
        employmentContracts: {
          name: 'employmentContracts',
          type: 'EmploymentContract[]',
          model: 'EmploymentContract',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'personId'
        },
        transferContracts: {
          name: 'transferContracts',
          type: 'TransferContract[]',
          model: 'TransferContract',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'personId'
        },
      }
    }
  }
}
