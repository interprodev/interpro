/* tslint:disable */
import {
  Injury,
  Customer
} from '../index';

declare var Object: any;
export interface InjuryAssessmentInterface {
  "date"?: Date;
  "rom"?: string;
  "strength"?: string;
  "stability"?: string;
  "swelling"?: string;
  "pain"?: number;
  "functionality"?: number;
  "notes"?: string;
  "next"?: Date;
  "highPriority"?: boolean;
  "available"?: any;
  "expectation"?: Date;
  "further"?: boolean;
  "id"?: string;
  "injuryId"?: any;
  "authorId"?: any;
  injury?: Injury;
  author?: Customer;
}

export class InjuryAssessment implements InjuryAssessmentInterface {
  "date": Date;
  "rom": string;
  "strength": string;
  "stability": string;
  "swelling": string;
  "pain": number;
  "functionality": number;
  "notes": string;
  "next": Date;
  "highPriority": boolean;
  "available": any;
  "expectation": Date;
  "further": boolean;
  "id": string;
  "injuryId": any;
  "authorId": any;
  injury: Injury;
  author: Customer;
  constructor(data?: InjuryAssessmentInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `InjuryAssessment`.
   */
  public static getModelName() {
    return "InjuryAssessment";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of InjuryAssessment for dynamic purposes.
  **/
  public static factory(data: InjuryAssessmentInterface): InjuryAssessment{
    return new InjuryAssessment(data);
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
      name: 'InjuryAssessment',
      plural: 'InjuryAssessments',
      path: 'InjuryAssessments',
      idName: 'id',
      properties: {
        "date": {
          name: 'date',
          type: 'Date'
        },
        "rom": {
          name: 'rom',
          type: 'string'
        },
        "strength": {
          name: 'strength',
          type: 'string'
        },
        "stability": {
          name: 'stability',
          type: 'string'
        },
        "swelling": {
          name: 'swelling',
          type: 'string'
        },
        "pain": {
          name: 'pain',
          type: 'number'
        },
        "functionality": {
          name: 'functionality',
          type: 'number'
        },
        "notes": {
          name: 'notes',
          type: 'string'
        },
        "next": {
          name: 'next',
          type: 'Date'
        },
        "highPriority": {
          name: 'highPriority',
          type: 'boolean'
        },
        "available": {
          name: 'available',
          type: 'any',
          default: <any>null
        },
        "expectation": {
          name: 'expectation',
          type: 'Date'
        },
        "further": {
          name: 'further',
          type: 'boolean',
          default: true
        },
        "id": {
          name: 'id',
          type: 'string'
        },
        "injuryId": {
          name: 'injuryId',
          type: 'any'
        },
        "authorId": {
          name: 'authorId',
          type: 'any'
        },
      },
      relations: {
        injury: {
          name: 'injury',
          type: 'Injury',
          model: 'Injury',
          relationType: 'belongsTo',
                  keyFrom: 'injuryId',
          keyTo: 'id'
        },
        author: {
          name: 'author',
          type: 'Customer',
          model: 'Customer',
          relationType: 'belongsTo',
                  keyFrom: 'authorId',
          keyTo: 'id'
        },
      }
    }
  }
}
