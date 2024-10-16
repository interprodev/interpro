/* tslint:disable */

declare var Object: any;
export interface ThirdpartyInterface {
  "id"?: number;
}

export class Thirdparty implements ThirdpartyInterface {
  "id": number;
  constructor(data?: ThirdpartyInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Thirdparty`.
   */
  public static getModelName() {
    return "Thirdparty";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Thirdparty for dynamic purposes.
  **/
  public static factory(data: ThirdpartyInterface): Thirdparty{
    return new Thirdparty(data);
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
      name: 'Thirdparty',
      plural: 'Thirdparties',
      path: 'Thirdparties',
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
