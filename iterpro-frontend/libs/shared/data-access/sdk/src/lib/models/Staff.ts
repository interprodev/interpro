/* tslint:disable */
import {
  Club,
  Team,
  PersonCostItem,
  EmploymentContract
} from '../index';

declare var Object: any;
export interface StaffInterface {
  "firstName"?: string;
  "lastName"?: string;
  "profilePhotoUrl"?: string;
  "downloadUrl"?: string;
  "profilePhotoName"?: string;
  "gender"?: string;
  "nationality"?: string;
  "altNationality"?: string;
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
  "wage"?: number;
  "contractStart"?: Date;
  "contractEnd"?: Date;
  "phone"?: string;
  "email"?: string;
  "address"?: any;
  "domicile"?: any;
  "currentStatus"?: string;
  "statusDetails"?: any;
  "documents"?: Array<any>;
  "federalId"?: string;
  "federalMembership"?: Array<any>;
  "coachingBadges"?: Array<any>;
  "fiscalIssue"?: string;
  "biography"?: string;
  "_statusHistory"?: Array<any>;
  "activeTeams"?: any;
  "position"?: string;
  "bankAccount"?: any;
  "archived"?: boolean;
  "archivedDate"?: Date;
  "archivedMotivation"?: string;
  "id"?: any;
  "clubId"?: any;
  "teamId"?: any;
  "customerId"?: any;
  club?: Club;
  team?: Team;
  costItems?: PersonCostItem[];
  employmentContracts?: EmploymentContract[];
}

export class Staff implements StaffInterface {
  "firstName": string;
  "lastName": string;
  "profilePhotoUrl": string;
  "downloadUrl": string;
  "profilePhotoName": string;
  "gender": string;
  "nationality": string;
  "altNationality": string;
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
  "wage": number;
  "contractStart": Date;
  "contractEnd": Date;
  "phone": string;
  "email": string;
  "address": any;
  "domicile": any;
  "currentStatus": string;
  "statusDetails": any;
  "documents": Array<any>;
  "federalId": string;
  "federalMembership": Array<any>;
  "coachingBadges": Array<any>;
  "fiscalIssue": string;
  "biography": string;
  "_statusHistory": Array<any>;
  "activeTeams": any;
  "position": string;
  "bankAccount": any;
  "archived": boolean;
  "archivedDate": Date;
  "archivedMotivation": string;
  "id": any;
  "clubId": any;
  "teamId": any;
  "customerId": any;
  club: Club;
  team: Team;
  costItems: PersonCostItem[];
  employmentContracts: EmploymentContract[];
  constructor(data?: StaffInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Staff`.
   */
  public static getModelName() {
    return "Staff";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Staff for dynamic purposes.
  **/
  public static factory(data: StaffInterface): Staff{
    return new Staff(data);
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
      name: 'Staff',
      plural: 'Staffs',
      path: 'Staffs',
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
          type: 'Date'
        },
        "birthPlace": {
          name: 'birthPlace',
          type: 'string'
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
        "currentStatus": {
          name: 'currentStatus',
          type: 'string'
        },
        "statusDetails": {
          name: 'statusDetails',
          type: 'any'
        },
        "documents": {
          name: 'documents',
          type: 'Array&lt;any&gt;'
        },
        "federalId": {
          name: 'federalId',
          type: 'string'
        },
        "federalMembership": {
          name: 'federalMembership',
          type: 'Array&lt;any&gt;'
        },
        "coachingBadges": {
          name: 'coachingBadges',
          type: 'Array&lt;any&gt;'
        },
        "fiscalIssue": {
          name: 'fiscalIssue',
          type: 'string'
        },
        "biography": {
          name: 'biography',
          type: 'string'
        },
        "_statusHistory": {
          name: '_statusHistory',
          type: 'Array&lt;any&gt;'
        },
        "activeTeams": {
          name: 'activeTeams',
          type: 'any'
        },
        "position": {
          name: 'position',
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
        "customerId": {
          name: 'customerId',
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
        costItems: {
          name: 'costItems',
          type: 'PersonCostItem[]',
          model: 'PersonCostItem',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'personId'
        },
        employmentContracts: {
          name: 'employmentContracts',
          type: 'EmploymentContract[]',
          model: 'EmploymentContract',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'personId'
        },
      }
    }
  }
}
