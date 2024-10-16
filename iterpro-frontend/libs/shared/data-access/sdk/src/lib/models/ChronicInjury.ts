/* tslint:disable */

declare var Object: any;
export interface ChronicInjuryInterface {
  "id"?: string;
  "date"?: Date;
  "endDate"?: Date;
  "system"?: any;
  "location"?: string;
  "anatomicalDetails"?: any;
  "diagnosis"?: string;
  "symptoms"?: string;
  "suggestedTherapy"?: string;
  "toDo"?: any;
  "notToDo"?: any;
  "currentStatus"?: string;
}

export class ChronicInjury implements ChronicInjuryInterface {
  "id": string;
  "date": Date;
  "endDate": Date;
  "system": any;
  "location": string;
  "anatomicalDetails": any;
  "diagnosis": string;
  "symptoms": string;
  "suggestedTherapy": string;
  "toDo": any;
  "notToDo": any;
  "currentStatus": string;
  constructor(data?: ChronicInjuryInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `ChronicInjury`.
   */
  public static getModelName() {
    return "ChronicInjury";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of ChronicInjury for dynamic purposes.
  **/
  public static factory(data: ChronicInjuryInterface): ChronicInjury{
    return new ChronicInjury(data);
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
      name: 'ChronicInjury',
      plural: 'ChronicInjuries',
      path: 'ChronicInjuries',
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
        "endDate": {
          name: 'endDate',
          type: 'Date'
        },
        "system": {
          name: 'system',
          type: 'any'
        },
        "location": {
          name: 'location',
          type: 'string'
        },
        "anatomicalDetails": {
          name: 'anatomicalDetails',
          type: 'any'
        },
        "diagnosis": {
          name: 'diagnosis',
          type: 'string'
        },
        "symptoms": {
          name: 'symptoms',
          type: 'string'
        },
        "suggestedTherapy": {
          name: 'suggestedTherapy',
          type: 'string'
        },
        "toDo": {
          name: 'toDo',
          type: 'any'
        },
        "notToDo": {
          name: 'notToDo',
          type: 'any'
        },
        "currentStatus": {
          name: 'currentStatus',
          type: 'string'
        },
      },
      relations: {
      }
    }
  }
}
