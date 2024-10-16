/* tslint:disable */
import {
  Event,
  Injury,
  Attachment
} from '../index';

declare var Object: any;
export interface InjuryTreatmentInterface {
  "id"?: string;
  "date"?: Date;
  "category"?: string;
  "treatment"?: any;
  "description"?: any;
  "complete"?: boolean;
  "prescriptor"?: string;
  "location"?: string;
  "author"?: string;
  "type"?: string;
  "notes"?: string;
  "eventId"?: any;
  "injuryId"?: any;
  "attachment"?: any;
  event?: Event;
  injury?: Injury;
  attachments?: Attachment[];
}

export class InjuryTreatment implements InjuryTreatmentInterface {
  "id": string;
  "date": Date;
  "category": string;
  "treatment": any;
  "description": any;
  "complete": boolean;
  "prescriptor": string;
  "location": string;
  "author": string;
  "type": string;
  "notes": string;
  "eventId": any;
  "injuryId": any;
  "attachment": any;
  event: Event;
  injury: Injury;
  attachments: Attachment[];
  constructor(data?: InjuryTreatmentInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `InjuryTreatment`.
   */
  public static getModelName() {
    return "InjuryTreatment";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of InjuryTreatment for dynamic purposes.
  **/
  public static factory(data: InjuryTreatmentInterface): InjuryTreatment{
    return new InjuryTreatment(data);
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
      name: 'InjuryTreatment',
      plural: 'InjuryTreatments',
      path: 'InjuryTreatments',
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
        "category": {
          name: 'category',
          type: 'string'
        },
        "treatment": {
          name: 'treatment',
          type: 'any'
        },
        "description": {
          name: 'description',
          type: 'any'
        },
        "complete": {
          name: 'complete',
          type: 'boolean'
        },
        "prescriptor": {
          name: 'prescriptor',
          type: 'string'
        },
        "location": {
          name: 'location',
          type: 'string'
        },
        "author": {
          name: 'author',
          type: 'string'
        },
        "type": {
          name: 'type',
          type: 'string'
        },
        "notes": {
          name: 'notes',
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
