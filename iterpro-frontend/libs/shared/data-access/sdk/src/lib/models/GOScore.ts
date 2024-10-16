/* tslint:disable */
import {
  Player
} from '../index';

declare var Object: any;
export interface GOScoreInterface {
  "score"?: number;
  "date"?: Date;
  "color"?: string;
  "increment"?: number;
  "dirty"?: boolean;
  "wellness"?: number;
  "_cmj"?: number;
  "_hrv"?: number;
  "_tc"?: number;
  "_hydration"?: number;
  "_cpk"?: number;
  "_hipMobility"?: number;
  "_sleep"?: number;
  "id"?: any;
  "playerId"?: any;
  player?: Player;
}

export class GOScore implements GOScoreInterface {
  "score": number;
  "date": Date;
  "color": string;
  "increment": number;
  "dirty": boolean;
  "wellness": number;
  "_cmj": number;
  "_hrv": number;
  "_tc": number;
  "_hydration": number;
  "_cpk": number;
  "_hipMobility": number;
  "_sleep": number;
  "id": any;
  "playerId": any;
  player: Player;
  constructor(data?: GOScoreInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `GOScore`.
   */
  public static getModelName() {
    return "GOScore";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of GOScore for dynamic purposes.
  **/
  public static factory(data: GOScoreInterface): GOScore{
    return new GOScore(data);
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
      name: 'GOScore',
      plural: 'GOScores',
      path: 'GOScores',
      idName: 'id',
      properties: {
        "score": {
          name: 'score',
          type: 'number'
        },
        "date": {
          name: 'date',
          type: 'Date'
        },
        "color": {
          name: 'color',
          type: 'string'
        },
        "increment": {
          name: 'increment',
          type: 'number'
        },
        "dirty": {
          name: 'dirty',
          type: 'boolean',
          default: false
        },
        "wellness": {
          name: 'wellness',
          type: 'number'
        },
        "_cmj": {
          name: '_cmj',
          type: 'number'
        },
        "_hrv": {
          name: '_hrv',
          type: 'number'
        },
        "_tc": {
          name: '_tc',
          type: 'number'
        },
        "_hydration": {
          name: '_hydration',
          type: 'number'
        },
        "_cpk": {
          name: '_cpk',
          type: 'number'
        },
        "_hipMobility": {
          name: '_hipMobility',
          type: 'number'
        },
        "_sleep": {
          name: '_sleep',
          type: 'number'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "playerId": {
          name: 'playerId',
          type: 'any'
        },
      },
      relations: {
        player: {
          name: 'player',
          type: 'Player',
          model: 'Player',
          relationType: 'belongsTo',
                  keyFrom: 'playerId',
          keyTo: 'id'
        },
      }
    }
  }
}
