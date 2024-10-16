/* tslint:disable */
import {
  Player
} from '../index';

declare var Object: any;
export interface PlayerStatInterface {
  "id"?: string;
  "playerName"?: string;
  "minutesPlayed"?: number;
  "substituteInMinute"?: number;
  "substituteOutMinute"?: number;
  "yellowCard"?: boolean;
  "redCard"?: boolean;
  "gameName"?: string;
  "teamId"?: any;
  "rawFields"?: Array<any>;
  "playerId"?: any;
  player?: Player;
}

export class PlayerStat implements PlayerStatInterface {
  "id": string;
  "playerName": string;
  "minutesPlayed": number;
  "substituteInMinute": number;
  "substituteOutMinute": number;
  "yellowCard": boolean;
  "redCard": boolean;
  "gameName": string;
  "teamId": any;
  "rawFields": Array<any>;
  "playerId": any;
  player: Player;
  constructor(data?: PlayerStatInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `PlayerStat`.
   */
  public static getModelName() {
    return "PlayerStat";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of PlayerStat for dynamic purposes.
  **/
  public static factory(data: PlayerStatInterface): PlayerStat{
    return new PlayerStat(data);
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
      name: 'PlayerStat',
      plural: 'PlayerStats',
      path: 'PlayerStats',
      idName: 'id',
      properties: {
        "id": {
          name: 'id',
          type: 'string'
        },
        "playerName": {
          name: 'playerName',
          type: 'string'
        },
        "minutesPlayed": {
          name: 'minutesPlayed',
          type: 'number'
        },
        "substituteInMinute": {
          name: 'substituteInMinute',
          type: 'number'
        },
        "substituteOutMinute": {
          name: 'substituteOutMinute',
          type: 'number'
        },
        "yellowCard": {
          name: 'yellowCard',
          type: 'boolean'
        },
        "redCard": {
          name: 'redCard',
          type: 'boolean'
        },
        "gameName": {
          name: 'gameName',
          type: 'string'
        },
        "teamId": {
          name: 'teamId',
          type: 'any'
        },
        "rawFields": {
          name: 'rawFields',
          type: 'Array&lt;any&gt;'
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
