/* tslint:disable */

declare var Object: any;
export interface InstatInterface {
  "id"?: number;
}

export class Instat implements InstatInterface {
  "id": number;
  constructor(data?: InstatInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Instat`.
   */
  public static getModelName() {
    return "Instat";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Instat for dynamic purposes.
  **/
  public static factory(data: InstatInterface): Instat{
    return new Instat(data);
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
      name: 'Instat',
      plural: 'Instat',
      path: 'Instat',
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
