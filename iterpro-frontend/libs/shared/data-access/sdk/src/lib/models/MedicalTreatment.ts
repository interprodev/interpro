/* tslint:disable */
import {
  Player,
  Event,
  Injury,
  Attachment,
  Customer
} from '../index';

declare var Object: any;
export interface MedicalTreatmentInterface {
  "date"?: Date;
  "treatmentType"?: string;
  "category"?: any;
  "treatment"?: any;
  "description"?: any;
  "drug"?: string;
  "drugDose"?: string;
  "complete"?: boolean;
  "prescriptor"?: string;
  "location"?: string;
  "author"?: string;
  "injuryType"?: string;
  "notes"?: string;
  "lastUpdateDate"?: Date;
  "id"?: any;
  "playerId"?: any;
  "eventId"?: any;
  "injuryId"?: any;
  "_attachment"?: any;
  "lastUpdateAuthorId"?: any;
  player?: Player;
  event?: Event;
  injury?: Injury;
  attachment?: Attachment[];
  lastUpdateAuthor?: Customer;
}

export class MedicalTreatment implements MedicalTreatmentInterface {
  "date": Date;
  "treatmentType": string;
  "category": any;
  "treatment": any;
  "description": any;
  "drug": string;
  "drugDose": string;
  "complete": boolean;
  "prescriptor": string;
  "location": string;
  "author": string;
  "injuryType": string;
  "notes": string;
  "lastUpdateDate": Date;
  "id": any;
  "playerId": any;
  "eventId": any;
  "injuryId": any;
  "_attachment": any;
  "lastUpdateAuthorId": any;
  player: Player;
  event: Event;
  injury: Injury;
  attachment: Attachment[];
  lastUpdateAuthor: Customer;
  constructor(data?: MedicalTreatmentInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `MedicalTreatment`.
   */
  public static getModelName() {
    return "MedicalTreatment";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of MedicalTreatment for dynamic purposes.
  **/
  public static factory(data: MedicalTreatmentInterface): MedicalTreatment{
    return new MedicalTreatment(data);
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
      name: 'MedicalTreatment',
      plural: 'MedicalTreatments',
      path: 'MedicalTreatments',
      idName: 'id',
      properties: {
        "date": {
          name: 'date',
          type: 'Date'
        },
        "treatmentType": {
          name: 'treatmentType',
          type: 'string'
        },
        "category": {
          name: 'category',
          type: 'any'
        },
        "treatment": {
          name: 'treatment',
          type: 'any'
        },
        "description": {
          name: 'description',
          type: 'any'
        },
        "drug": {
          name: 'drug',
          type: 'string'
        },
        "drugDose": {
          name: 'drugDose',
          type: 'string'
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
        "injuryType": {
          name: 'injuryType',
          type: 'string'
        },
        "notes": {
          name: 'notes',
          type: 'string'
        },
        "lastUpdateDate": {
          name: 'lastUpdateDate',
          type: 'Date'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "playerId": {
          name: 'playerId',
          type: 'any'
        },
        "eventId": {
          name: 'eventId',
          type: 'any'
        },
        "injuryId": {
          name: 'injuryId',
          type: 'any'
        },
        "_attachment": {
          name: '_attachment',
          type: 'any'
        },
        "lastUpdateAuthorId": {
          name: 'lastUpdateAuthorId',
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
        attachment: {
          name: 'attachment',
          type: 'Attachment[]',
          model: 'Attachment',
          relationType: 'embedsOne',
                  keyFrom: '_attachment',
          keyTo: 'id'
        },
        lastUpdateAuthor: {
          name: 'lastUpdateAuthor',
          type: 'Customer',
          model: 'Customer',
          relationType: 'belongsTo',
                  keyFrom: 'lastUpdateAuthorId',
          keyTo: 'id'
        },
      }
    }
  }
}
