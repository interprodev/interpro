/* tslint:disable */

declare var Object: any;
export interface CoachingInterface {
  "id"?: number;
}

export class Coaching implements CoachingInterface {
  "id": number;
  constructor(data?: CoachingInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Coaching`.
   */
  public static getModelName() {
    return "Coaching";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Coaching for dynamic purposes.
  **/
  public static factory(data: CoachingInterface): Coaching{
    return new Coaching(data);
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
      name: 'Coaching',
      plural: 'Coaching',
      path: 'Coaching',
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
