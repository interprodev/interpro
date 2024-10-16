/* tslint:disable */
import {
  Player
} from '../index';

declare var Object: any;
export interface TestResultInterface {
  "id"?: string;
  "results"?: Array<any>;
  "playerId"?: any;
  player?: Player;
}

export class TestResult implements TestResultInterface {
  "id": string;
  "results": Array<any>;
  "playerId": any;
  player: Player;
  constructor(data?: TestResultInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `TestResult`.
   */
  public static getModelName() {
    return "TestResult";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of TestResult for dynamic purposes.
  **/
  public static factory(data: TestResultInterface): TestResult{
    return new TestResult(data);
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
      name: 'TestResult',
      plural: 'TestResults',
      path: 'TestResults',
      idName: 'id',
      properties: {
        "id": {
          name: 'id',
          type: 'string'
        },
        "results": {
          name: 'results',
          type: 'Array&lt;any&gt;'
        },
        "playerId": {
          name: 'playerId',
          type: 'any'
        },
      },
      relations: {
        player: {
          name: 'player',
          type: 'Player',
          model: 'Player',
          relationType: 'belongsTo',
                  keyFrom: 'playerId',
          keyTo: 'id'
        },
      }
    }
  }
}
