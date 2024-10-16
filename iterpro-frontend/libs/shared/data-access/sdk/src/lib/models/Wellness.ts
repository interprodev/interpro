/* tslint:disable */
import {
  Player
} from '../index';

declare var Object: any;
export interface WellnessInterface {
  "wellness_sleep"?: number;
  "wellness_stress"?: number;
  "wellness_fatigue"?: number;
  "wellness_soreness"?: number;
  "wellness_mood"?: number;
  "sleep_start"?: string;
  "sleep_end"?: string;
  "sleep_hours"?: string;
  "locations"?: any;
  "score"?: number;
  "date"?: Date;
  "playerId"?: any;
  "id"?: any;
  player?: Player;
}

export class Wellness implements WellnessInterface {
  "wellness_sleep": number;
  "wellness_stress": number;
  "wellness_fatigue": number;
  "wellness_soreness": number;
  "wellness_mood": number;
  "sleep_start": string;
  "sleep_end": string;
  "sleep_hours": string;
  "locations": any;
  "score": number;
  "date": Date;
  "playerId": any;
  "id": any;
  player: Player;
  constructor(data?: WellnessInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Wellness`.
   */
  public static getModelName() {
    return "Wellness";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Wellness for dynamic purposes.
  **/
  public static factory(data: WellnessInterface): Wellness{
    return new Wellness(data);
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
      name: 'Wellness',
      plural: 'Wellnesses',
      path: 'Wellnesses',
      idName: 'id',
      properties: {
        "wellness_sleep": {
          name: 'wellness_sleep',
          type: 'number',
          default: 0
        },
        "wellness_stress": {
          name: 'wellness_stress',
          type: 'number',
          default: 0
        },
        "wellness_fatigue": {
          name: 'wellness_fatigue',
          type: 'number',
          default: 0
        },
        "wellness_soreness": {
          name: 'wellness_soreness',
          type: 'number',
          default: 0
        },
        "wellness_mood": {
          name: 'wellness_mood',
          type: 'number',
          default: 0
        },
        "sleep_start": {
          name: 'sleep_start',
          type: 'string'
        },
        "sleep_end": {
          name: 'sleep_end',
          type: 'string'
        },
        "sleep_hours": {
          name: 'sleep_hours',
          type: 'string'
        },
        "locations": {
          name: 'locations',
          type: 'any'
        },
        "score": {
          name: 'score',
          type: 'number'
        },
        "date": {
          name: 'date',
          type: 'Date'
        },
        "playerId": {
          name: 'playerId',
          type: 'any'
        },
        "id": {
          name: 'id',
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
