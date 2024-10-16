/* tslint:disable */

declare var Object: any;
export interface DirectorV2Interface {
  "id"?: number;
}

export class DirectorV2 implements DirectorV2Interface {
  "id": number;
  constructor(data?: DirectorV2Interface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `DirectorV2`.
   */
  public static getModelName() {
    return "DirectorV2";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of DirectorV2 for dynamic purposes.
  **/
  public static factory(data: DirectorV2Interface): DirectorV2{
    return new DirectorV2(data);
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
      name: 'DirectorV2',
      plural: 'DirectorV2',
      path: 'DirectorV2',
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
