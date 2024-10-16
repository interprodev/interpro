/* tslint:disable */

declare var Object: any;
export interface SessionsStatsInterface {
  "id"?: number;
}

export class SessionsStats implements SessionsStatsInterface {
  "id": number;
  constructor(data?: SessionsStatsInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `SessionsStats`.
   */
  public static getModelName() {
    return "SessionsStats";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of SessionsStats for dynamic purposes.
  **/
  public static factory(data: SessionsStatsInterface): SessionsStats{
    return new SessionsStats(data);
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
      name: 'SessionsStats',
      plural: 'SessionsStats',
      path: 'SessionsStats',
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
