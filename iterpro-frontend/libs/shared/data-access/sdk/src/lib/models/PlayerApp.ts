/* tslint:disable */

declare var Object: any;
export interface PlayerAppInterface {
  "id"?: number;
}

export class PlayerApp implements PlayerAppInterface {
  "id": number;
  constructor(data?: PlayerAppInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `PlayerApp`.
   */
  public static getModelName() {
    return "PlayerApp";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of PlayerApp for dynamic purposes.
  **/
  public static factory(data: PlayerAppInterface): PlayerApp{
    return new PlayerApp(data);
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
      name: 'PlayerApp',
      plural: 'PlayerApp',
      path: 'PlayerApp',
      idName: 'id',
      properties: {
        "id": {
          name: 'id',
          type: 'number'
        },
      },
      relations: {
      }
    }
  }
}
