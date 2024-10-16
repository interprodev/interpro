/* tslint:disable */
import {
  Event,
  Test,
  Team,
  Attachment,
  TestResult
} from '../index';

declare var Object: any;
export interface TestInstanceInterface {
  "name"?: string;
  "date": Date;
  "lastUpdateDate"?: Date;
  "lastUpdateAuthor"?: string;
  "id"?: any;
  "eventId"?: any;
  "testId"?: any;
  "teamId"?: any;
  "_attachments"?: Array<any>;
  "_testResults"?: Array<any>;
  event?: Event;
  test?: Test;
  team?: Team;
  attachments?: Attachment[];
  testResults?: TestResult[];
}

export class TestInstance implements TestInstanceInterface {
  "name": string;
  "date": Date;
  "lastUpdateDate": Date;
  "lastUpdateAuthor": string;
  "id": any;
  "eventId": any;
  "testId": any;
  "teamId": any;
  "_attachments": Array<any>;
  "_testResults": Array<any>;
  event: Event;
  test: Test;
  team: Team;
  attachments: Attachment[];
  testResults: TestResult[];
  constructor(data?: TestInstanceInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `TestInstance`.
   */
  public static getModelName() {
    return "TestInstance";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of TestInstance for dynamic purposes.
  **/
  public static factory(data: TestInstanceInterface): TestInstance{
    return new TestInstance(data);
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
      name: 'TestInstance',
      plural: 'TestInstances',
      path: 'TestInstances',
      idName: 'id',
      properties: {
        "name": {
          name: 'name',
          type: 'string'
        },
        "date": {
          name: 'date',
          type: 'Date'
        },
        "lastUpdateDate": {
          name: 'lastUpdateDate',
          type: 'Date'
        },
        "lastUpdateAuthor": {
          name: 'lastUpdateAuthor',
          type: 'string'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "eventId": {
          name: 'eventId',
          type: 'any'
        },
        "testId": {
          name: 'testId',
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
        "_testResults": {
          name: '_testResults',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
      },
      relations: {
        event: {
          name: 'event',
          type: 'Event',
          model: 'Event',
          relationType: 'belongsTo',
                  keyFrom: 'eventId',
          keyTo: 'id'
        },
        test: {
          name: 'test',
          type: 'Test',
          model: 'Test',
          relationType: 'belongsTo',
                  keyFrom: 'testId',
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
        attachments: {
          name: 'attachments',
          type: 'Attachment[]',
          model: 'Attachment',
          relationType: 'embedsMany',
                  keyFrom: '_attachments',
          keyTo: 'id'
        },
        testResults: {
          name: 'testResults',
          type: 'TestResult[]',
          model: 'TestResult',
          relationType: 'embedsMany',
                  keyFrom: '_testResults',
          keyTo: 'id'
        },
      }
    }
  }
}
