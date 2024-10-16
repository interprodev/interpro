/* tslint:disable */
import {
  ScoutingLineup
} from '../index';

declare var Object: any;
export interface ScoutingLineupRoleDataInterface {
  "id"?: string;
  "role"?: string;
  "orderingIndex"?: number;
  "mappings"?: any;
  "scoutingScenarioId"?: any;
  scoutingScenario?: ScoutingLineup;
}

export class ScoutingLineupRoleData implements ScoutingLineupRoleDataInterface {
  "id": string;
  "role": string;
  "orderingIndex": number;
  "mappings": any;
  "scoutingScenarioId": any;
  scoutingScenario: ScoutingLineup;
  constructor(data?: ScoutingLineupRoleDataInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `ScoutingLineupRoleData`.
   */
  public static getModelName() {
    return "ScoutingLineupRoleData";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of ScoutingLineupRoleData for dynamic purposes.
  **/
  public static factory(data: ScoutingLineupRoleDataInterface): ScoutingLineupRoleData{
    return new ScoutingLineupRoleData(data);
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
      name: 'ScoutingLineupRoleData',
      plural: 'ScoutingLineupRoleData',
      path: 'ScoutingLineupRoleData',
      idName: 'id',
      properties: {
        "id": {
          name: 'id',
          type: 'string'
        },
        "role": {
          name: 'role',
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
