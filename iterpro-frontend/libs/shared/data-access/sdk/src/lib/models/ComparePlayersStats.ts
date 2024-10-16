/* tslint:disable */

declare var Object: any;
export interface ComparePlayersStatsInterface {
  "id"?: number;
}

export class ComparePlayersStats implements ComparePlayersStatsInterface {
  "id": number;
  constructor(data?: ComparePlayersStatsInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `ComparePlayersStats`.
   */
  public static getModelName() {
    return "ComparePlayersStats";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of ComparePlayersStats for dynamic purposes.
  **/
  public static factory(data: ComparePlayersStatsInterface): ComparePlayersStats{
    return new ComparePlayersStats(data);
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
      name: 'ComparePlayersStats',
      plural: 'ComparePlayersStats',
      path: 'ComparePlayersStats',
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
