/* tslint:disable */

declare var Object: any;
export interface ReadinessInterface {
  "id"?: number;
}

export class Readiness implements ReadinessInterface {
  "id": number;
  constructor(data?: ReadinessInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Readiness`.
   */
  public static getModelName() {
    return "Readiness";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Readiness for dynamic purposes.
  **/
  public static factory(data: ReadinessInterface): Readiness{
    return new Readiness(data);
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
      name: 'Readiness',
      plural: 'Readiness',
      path: 'Readiness',
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
