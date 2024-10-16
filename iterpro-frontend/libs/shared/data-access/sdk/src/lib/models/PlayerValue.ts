/* tslint:disable */

declare var Object: any;
export interface PlayerValueInterface {
  "id"?: string;
  "date": Date;
  "value": number;
}

export class PlayerValue implements PlayerValueInterface {
  "id": string;
  "date": Date;
  "value": number;
  constructor(data?: PlayerValueInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `PlayerValue`.
   */
  public static getModelName() {
    return "PlayerValue";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of PlayerValue for dynamic purposes.
  **/
  public static factory(data: PlayerValueInterface): PlayerValue{
    return new PlayerValue(data);
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
      name: 'PlayerValue',
      plural: 'PlayerValues',
      path: 'PlayerValues',
      idName: 'id',
      properties: {
        "id": {
          name: 'id',
          type: 'string'
        },
        "date": {
          name: 'date',
          type: 'Date'
        },
        "value": {
          name: 'value',
          type: 'number'
        },
      },
      relations: {
      }
    }
  }
}
