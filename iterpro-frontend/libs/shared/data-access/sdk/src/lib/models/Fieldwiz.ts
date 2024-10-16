/* tslint:disable */

declare var Object: any;
export interface FieldwizInterface {
  "id"?: number;
}

export class Fieldwiz implements FieldwizInterface {
  "id": number;
  constructor(data?: FieldwizInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Fieldwiz`.
   */
  public static getModelName() {
    return "Fieldwiz";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Fieldwiz for dynamic purposes.
  **/
  public static factory(data: FieldwizInterface): Fieldwiz{
    return new Fieldwiz(data);
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
      name: 'Fieldwiz',
      plural: 'Fieldwiz',
      path: 'Fieldwiz',
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
