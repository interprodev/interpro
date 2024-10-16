/* tslint:disable */
import {
  Team,
  TestInstance,
  Attachment
} from '../index';

declare var Object: any;
export interface TestInterface {
  "name": string;
  "medical": boolean;
  "purpose"?: any;
  "category"?: string;
  "equipment"?: string;
  "protocol"?: string;
  "customFields"?: Array<any>;
  "userFields"?: Array<any>;
  "playerNameField"?: string;
  "customFormulas"?: Array<any>;
  "id"?: any;
  "teamId"?: any;
  "_attachments"?: Array<any>;
  team?: Team;
  instances?: TestInstance[];
  attachments?: Attachment[];
}

export class Test implements TestInterface {
  "name": string;
  "medical": boolean;
  "purpose": any;
  "category": string;
  "equipment": string;
  "protocol": string;
  "customFields": Array<any>;
  "userFields": Array<any>;
  "playerNameField": string;
  "customFormulas": Array<any>;
  "id": any;
  "teamId": any;
  "_attachments": Array<any>;
  team: Team;
  instances: TestInstance[];
  attachments: Attachment[];
  constructor(data?: TestInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Test`.
   */
  public static getModelName() {
    return "Test";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Test for dynamic purposes.
  **/
  public static factory(data: TestInterface): Test{
    return new Test(data);
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
      name: 'Test',
      plural: 'tests',
      path: 'tests',
      idName: 'id',
      properties: {
        "name": {
          name: 'name',
          type: 'string'
        },
        "medical": {
          name: 'medical',
          type: 'boolean',
          default: false
        },
        "purpose": {
          name: 'purpose',
          type: 'any'
        },
        "category": {
          name: 'category',
          type: 'string'
        },
        "equipment": {
          name: 'equipment',
          type: 'string'
        },
        "protocol": {
          name: 'protocol',
          type: 'string'
        },
        "customFields": {
          name: 'customFields',
          type: 'Array&lt;any&gt;'
        },
        "userFields": {
          name: 'userFields',
          type: 'Array&lt;any&gt;'
        },
        "playerNameField": {
          name: 'playerNameField',
          type: 'string'
        },
        "customFormulas": {
          name: 'customFormulas',
          type: 'Array&lt;any&gt;'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "teamId": {
          name: 'teamId',
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
        instances: {
          name: 'instances',
          type: 'TestInstance[]',
          model: 'TestInstance',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'testId'
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
