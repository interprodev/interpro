/* tslint:disable */

declare var Object: any;
export interface PlanningViewInterface {
  "id"?: number;
}

export class PlanningView implements PlanningViewInterface {
  "id": number;
  constructor(data?: PlanningViewInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `PlanningView`.
   */
  public static getModelName() {
    return "PlanningView";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of PlanningView for dynamic purposes.
  **/
  public static factory(data: PlanningViewInterface): PlanningView{
    return new PlanningView(data);
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
      name: 'PlanningView',
      plural: 'PlanningView',
      path: 'PlanningView',
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
