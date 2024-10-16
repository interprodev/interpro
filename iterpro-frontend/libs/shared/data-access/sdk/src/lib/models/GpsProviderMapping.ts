/* tslint:disable */
import {
  GpsMetricMapping
} from '../index';

declare var Object: any;
export interface GpsProviderMappingInterface {
  "rawMetrics"?: Array<any>;
  "id"?: string;
  "splitNameColumn"?: string;
  "dateColumn"?: string;
  "dateColumnFormat"?: number;
  "startTimeColumn"?: string;
  "startTimeColumnFormat"?: number;
  "endTimeColumn"?: string;
  "endTimeColumnFormat"?: number;
  "playerNameColumn"?: string;
  "durationColumn"?: string;
  "durationColumnFormat"?: number;
  "_gpsMetricsMapping"?: Array<any>;
  metricsMappings?: GpsMetricMapping[];
}

export class GpsProviderMapping implements GpsProviderMappingInterface {
  "rawMetrics": Array<any>;
  "id": string;
  "splitNameColumn": string;
  "dateColumn": string;
  "dateColumnFormat": number;
  "startTimeColumn": string;
  "startTimeColumnFormat": number;
  "endTimeColumn": string;
  "endTimeColumnFormat": number;
  "playerNameColumn": string;
  "durationColumn": string;
  "durationColumnFormat": number;
  "_gpsMetricsMapping": Array<any>;
  metricsMappings: GpsMetricMapping[];
  constructor(data?: GpsProviderMappingInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `GpsProviderMapping`.
   */
  public static getModelName() {
    return "GpsProviderMapping";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of GpsProviderMapping for dynamic purposes.
  **/
  public static factory(data: GpsProviderMappingInterface): GpsProviderMapping{
    return new GpsProviderMapping(data);
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
      name: 'GpsProviderMapping',
      plural: 'GpsProviderMappings',
      path: 'GpsProviderMappings',
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
        "splitNameColumn": {
          name: 'splitNameColumn',
          type: 'string'
        },
        "dateColumn": {
          name: 'dateColumn',
          type: 'string'
        },
        "dateColumnFormat": {
          name: 'dateColumnFormat',
          type: 'number'
        },
        "startTimeColumn": {
          name: 'startTimeColumn',
          type: 'string'
        },
        "startTimeColumnFormat": {
          name: 'startTimeColumnFormat',
          type: 'number'
        },
        "endTimeColumn": {
          name: 'endTimeColumn',
          type: 'string'
        },
        "endTimeColumnFormat": {
          name: 'endTimeColumnFormat',
          type: 'number'
        },
        "playerNameColumn": {
          name: 'playerNameColumn',
          type: 'string'
        },
        "durationColumn": {
          name: 'durationColumn',
          type: 'string'
        },
        "durationColumnFormat": {
          name: 'durationColumnFormat',
          type: 'number'
        },
        "_gpsMetricsMapping": {
          name: '_gpsMetricsMapping',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
      },
      relations: {
        metricsMappings: {
          name: 'metricsMappings',
          type: 'GpsMetricMapping[]',
          model: 'GpsMetricMapping',
          relationType: 'embedsMany',
                  keyFrom: '_gpsMetricsMapping',
          keyTo: 'id'
        },
      }
    }
  }
}
