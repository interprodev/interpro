/* tslint:disable */

declare var Object: any;
export interface RobustnessInterface {
  "id"?: number;
}

export class Robustness implements RobustnessInterface {
  "id": number;
  constructor(data?: RobustnessInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Robustness`.
   */
  public static getModelName() {
    return "Robustness";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Robustness for dynamic purposes.
  **/
  public static factory(data: RobustnessInterface): Robustness{
    return new Robustness(data);
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
      name: 'Robustness',
      plural: 'Robustness',
      path: 'Robustness',
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
