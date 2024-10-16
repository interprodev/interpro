/* tslint:disable */
import {
  Match,
  TacticsPlayerData
} from '../index';

declare var Object: any;
export interface TacticsDataInterface {
  "id"?: string;
  "transition"?: string;
  "organization"?: string;
  "setPieces"?: string;
  "tactic"?: string;
  "transitionVideoUrl"?: string;
  "transitionAlternateVideoUrl"?: string;
  "transitionVideoTags"?: any;
  "organizationVideoUrl"?: string;
  "organizationAlternateVideoUrl"?: string;
  "organizationVideoTags"?: any;
  "setPiecesVideoUrl"?: string;
  "setPiecesAlternateVideoUrl"?: string;
  "setPiecesVideoTags"?: any;
  "transitionComments"?: Array<any>;
  "organizationComments"?: Array<any>;
  "setPiecesComments"?: Array<any>;
  "matchId"?: any;
  "_players"?: Array<any>;
  match?: Match;
  players?: TacticsPlayerData[];
}

export class TacticsData implements TacticsDataInterface {
  "id": string;
  "transition": string;
  "organization": string;
  "setPieces": string;
  "tactic": string;
  "transitionVideoUrl": string;
  "transitionAlternateVideoUrl": string;
  "transitionVideoTags": any;
  "organizationVideoUrl": string;
  "organizationAlternateVideoUrl": string;
  "organizationVideoTags": any;
  "setPiecesVideoUrl": string;
  "setPiecesAlternateVideoUrl": string;
  "setPiecesVideoTags": any;
  "transitionComments": Array<any>;
  "organizationComments": Array<any>;
  "setPiecesComments": Array<any>;
  "matchId": any;
  "_players": Array<any>;
  match: Match;
  players: TacticsPlayerData[];
  constructor(data?: TacticsDataInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `TacticsData`.
   */
  public static getModelName() {
    return "TacticsData";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of TacticsData for dynamic purposes.
  **/
  public static factory(data: TacticsDataInterface): TacticsData{
    return new TacticsData(data);
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
      name: 'TacticsData',
      plural: 'TacticsData',
      path: 'TacticsData',
      idName: 'id',
      properties: {
        "id": {
          name: 'id',
          type: 'string'
        },
        "transition": {
          name: 'transition',
          type: 'string'
        },
        "organization": {
          name: 'organization',
          type: 'string'
        },
        "setPieces": {
          name: 'setPieces',
          type: 'string'
        },
        "tactic": {
          name: 'tactic',
          type: 'string'
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
        "setPiecesVideoUrl": {
          name: 'setPiecesVideoUrl',
          type: 'string'
        },
        "setPiecesAlternateVideoUrl": {
          name: 'setPiecesAlternateVideoUrl',
          type: 'string'
        },
        "setPiecesVideoTags": {
          name: 'setPiecesVideoTags',
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
        "setPiecesComments": {
          name: 'setPiecesComments',
          type: 'Array&lt;any&gt;'
        },
        "matchId": {
          name: 'matchId',
          type: 'any'
        },
        "_players": {
          name: '_players',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
      },
      relations: {
        match: {
          name: 'match',
          type: 'Match',
          model: 'Match',
          relationType: 'belongsTo',
                  keyFrom: 'matchId',
          keyTo: 'id'
        },
        players: {
          name: 'players',
          type: 'TacticsPlayerData[]',
          model: 'TacticsPlayerData',
          relationType: 'embedsMany',
                  keyFrom: '_players',
          keyTo: 'id'
        },
      }
    }
  }
}
