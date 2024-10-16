/* tslint:disable */
import {
  Club,
  Team,
  Player,
  PersonCostItem
} from '../index';

declare var Object: any;
export interface AgentInterface {
  "company"?: string;
  "legalRepresentant"?: string;
  "federalId"?: string;
  "biography"?: string;
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
  "maritalStatus"?: string;
  "bankAccount"?: any;
  "archived"?: boolean;
  "archivedDate"?: Date;
  "archivedMotivation"?: string;
  "id"?: any;
  "clubId"?: any;
  "teamId"?: any;
  "assistedIds"?: Array<any>;
  club?: Club;
  team?: Team;
  assisted?: Player[];
  costItems?: PersonCostItem[];
}

export class Agent implements AgentInterface {
  "company": string;
  "legalRepresentant": string;
  "federalId": string;
  "biography": string;
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
  "maritalStatus": string;
  "bankAccount": any;
  "archived": boolean;
  "archivedDate": Date;
  "archivedMotivation": string;
  "id": any;
  "clubId": any;
  "teamId": any;
  "assistedIds": Array<any>;
  club: Club;
  team: Team;
  assisted: Player[];
  costItems: PersonCostItem[];
  constructor(data?: AgentInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Agent`.
   */
  public static getModelName() {
    return "Agent";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Agent for dynamic purposes.
  **/
  public static factory(data: AgentInterface): Agent{
    return new Agent(data);
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
      name: 'Agent',
      plural: 'Agents',
      path: 'Agents',
      idName: 'id',
      properties: {
        "company": {
          name: 'company',
          type: 'string'
        },
        "legalRepresentant": {
          name: 'legalRepresentant',
          type: 'string'
        },
        "federalId": {
          name: 'federalId',
          type: 'string'
        },
        "biography": {
          name: 'biography',
          type: 'string'
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
        "maritalStatus": {
          name: 'maritalStatus',
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
        "assistedIds": {
          name: 'assistedIds',
          type: 'Array&lt;any&gt;',
          default: <any>[]
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
        assisted: {
          name: 'assisted',
          type: 'Player[]',
          model: 'Player',
          relationType: 'referencesMany',
                  keyFrom: 'assistedIds',
          keyTo: 'id'
        },
        costItems: {
          name: 'costItems',
          type: 'PersonCostItem[]',
          model: 'PersonCostItem',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'personId'
        },
      }
    }
  }
}
