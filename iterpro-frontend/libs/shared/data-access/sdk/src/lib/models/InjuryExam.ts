/* tslint:disable */
import {
  Event,
  Injury,
  Customer,
  Attachment
} from '../index';

declare var Object: any;
export interface InjuryExamInterface {
  "date"?: Date;
  "exam"?: string;
  "description"?: string;
  "cloudUrl"?: string;
  "complete"?: boolean;
  "id"?: string;
  "eventId"?: any;
  "injuryId"?: any;
  "authorId"?: any;
  "attachment"?: any;
  event?: Event;
  injury?: Injury;
  author?: Customer;
  attachments?: Attachment[];
}

export class InjuryExam implements InjuryExamInterface {
  "date": Date;
  "exam": string;
  "description": string;
  "cloudUrl": string;
  "complete": boolean;
  "id": string;
  "eventId": any;
  "injuryId": any;
  "authorId": any;
  "attachment": any;
  event: Event;
  injury: Injury;
  author: Customer;
  attachments: Attachment[];
  constructor(data?: InjuryExamInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `InjuryExam`.
   */
  public static getModelName() {
    return "InjuryExam";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of InjuryExam for dynamic purposes.
  **/
  public static factory(data: InjuryExamInterface): InjuryExam{
    return new InjuryExam(data);
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
      name: 'InjuryExam',
      plural: 'InjuryExams',
      path: 'InjuryExams',
      idName: 'id',
      properties: {
        "date": {
          name: 'date',
          type: 'Date'
        },
        "exam": {
          name: 'exam',
          type: 'string'
        },
        "description": {
          name: 'description',
          type: 'string'
        },
        "cloudUrl": {
          name: 'cloudUrl',
          type: 'string'
        },
        "complete": {
          name: 'complete',
          type: 'boolean'
        },
        "id": {
          name: 'id',
          type: 'string'
        },
        "eventId": {
          name: 'eventId',
          type: 'any'
        },
        "injuryId": {
          name: 'injuryId',
          type: 'any'
        },
        "authorId": {
          name: 'authorId',
          type: 'any'
        },
        "attachment": {
          name: 'attachment',
          type: 'any'
        },
      },
      relations: {
        event: {
          name: 'event',
          type: 'Event',
          model: 'Event',
          relationType: 'belongsTo',
                  keyFrom: 'eventId',
          keyTo: 'id'
        },
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
        attachments: {
          name: 'attachments',
          type: 'Attachment[]',
          model: 'Attachment',
          relationType: 'embedsOne',
                  keyFrom: 'attachment',
          keyTo: 'id'
        },
      }
    }
  }
}
