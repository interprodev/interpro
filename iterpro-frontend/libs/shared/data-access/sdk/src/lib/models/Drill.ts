/* tslint:disable */
import {
  Team,
  Customer,
  Attachment
} from '../index';

declare var Object: any;
export interface DrillInterface {
  "name": string;
  "theme"?: string;
  "goals"?: any;
  "situationalTacticalGoals"?: any;
  "situationalTacticalGoalsDef"?: any;
  "situationalTacticalGoalsOff"?: any;
  "tacticalGoals"?: any;
  "technicalGoals"?: any;
  "physicalGoals"?: any;
  "analyticalTacticalGoals"?: any;
  "ageGroup"?: string;
  "pitchSizeX"?: number;
  "pitchSizeY"?: number;
  "players"?: number;
  "duration"?: number;
  "rules"?: string;
  "description"?: string;
  "identifier"?: string;
  "coachingPoint"?: any;
  "pinnedAttachmentId"?: string;
  "creationDate"?: Date;
  "lastUpdateDate"?: Date;
  "id"?: any;
  "teamId"?: any;
  "authorId"?: any;
  "sharedWithIds"?: Array<any>;
  "lastUpdateAuthorId"?: any;
  "_attachments"?: Array<any>;
  team?: Team;
  author?: Customer;
  sharedWith?: Customer[];
  lastUpdateAuthor?: Customer;
  attachments?: Attachment[];
}

export class Drill implements DrillInterface {
  "name": string;
  "theme": string;
  "goals": any;
  "situationalTacticalGoals": any;
  "situationalTacticalGoalsDef": any;
  "situationalTacticalGoalsOff": any;
  "tacticalGoals": any;
  "technicalGoals": any;
  "physicalGoals": any;
  "analyticalTacticalGoals": any;
  "ageGroup": string;
  "pitchSizeX": number;
  "pitchSizeY": number;
  "players": number;
  "duration": number;
  "rules": string;
  "description": string;
  "identifier": string;
  "coachingPoint": any;
  "pinnedAttachmentId": string;
  "creationDate": Date;
  "lastUpdateDate": Date;
  "id": any;
  "teamId": any;
  "authorId": any;
  "sharedWithIds": Array<any>;
  "lastUpdateAuthorId": any;
  "_attachments": Array<any>;
  team: Team;
  author: Customer;
  sharedWith: Customer[];
  lastUpdateAuthor: Customer;
  attachments: Attachment[];
  constructor(data?: DrillInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Drill`.
   */
  public static getModelName() {
    return "Drill";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Drill for dynamic purposes.
  **/
  public static factory(data: DrillInterface): Drill{
    return new Drill(data);
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
      name: 'Drill',
      plural: 'drills',
      path: 'drills',
      idName: 'id',
      properties: {
        "name": {
          name: 'name',
          type: 'string'
        },
        "theme": {
          name: 'theme',
          type: 'string'
        },
        "goals": {
          name: 'goals',
          type: 'any'
        },
        "situationalTacticalGoals": {
          name: 'situationalTacticalGoals',
          type: 'any'
        },
        "situationalTacticalGoalsDef": {
          name: 'situationalTacticalGoalsDef',
          type: 'any'
        },
        "situationalTacticalGoalsOff": {
          name: 'situationalTacticalGoalsOff',
          type: 'any'
        },
        "tacticalGoals": {
          name: 'tacticalGoals',
          type: 'any'
        },
        "technicalGoals": {
          name: 'technicalGoals',
          type: 'any'
        },
        "physicalGoals": {
          name: 'physicalGoals',
          type: 'any'
        },
        "analyticalTacticalGoals": {
          name: 'analyticalTacticalGoals',
          type: 'any'
        },
        "ageGroup": {
          name: 'ageGroup',
          type: 'string'
        },
        "pitchSizeX": {
          name: 'pitchSizeX',
          type: 'number'
        },
        "pitchSizeY": {
          name: 'pitchSizeY',
          type: 'number'
        },
        "players": {
          name: 'players',
          type: 'number'
        },
        "duration": {
          name: 'duration',
          type: 'number'
        },
        "rules": {
          name: 'rules',
          type: 'string'
        },
        "description": {
          name: 'description',
          type: 'string'
        },
        "identifier": {
          name: 'identifier',
          type: 'string'
        },
        "coachingPoint": {
          name: 'coachingPoint',
          type: 'any'
        },
        "pinnedAttachmentId": {
          name: 'pinnedAttachmentId',
          type: 'string'
        },
        "creationDate": {
          name: 'creationDate',
          type: 'Date'
        },
        "lastUpdateDate": {
          name: 'lastUpdateDate',
          type: 'Date'
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
        "sharedWithIds": {
          name: 'sharedWithIds',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "lastUpdateAuthorId": {
          name: 'lastUpdateAuthorId',
          type: 'any'
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
        author: {
          name: 'author',
          type: 'Customer',
          model: 'Customer',
          relationType: 'belongsTo',
                  keyFrom: 'authorId',
          keyTo: 'id'
        },
        sharedWith: {
          name: 'sharedWith',
          type: 'Customer[]',
          model: 'Customer',
          relationType: 'referencesMany',
                  keyFrom: 'sharedWithIds',
          keyTo: 'id'
        },
        lastUpdateAuthor: {
          name: 'lastUpdateAuthor',
          type: 'Customer',
          model: 'Customer',
          relationType: 'belongsTo',
                  keyFrom: 'lastUpdateAuthorId',
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
      }
    }
  }
}
