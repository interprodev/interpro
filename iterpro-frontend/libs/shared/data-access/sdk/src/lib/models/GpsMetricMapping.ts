/* tslint:disable */

declare var Object: any;
export interface GpsMetricMappingInterface {
  "id"?: string;
  "columnName"?: string;
  "expression"?: string;
  "columnLabel"?: string;
}

export class GpsMetricMapping implements GpsMetricMappingInterface {
  "id": string;
  "columnName": string;
  "expression": string;
  "columnLabel": string;
  constructor(data?: GpsMetricMappingInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `GpsMetricMapping`.
   */
  public static getModelName() {
    return "GpsMetricMapping";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of GpsMetricMapping for dynamic purposes.
  **/
  public static factory(data: GpsMetricMappingInterface): GpsMetricMapping{
    return new GpsMetricMapping(data);
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
      name: 'GpsMetricMapping',
      plural: 'GpsMetricMappings',
      path: 'GpsMetricMappings',
      idName: 'id',
      properties: {
        "id": {
          name: 'id',
          type: 'string'
        },
        "columnName": {
          name: 'columnName',
          type: 'string'
        },
        "expression": {
          name: 'expression',
          type: 'string'
        },
        "columnLabel": {
          name: 'columnLabel',
          type: 'string'
        },
      },
      relations: {
      }
    }
  }
}
