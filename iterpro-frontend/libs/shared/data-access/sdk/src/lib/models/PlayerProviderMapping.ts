/* tslint:disable */

declare var Object: any;
export interface PlayerProviderMappingInterface {
  "rawMetrics"?: Array<any>;
  "id"?: string;
  "splitField"?: string;
  "playerField"?: string;
  "gameField"?: string;
  "durationField"?: string;
  "yellowCardField"?: string;
  "redCardField"?: string;
  "substituteInMinuteField"?: string;
  "substituteOutMinuteField"?: string;
  "scoreField"?: string;
}

export class PlayerProviderMapping implements PlayerProviderMappingInterface {
  "rawMetrics": Array<any>;
  "id": string;
  "splitField": string;
  "playerField": string;
  "gameField": string;
  "durationField": string;
  "yellowCardField": string;
  "redCardField": string;
  "substituteInMinuteField": string;
  "substituteOutMinuteField": string;
  "scoreField": string;
  constructor(data?: PlayerProviderMappingInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `PlayerProviderMapping`.
   */
  public static getModelName() {
    return "PlayerProviderMapping";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of PlayerProviderMapping for dynamic purposes.
  **/
  public static factory(data: PlayerProviderMappingInterface): PlayerProviderMapping{
    return new PlayerProviderMapping(data);
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
      name: 'PlayerProviderMapping',
      plural: 'PlayerProviderMappings',
      path: 'PlayerProviderMappings',
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
        "splitField": {
          name: 'splitField',
          type: 'string'
        },
        "playerField": {
          name: 'playerField',
          type: 'string'
        },
        "gameField": {
          name: 'gameField',
          type: 'string'
        },
        "durationField": {
          name: 'durationField',
          type: 'string'
        },
        "yellowCardField": {
          name: 'yellowCardField',
          type: 'string'
        },
        "redCardField": {
          name: 'redCardField',
          type: 'string'
        },
        "substituteInMinuteField": {
          name: 'substituteInMinuteField',
          type: 'string'
        },
        "substituteOutMinuteField": {
          name: 'substituteOutMinuteField',
          type: 'string'
        },
        "scoreField": {
          name: 'scoreField',
          type: 'string'
        },
      },
      relations: {
      }
    }
  }
}
