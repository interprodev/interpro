/* tslint:disable */

declare var Object: any;
export interface PlayerMatchStatInterface {
  "id"?: string;
  "enabled"?: boolean;
  "playerId"?: string;
  "playerName"?: string;
  "downloadUrl"?: string;
  "position"?: string;
  "minutesPlayed"?: number;
  "substituteInMinute"?: number;
  "substituteOutMinute"?: number;
  "yellowCard"?: boolean;
  "doubleYellowCard"?: boolean;
  "redCard"?: boolean;
  "score"?: number;
  "assists"?: number;
  "conversion"?: number;
  "startingRoster"?: boolean;
  "scoreSet1"?: number;
  "scoreSet2"?: number;
  "scoreSet3"?: number;
  "scoreSet4"?: number;
  "scoreSet5"?: number;
}

export class PlayerMatchStat implements PlayerMatchStatInterface {
  "id": string;
  "enabled": boolean;
  "playerId": string;
  "playerName": string;
  "downloadUrl": string;
  "position": string;
  "minutesPlayed": number;
  "substituteInMinute": number;
  "substituteOutMinute": number;
  "yellowCard": boolean;
  "doubleYellowCard": boolean;
  "redCard": boolean;
  "score": number;
  "assists": number;
  "conversion": number;
  "startingRoster": boolean;
  "scoreSet1": number;
  "scoreSet2": number;
  "scoreSet3": number;
  "scoreSet4": number;
  "scoreSet5": number;
  constructor(data?: PlayerMatchStatInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `PlayerMatchStat`.
   */
  public static getModelName() {
    return "PlayerMatchStat";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of PlayerMatchStat for dynamic purposes.
  **/
  public static factory(data: PlayerMatchStatInterface): PlayerMatchStat{
    return new PlayerMatchStat(data);
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
      name: 'PlayerMatchStat',
      plural: 'PlayerMatchStats',
      path: 'PlayerMatchStats',
      idName: 'id',
      properties: {
        "id": {
          name: 'id',
          type: 'string'
        },
        "enabled": {
          name: 'enabled',
          type: 'boolean'
        },
        "playerId": {
          name: 'playerId',
          type: 'string'
        },
        "playerName": {
          name: 'playerName',
          type: 'string'
        },
        "downloadUrl": {
          name: 'downloadUrl',
          type: 'string'
        },
        "position": {
          name: 'position',
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
        "doubleYellowCard": {
          name: 'doubleYellowCard',
          type: 'boolean'
        },
        "redCard": {
          name: 'redCard',
          type: 'boolean'
        },
        "score": {
          name: 'score',
          type: 'number'
        },
        "assists": {
          name: 'assists',
          type: 'number'
        },
        "conversion": {
          name: 'conversion',
          type: 'number'
        },
        "startingRoster": {
          name: 'startingRoster',
          type: 'boolean'
        },
        "scoreSet1": {
          name: 'scoreSet1',
          type: 'number'
        },
        "scoreSet2": {
          name: 'scoreSet2',
          type: 'number'
        },
        "scoreSet3": {
          name: 'scoreSet3',
          type: 'number'
        },
        "scoreSet4": {
          name: 'scoreSet4',
          type: 'number'
        },
        "scoreSet5": {
          name: 'scoreSet5',
          type: 'number'
        },
      },
      relations: {
      }
    }
  }
}
