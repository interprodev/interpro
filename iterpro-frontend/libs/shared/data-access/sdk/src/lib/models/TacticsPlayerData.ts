/* tslint:disable */
import {
  TacticsData
} from '../index';

declare var Object: any;
export interface TacticsPlayerDataInterface {
  "id"?: string;
  "organization"?: string;
  "transition"?: string;
  "playerId"?: string;
  "orderingIndex"?: number;
  "organizationVideoUrl"?: string;
  "organizationAlternateVideoUrl"?: string;
  "organizationVideoTags"?: any;
  "transitionVideoUrl"?: string;
  "transitionAlternateVideoUrl"?: string;
  "transitionVideoTags"?: any;
  "transitionComments"?: Array<any>;
  "organizationComments"?: Array<any>;
  "tacticsDataId"?: string;
  tacticsData?: TacticsData;
}

export class TacticsPlayerData implements TacticsPlayerDataInterface {
  "id": string;
  "organization": string;
  "transition": string;
  "playerId": string;
  "orderingIndex": number;
  "organizationVideoUrl": string;
  "organizationAlternateVideoUrl": string;
  "organizationVideoTags": any;
  "transitionVideoUrl": string;
  "transitionAlternateVideoUrl": string;
  "transitionVideoTags": any;
  "transitionComments": Array<any>;
  "organizationComments": Array<any>;
  "tacticsDataId": string;
  tacticsData: TacticsData;
  constructor(data?: TacticsPlayerDataInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `TacticsPlayerData`.
   */
  public static getModelName() {
    return "TacticsPlayerData";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of TacticsPlayerData for dynamic purposes.
  **/
  public static factory(data: TacticsPlayerDataInterface): TacticsPlayerData{
    return new TacticsPlayerData(data);
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
      name: 'TacticsPlayerData',
      plural: 'TacticsPlayerData',
      path: 'TacticsPlayerData',
      idName: 'id',
      properties: {
        "id": {
          name: 'id',
          type: 'string'
        },
        "organization": {
          name: 'organization',
          type: 'string'
        },
        "transition": {
          name: 'transition',
          type: 'string'
        },
        "playerId": {
          name: 'playerId',
          type: 'string'
        },
        "orderingIndex": {
          name: 'orderingIndex',
          type: 'number'
        },
        "organizationVideoUrl": {
          name: 'organizationVideoUrl',
          type: 'string'
        },
        "organizationAlternateVideoUrl": {
          name: 'organizationAlternateVideoUrl',
          type: 'string'
        },
        "organizationVideoTags": {
          name: 'organizationVideoTags',
          type: 'any'
        },
        "transitionVideoUrl": {
          name: 'transitionVideoUrl',
          type: 'string'
        },
        "transitionAlternateVideoUrl": {
          name: 'transitionAlternateVideoUrl',
          type: 'string'
        },
        "transitionVideoTags": {
          name: 'transitionVideoTags',
          type: 'any'
        },
        "transitionComments": {
          name: 'transitionComments',
          type: 'Array&lt;any&gt;'
        },
        "organizationComments": {
          name: 'organizationComments',
          type: 'Array&lt;any&gt;'
        },
        "tacticsDataId": {
          name: 'tacticsDataId',
          type: 'string'
        },
      },
      relations: {
        tacticsData: {
          name: 'tacticsData',
          type: 'TacticsData',
          model: 'TacticsData',
          relationType: 'belongsTo',
                  keyFrom: 'tacticsDataId',
          keyTo: 'id'
        },
      }
    }
  }
}
