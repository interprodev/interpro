/* tslint:disable */

declare var Object: any;
export interface WyscoutInterface {
  "id"?: number;
}

export class Wyscout implements WyscoutInterface {
  "id": number;
  constructor(data?: WyscoutInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Wyscout`.
   */
  public static getModelName() {
    return "Wyscout";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Wyscout for dynamic purposes.
  **/
  public static factory(data: WyscoutInterface): Wyscout{
    return new Wyscout(data);
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
      name: 'Wyscout',
      plural: 'Wyscout',
      path: 'Wyscout',
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
