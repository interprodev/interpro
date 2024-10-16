/* tslint:disable */
import {
  Player
} from '../index';

declare var Object: any;
export interface SessionPlayerDataInterface {
  "id"?: string;
  "date"?: Date;
  "dirty"?: boolean;
  "complete"?: boolean;
  "playerName"?: string;
  "splitName"?: string;
  "splitStartTime"?: Date;
  "splitEndTime"?: Date;
  "duration"?: number;
  "rpe"?: number;
  "rpeTl"?: number;
  "totalDistance"?: number;
  "sprintDistance"?: number;
  "highspeedRunningDistance"?: number;
  "powerDistance"?: number;
  "highPowerDistance"?: number;
  "powerPlays"?: number;
  "highIntensityAcceleration"?: number;
  "highIntensityDeceleration"?: number;
  "explosiveDistance"?: number;
  "averageMetabolicPower"?: number;
  "distancePerMinute"?: number;
  "heartRate85to90"?: number;
  "heartRateGr90"?: number;
  "workload"?: number;
  "perceivedWorkload"?: number;
  "cardioWorkload"?: number;
  "kinematicWorkload"?: number;
  "metabolicWorkload"?: number;
  "mechanicalWorkload"?: number;
  "intensity"?: number;
  "gdType"?: string;
  "teamId"?: string;
  "fromCsv"?: boolean;
  "mainSession"?: boolean;
  "drillId"?: string;
  "playerId"?: any;
  player?: Player;
}

export class SessionPlayerData implements SessionPlayerDataInterface {
  "id": string;
  "date": Date;
  "dirty": boolean;
  "complete": boolean;
  "playerName": string;
  "splitName": string;
  "splitStartTime": Date;
  "splitEndTime": Date;
  "duration": number;
  "rpe": number;
  "rpeTl": number;
  "totalDistance": number;
  "sprintDistance": number;
  "highspeedRunningDistance": number;
  "powerDistance": number;
  "highPowerDistance": number;
  "powerPlays": number;
  "highIntensityAcceleration": number;
  "highIntensityDeceleration": number;
  "explosiveDistance": number;
  "averageMetabolicPower": number;
  "distancePerMinute": number;
  "heartRate85to90": number;
  "heartRateGr90": number;
  "workload": number;
  "perceivedWorkload": number;
  "cardioWorkload": number;
  "kinematicWorkload": number;
  "metabolicWorkload": number;
  "mechanicalWorkload": number;
  "intensity": number;
  "gdType": string;
  "teamId": string;
  "fromCsv": boolean;
  "mainSession": boolean;
  "drillId": string;
  "playerId": any;
  player: Player;
  constructor(data?: SessionPlayerDataInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `SessionPlayerData`.
   */
  public static getModelName() {
    return "SessionPlayerData";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of SessionPlayerData for dynamic purposes.
  **/
  public static factory(data: SessionPlayerDataInterface): SessionPlayerData{
    return new SessionPlayerData(data);
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
      name: 'SessionPlayerData',
      plural: 'SessionPlayerData',
      path: 'SessionPlayerData',
      idName: 'id',
      properties: {
        "id": {
          name: 'id',
          type: 'string'
        },
        "date": {
          name: 'date',
          type: 'Date'
        },
        "dirty": {
          name: 'dirty',
          type: 'boolean',
          default: false
        },
        "complete": {
          name: 'complete',
          type: 'boolean',
          default: true
        },
        "playerName": {
          name: 'playerName',
          type: 'string'
        },
        "splitName": {
          name: 'splitName',
          type: 'string'
        },
        "splitStartTime": {
          name: 'splitStartTime',
          type: 'Date'
        },
        "splitEndTime": {
          name: 'splitEndTime',
          type: 'Date'
        },
        "duration": {
          name: 'duration',
          type: 'number'
        },
        "rpe": {
          name: 'rpe',
          type: 'number',
          default: 0
        },
        "rpeTl": {
          name: 'rpeTl',
          type: 'number',
          default: 0
        },
        "totalDistance": {
          name: 'totalDistance',
          type: 'number',
          default: 0
        },
        "sprintDistance": {
          name: 'sprintDistance',
          type: 'number',
          default: 0
        },
        "highspeedRunningDistance": {
          name: 'highspeedRunningDistance',
          type: 'number',
          default: 0
        },
        "powerDistance": {
          name: 'powerDistance',
          type: 'number',
          default: 0
        },
        "highPowerDistance": {
          name: 'highPowerDistance',
          type: 'number',
          default: 0
        },
        "powerPlays": {
          name: 'powerPlays',
          type: 'number',
          default: 0
        },
        "highIntensityAcceleration": {
          name: 'highIntensityAcceleration',
          type: 'number',
          default: 0
        },
        "highIntensityDeceleration": {
          name: 'highIntensityDeceleration',
          type: 'number',
          default: 0
        },
        "explosiveDistance": {
          name: 'explosiveDistance',
          type: 'number',
          default: 0
        },
        "averageMetabolicPower": {
          name: 'averageMetabolicPower',
          type: 'number',
          default: 0
        },
        "distancePerMinute": {
          name: 'distancePerMinute',
          type: 'number',
          default: 0
        },
        "heartRate85to90": {
          name: 'heartRate85to90',
          type: 'number',
          default: 0
        },
        "heartRateGr90": {
          name: 'heartRateGr90',
          type: 'number',
          default: 0
        },
        "workload": {
          name: 'workload',
          type: 'number'
        },
        "perceivedWorkload": {
          name: 'perceivedWorkload',
          type: 'number',
          default: 0
        },
        "cardioWorkload": {
          name: 'cardioWorkload',
          type: 'number',
          default: 0
        },
        "kinematicWorkload": {
          name: 'kinematicWorkload',
          type: 'number',
          default: 0
        },
        "metabolicWorkload": {
          name: 'metabolicWorkload',
          type: 'number',
          default: 0
        },
        "mechanicalWorkload": {
          name: 'mechanicalWorkload',
          type: 'number',
          default: 0
        },
        "intensity": {
          name: 'intensity',
          type: 'number',
          default: 0
        },
        "gdType": {
          name: 'gdType',
          type: 'string'
        },
        "teamId": {
          name: 'teamId',
          type: 'string'
        },
        "fromCsv": {
          name: 'fromCsv',
          type: 'boolean'
        },
        "mainSession": {
          name: 'mainSession',
          type: 'boolean',
          default: false
        },
        "drillId": {
          name: 'drillId',
          type: 'string'
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
