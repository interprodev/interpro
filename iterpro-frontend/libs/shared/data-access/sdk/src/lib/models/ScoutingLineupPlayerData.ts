/* tslint:disable */
import {
  ScoutingLineup
} from '../index';

declare var Object: any;
export interface ScoutingLineupPlayerDataInterface {
  "id"?: string;
  "playerId"?: string;
  "orderingIndex"?: number;
  "mappings"?: any;
  "scoutingScenarioId"?: any;
  scoutingScenario?: ScoutingLineup;
}

export class ScoutingLineupPlayerData implements ScoutingLineupPlayerDataInterface {
  "id": string;
  "playerId": string;
  "orderingIndex": number;
  "mappings": any;
  "scoutingScenarioId": any;
  scoutingScenario: ScoutingLineup;
  constructor(data?: ScoutingLineupPlayerDataInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `ScoutingLineupPlayerData`.
   */
  public static getModelName() {
    return "ScoutingLineupPlayerData";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of ScoutingLineupPlayerData for dynamic purposes.
  **/
  public static factory(data: ScoutingLineupPlayerDataInterface): ScoutingLineupPlayerData{
    return new ScoutingLineupPlayerData(data);
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
      name: 'ScoutingLineupPlayerData',
      plural: 'ScoutingLineupPlayerData',
      path: 'ScoutingLineupPlayerData',
      idName: 'id',
      properties: {
        "id": {
          name: 'id',
          type: 'string'
        },
        "playerId": {
          name: 'playerId',
          type: 'string'
        },
        "orderingIndex": {
          name: 'orderingIndex',
          type: 'number'
        },
        "mappings": {
          name: 'mappings',
          type: 'any'
        },
        "scoutingScenarioId": {
          name: 'scoutingScenarioId',
          type: 'any'
        },
      },
      relations: {
        scoutingScenario: {
          name: 'scoutingScenario',
          type: 'ScoutingLineup',
          model: 'ScoutingLineup',
          relationType: 'belongsTo',
                  keyFrom: 'scoutingScenarioId',
          keyTo: 'id'
        },
      }
    }
  }
}
