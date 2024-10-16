/* tslint:disable */

declare var Object: any;
export interface UtilsInterface {
  "id"?: number;
}

export class Utils implements UtilsInterface {
  "id": number;
  constructor(data?: UtilsInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Utils`.
   */
  public static getModelName() {
    return "Utils";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Utils for dynamic purposes.
  **/
  public static factory(data: UtilsInterface): Utils{
    return new Utils(data);
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
      name: 'Utils',
      plural: 'Utils',
      path: 'Utils',
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
