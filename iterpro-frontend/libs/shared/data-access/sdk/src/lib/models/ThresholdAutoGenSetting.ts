/* tslint:disable */

declare var Object: any;
export interface ThresholdAutoGenSettingInterface {
  "id"?: string;
  "thresholdType": string;
  "gd"?: string;
  "name"?: string;
  "testId"?: string;
  "valueType"?: string;
}

export class ThresholdAutoGenSetting implements ThresholdAutoGenSettingInterface {
  "id": string;
  "thresholdType": string;
  "gd": string;
  "name": string;
  "testId": string;
  "valueType": string;
  constructor(data?: ThresholdAutoGenSettingInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `ThresholdAutoGenSetting`.
   */
  public static getModelName() {
    return "ThresholdAutoGenSetting";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of ThresholdAutoGenSetting for dynamic purposes.
  **/
  public static factory(data: ThresholdAutoGenSettingInterface): ThresholdAutoGenSetting{
    return new ThresholdAutoGenSetting(data);
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
      name: 'ThresholdAutoGenSetting',
      plural: 'ThresholdAutoGenSettings',
      path: 'ThresholdAutoGenSettings',
      idName: 'id',
      properties: {
        "id": {
          name: 'id',
          type: 'string'
        },
        "thresholdType": {
          name: 'thresholdType',
          type: 'string'
        },
        "gd": {
          name: 'gd',
          type: 'string'
        },
        "name": {
          name: 'name',
          type: 'string',
          default: 'false'
        },
        "testId": {
          name: 'testId',
          type: 'string'
        },
        "valueType": {
          name: 'valueType',
          type: 'string'
        },
      },
      relations: {
      }
    }
  }
}
