/* tslint:disable */
import {
  Attachment,
  Event
} from '../index';

declare var Object: any;
export interface PreventionExamInterface {
  "id"?: string;
  "date"?: Date;
  "exam"?: string;
  "description"?: string;
  "cloudUrl"?: string;
  "complete"?: boolean;
  "history"?: any;
  "attachment"?: any;
  "eventId"?: any;
  attachments?: Attachment[];
  event?: Event;
}

export class PreventionExam implements PreventionExamInterface {
  "id": string;
  "date": Date;
  "exam": string;
  "description": string;
  "cloudUrl": string;
  "complete": boolean;
  "history": any;
  "attachment": any;
  "eventId": any;
  attachments: Attachment[];
  event: Event;
  constructor(data?: PreventionExamInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `PreventionExam`.
   */
  public static getModelName() {
    return "PreventionExam";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of PreventionExam for dynamic purposes.
  **/
  public static factory(data: PreventionExamInterface): PreventionExam{
    return new PreventionExam(data);
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
      name: 'PreventionExam',
      plural: 'PreventionExams',
      path: 'PreventionExams',
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
        "history": {
          name: 'history',
          type: 'any'
        },
        "attachment": {
          name: 'attachment',
          type: 'any'
        },
        "eventId": {
          name: 'eventId',
          type: 'any'
        },
      },
      relations: {
        attachments: {
          name: 'attachments',
          type: 'Attachment[]',
          model: 'Attachment',
          relationType: 'embedsOne',
                  keyFrom: 'attachment',
          keyTo: 'id'
        },
        event: {
          name: 'event',
          type: 'Event',
          model: 'Event',
          relationType: 'belongsTo',
                  keyFrom: 'eventId',
          keyTo: 'id'
        },
      }
    }
  }
}
