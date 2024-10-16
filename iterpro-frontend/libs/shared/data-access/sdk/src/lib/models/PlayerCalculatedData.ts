/* tslint:disable */

declare var Object: any;
export interface PlayerCalculatedDataInterface {
  "playerId"?: string;
  "robustnessData"?: any;
  "bonuses"?: any;
  "id"?: any;
}

export class PlayerCalculatedData implements PlayerCalculatedDataInterface {
  "playerId": string;
  "robustnessData": any;
  "bonuses": any;
  "id": any;
  constructor(data?: PlayerCalculatedDataInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `PlayerCalculatedData`.
   */
  public static getModelName() {
    return "PlayerCalculatedData";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of PlayerCalculatedData for dynamic purposes.
  **/
  public static factory(data: PlayerCalculatedDataInterface): PlayerCalculatedData{
    return new PlayerCalculatedData(data);
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
      name: 'PlayerCalculatedData',
      plural: 'PlayerCalculatedData',
      path: 'PlayerCalculatedData',
      idName: 'id',
      properties: {
        "playerId": {
          name: 'playerId',
          type: 'string'
        },
        "robustnessData": {
          name: 'robustnessData',
          type: 'any'
        },
        "bonuses": {
          name: 'bonuses',
          type: 'any'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
      },
      relations: {
      }
    }
  }
}
