/* tslint:disable */

declare var Object: any;
export interface TeamProviderMappingInterface {
  "rawMetrics"?: Array<any>;
  "id"?: string;
  "goalsScoredField"?: string;
  "goalsConcedField"?: string;
}

export class TeamProviderMapping implements TeamProviderMappingInterface {
  "rawMetrics": Array<any>;
  "id": string;
  "goalsScoredField": string;
  "goalsConcedField": string;
  constructor(data?: TeamProviderMappingInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `TeamProviderMapping`.
   */
  public static getModelName() {
    return "TeamProviderMapping";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of TeamProviderMapping for dynamic purposes.
  **/
  public static factory(data: TeamProviderMappingInterface): TeamProviderMapping{
    return new TeamProviderMapping(data);
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
      name: 'TeamProviderMapping',
      plural: 'TeamProviderMappings',
      path: 'TeamProviderMappings',
      idName: 'id',
      properties: {
        "rawMetrics": {
          name: 'rawMetrics',
          type: 'Array&lt;any&gt;'
        },
        "id": {
          name: 'id',
          type: 'string'
        },
        "goalsScoredField": {
          name: 'goalsScoredField',
          type: 'string'
        },
        "goalsConcedField": {
          name: 'goalsConcedField',
          type: 'string'
        },
      },
      relations: {
      }
    }
  }
}
