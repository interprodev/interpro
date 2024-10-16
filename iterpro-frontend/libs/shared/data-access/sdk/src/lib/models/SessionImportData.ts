/* tslint:disable */

declare var Object: any;
export interface SessionImportDataInterface {
  "id"?: string;
  "nameSession"?: string;
  "date"?: Date;
  "identifier"?: string;
  "gdType"?: string;
  "teamId"?: any;
}

export class SessionImportData implements SessionImportDataInterface {
  "id": string;
  "nameSession": string;
  "date": Date;
  "identifier": string;
  "gdType": string;
  "teamId": any;
  constructor(data?: SessionImportDataInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `SessionImportData`.
   */
  public static getModelName() {
    return "SessionImportData";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of SessionImportData for dynamic purposes.
  **/
  public static factory(data: SessionImportDataInterface): SessionImportData{
    return new SessionImportData(data);
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
      name: 'SessionImportData',
      plural: 'sessions',
      path: 'sessions',
      idName: 'id',
      properties: {
        "id": {
          name: 'id',
          type: 'string'
        },
        "nameSession": {
          name: 'nameSession',
          type: 'string'
        },
        "date": {
          name: 'date',
          type: 'Date'
        },
        "identifier": {
          name: 'identifier',
          type: 'string'
        },
        "gdType": {
          name: 'gdType',
          type: 'string'
        },
        "teamId": {
          name: 'teamId',
          type: 'any'
        },
      },
      relations: {
      }
    }
  }
}
