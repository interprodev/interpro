/* tslint:disable */
import {
  Club,
  Team,
  ClubTransfer,
  EmploymentContract,
  TransferContract
} from '../index';

declare var Object: any;
export interface PlayerTransferInterface {
  "wyscoutId"?: number;
  "wyscoutTeamId"?: number;
  "wyscoutSecondaryTeamId"?: number;
  "instatId"?: number;
  "instatSecondaryTeamId"?: number;
  "firstName"?: string;
  "lastName"?: string;
  "profilePhotoName"?: string;
  "profilePhotoUrl"?: string;
  "downloadUrl"?: string;
  "gender"?: string;
  "nationality"?: string;
  "altNationality"?: string;
  "education"?: string;
  "school"?: string;
  "birthDate"?: Date;
  "birthPlace"?: string;
  "phone"?: string;
  "mobilePhone"?: string;
  "otherMobile"?: any;
  "email"?: string;
  "address"?: any;
  "domicile"?: any;
  "nationalityOrigin"?: string;
  "fiscalIssue"?: string;
  "bankAccount"?: any;
  "archived"?: boolean;
  "archivedDate"?: Date;
  "archivedMotivation"?: string;
  "name"?: string;
  "displayName"?: string;
  "shoeSize"?: string;
  "captain"?: boolean;
  "additionalInfo"?: string;
  "inTeamFrom"?: Date;
  "inTeamTo"?: Date;
  "facebook"?: string;
  "twitter"?: string;
  "instagram"?: string;
  "linkedin"?: string;
  "snapchat"?: string;
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
  "transfermarktValue"?: number;
  "clubValue"?: number;
  "agentValue"?: number;
  "wage"?: number;
  "contractStart"?: Date;
  "contractEnd"?: Date;
  "ageGroup"?: string;
  "biography"?: string;
  "federalId"?: string;
  "federalMembership"?: Array<any>;
  "sportPassport"?: Array<any>;
  "maritalStatus"?: string;
  "firstFederalMembership"?: Date;
  "transferNotesThreads"?: Array<any>;
  "documents"?: Array<any>;
  "notesThreads"?: Array<any>;
  "agent"?: string;
  "agentEmail"?: string;
  "agentPhone"?: string;
  "lastUpdate"?: Date;
  "lastAuthor"?: string;
  "feeFrom"?: number;
  "feeTo"?: number;
  "wageFrom"?: number;
  "wageTo"?: number;
  "currentTeam"?: string;
  "currentLeague"?: string;
  "id"?: any;
  "clubId"?: any;
  "teamId"?: any;
  "clubTransferId"?: any;
  club?: Club;
  team?: Team;
  clubTransfer?: ClubTransfer;
  employmentContracts?: EmploymentContract[];
  transferContracts?: TransferContract[];
}

export class PlayerTransfer implements PlayerTransferInterface {
  "wyscoutId": number;
  "wyscoutTeamId": number;
  "wyscoutSecondaryTeamId": number;
  "instatId": number;
  "instatSecondaryTeamId": number;
  "firstName": string;
  "lastName": string;
  "profilePhotoName": string;
  "profilePhotoUrl": string;
  "downloadUrl": string;
  "gender": string;
  "nationality": string;
  "altNationality": string;
  "education": string;
  "school": string;
  "birthDate": Date;
  "birthPlace": string;
  "phone": string;
  "mobilePhone": string;
  "otherMobile": any;
  "email": string;
  "address": any;
  "domicile": any;
  "nationalityOrigin": string;
  "fiscalIssue": string;
  "bankAccount": any;
  "archived": boolean;
  "archivedDate": Date;
  "archivedMotivation": string;
  "name": string;
  "displayName": string;
  "shoeSize": string;
  "captain": boolean;
  "additionalInfo": string;
  "inTeamFrom": Date;
  "inTeamTo": Date;
  "facebook": string;
  "twitter": string;
  "instagram": string;
  "linkedin": string;
  "snapchat": string;
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
  "transfermarktValue": number;
  "clubValue": number;
  "agentValue": number;
  "wage": number;
  "contractStart": Date;
  "contractEnd": Date;
  "ageGroup": string;
  "biography": string;
  "federalId": string;
  "federalMembership": Array<any>;
  "sportPassport": Array<any>;
  "maritalStatus": string;
  "firstFederalMembership": Date;
  "transferNotesThreads": Array<any>;
  "documents": Array<any>;
  "notesThreads": Array<any>;
  "agent": string;
  "agentEmail": string;
  "agentPhone": string;
  "lastUpdate": Date;
  "lastAuthor": string;
  "feeFrom": number;
  "feeTo": number;
  "wageFrom": number;
  "wageTo": number;
  "currentTeam": string;
  "currentLeague": string;
  "id": any;
  "clubId": any;
  "teamId": any;
  "clubTransferId": any;
  club: Club;
  team: Team;
  clubTransfer: ClubTransfer;
  employmentContracts: EmploymentContract[];
  transferContracts: TransferContract[];
  constructor(data?: PlayerTransferInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `PlayerTransfer`.
   */
  public static getModelName() {
    return "PlayerTransfer";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of PlayerTransfer for dynamic purposes.
  **/
  public static factory(data: PlayerTransferInterface): PlayerTransfer{
    return new PlayerTransfer(data);
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
      name: 'PlayerTransfer',
      plural: 'PlayerTransfers',
      path: 'PlayerTransfers',
      idName: 'id',
      properties: {
        "wyscoutId": {
          name: 'wyscoutId',
          type: 'number'
        },
        "wyscoutTeamId": {
          name: 'wyscoutTeamId',
          type: 'number'
        },
        "wyscoutSecondaryTeamId": {
          name: 'wyscoutSecondaryTeamId',
          type: 'number'
        },
        "instatId": {
          name: 'instatId',
          type: 'number'
        },
        "instatSecondaryTeamId": {
          name: 'instatSecondaryTeamId',
          type: 'number'
        },
        "firstName": {
          name: 'firstName',
          type: 'string'
        },
        "lastName": {
          name: 'lastName',
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
          type: 'Date'
        },
        "birthPlace": {
          name: 'birthPlace',
          type: 'string'
        },
        "phone": {
          name: 'phone',
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
        "nationalityOrigin": {
          name: 'nationalityOrigin',
          type: 'string'
        },
        "fiscalIssue": {
          name: 'fiscalIssue',
          type: 'string'
        },
        "bankAccount": {
          name: 'bankAccount',
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
        "archivedMotivation": {
          name: 'archivedMotivation',
          type: 'string'
        },
        "name": {
          name: 'name',
          type: 'string'
        },
        "displayName": {
          name: 'displayName',
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
        "additionalInfo": {
          name: 'additionalInfo',
          type: 'string'
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
        "transfermarktValue": {
          name: 'transfermarktValue',
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
        "ageGroup": {
          name: 'ageGroup',
          type: 'string'
        },
        "biography": {
          name: 'biography',
          type: 'string'
        },
        "federalId": {
          name: 'federalId',
          type: 'string'
        },
        "federalMembership": {
          name: 'federalMembership',
          type: 'Array&lt;any&gt;'
        },
        "sportPassport": {
          name: 'sportPassport',
          type: 'Array&lt;any&gt;'
        },
        "maritalStatus": {
          name: 'maritalStatus',
          type: 'string'
        },
        "firstFederalMembership": {
          name: 'firstFederalMembership',
          type: 'Date'
        },
        "transferNotesThreads": {
          name: 'transferNotesThreads',
          type: 'Array&lt;any&gt;'
        },
        "documents": {
          name: 'documents',
          type: 'Array&lt;any&gt;'
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
        "currentLeague": {
          name: 'currentLeague',
          type: 'string'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "clubId": {
          name: 'clubId',
          type: 'any'
        },
        "teamId": {
          name: 'teamId',
          type: 'any'
        },
        "clubTransferId": {
          name: 'clubTransferId',
          type: 'any'
        },
      },
      relations: {
        club: {
          name: 'club',
          type: 'Club',
          model: 'Club',
          relationType: 'belongsTo',
                  keyFrom: 'clubId',
          keyTo: 'id'
        },
        team: {
          name: 'team',
          type: 'Team',
          model: 'Team',
          relationType: 'belongsTo',
                  keyFrom: 'teamId',
          keyTo: 'id'
        },
        clubTransfer: {
          name: 'clubTransfer',
          type: 'ClubTransfer',
          model: 'ClubTransfer',
          relationType: 'belongsTo',
                  keyFrom: 'clubTransferId',
          keyTo: 'id'
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
