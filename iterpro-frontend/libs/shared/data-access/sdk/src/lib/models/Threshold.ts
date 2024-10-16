/* tslint:disable */

declare var Object: any;
export interface ThresholdInterface {
  "id"?: string;
  "name": string;
  "value"?: number;
  "hidden"?: boolean;
  "semaphoreType"?: string;
  "intervals"?: any;
  "last30Value"?: number;
  "seasonValue"?: number;
  "bestValue"?: number;
  "customValue"?: number;
  "format"?: string;
}

export class Threshold implements ThresholdInterface {
  "id": string;
  "name": string;
  "value": number;
  "hidden": boolean;
  "semaphoreType": string;
  "intervals": any;
  "last30Value": number;
  "seasonValue": number;
  "bestValue": number;
  "customValue": number;
  "format": string;
  constructor(data?: ThresholdInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Threshold`.
   */
  public static getModelName() {
    return "Threshold";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Threshold for dynamic purposes.
  **/
  public static factory(data: ThresholdInterface): Threshold{
    return new Threshold(data);
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
      name: 'Threshold',
      plural: 'Thresholds',
      path: 'Thresholds',
      idName: 'id',
      properties: {
        "id": {
          name: 'id',
          type: 'string'
        },
        "name": {
          name: 'name',
          type: 'string'
        },
        "value": {
          name: 'value',
          type: 'number'
        },
        "hidden": {
          name: 'hidden',
          type: 'boolean',
          default: false
        },
        "semaphoreType": {
          name: 'semaphoreType',
          type: 'string'
        },
        "intervals": {
          name: 'intervals',
          type: 'any'
        },
        "last30Value": {
          name: 'last30Value',
          type: 'number'
        },
        "seasonValue": {
          name: 'seasonValue',
          type: 'number'
        },
        "bestValue": {
          name: 'bestValue',
          type: 'number'
        },
        "customValue": {
          name: 'customValue',
          type: 'number'
        },
        "format": {
          name: 'format',
          type: 'string'
        },
      },
      relations: {
      }
    }
  }
}
