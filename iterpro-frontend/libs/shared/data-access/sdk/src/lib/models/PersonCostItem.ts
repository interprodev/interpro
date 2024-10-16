/* tslint:disable */
import {
  ClubSeason,
  Attachment
} from '../index';

declare var Object: any;
export interface PersonCostItemInterface {
  "type": string;
  "occurrenceDate": Date;
  "creationDate": Date;
  "description"?: string;
  "value": number;
  "paymentDate": Date;
  "paid"?: boolean;
  "expiryDate"?: Date;
  "notes"?: string;
  "id"?: any;
  "personId"?: any;
  "personType"?: string;
  "clubSeasonId"?: any;
  "_attachments"?: Array<any>;
  person?: any;
  clubSeason?: ClubSeason;
  attachments?: Attachment[];
}

export class PersonCostItem implements PersonCostItemInterface {
  "type": string;
  "occurrenceDate": Date;
  "creationDate": Date;
  "description": string;
  "value": number;
  "paymentDate": Date;
  "paid": boolean;
  "expiryDate": Date;
  "notes": string;
  "id": any;
  "personId": any;
  "personType": string;
  "clubSeasonId": any;
  "_attachments": Array<any>;
  person: any;
  clubSeason: ClubSeason;
  attachments: Attachment[];
  constructor(data?: PersonCostItemInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `PersonCostItem`.
   */
  public static getModelName() {
    return "PersonCostItem";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of PersonCostItem for dynamic purposes.
  **/
  public static factory(data: PersonCostItemInterface): PersonCostItem{
    return new PersonCostItem(data);
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
      name: 'PersonCostItem',
      plural: 'PersonCostItems',
      path: 'PersonCostItems',
      idName: 'id',
      properties: {
        "type": {
          name: 'type',
          type: 'string'
        },
        "occurrenceDate": {
          name: 'occurrenceDate',
          type: 'Date'
        },
        "creationDate": {
          name: 'creationDate',
          type: 'Date'
        },
        "description": {
          name: 'description',
          type: 'string'
        },
        "value": {
          name: 'value',
          type: 'number'
        },
        "paymentDate": {
          name: 'paymentDate',
          type: 'Date'
        },
        "paid": {
          name: 'paid',
          type: 'boolean'
        },
        "expiryDate": {
          name: 'expiryDate',
          type: 'Date'
        },
        "notes": {
          name: 'notes',
          type: 'string'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "personId": {
          name: 'personId',
          type: 'any'
        },
        "personType": {
          name: 'personType',
          type: 'string'
        },
        "clubSeasonId": {
          name: 'clubSeasonId',
          type: 'any'
        },
        "_attachments": {
          name: '_attachments',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
      },
      relations: {
        person: {
          name: 'person',
          type: 'any',
          model: '',
          relationType: 'belongsTo',
                  keyFrom: 'personId',
          keyTo: 'id'
        },
        clubSeason: {
          name: 'clubSeason',
          type: 'ClubSeason',
          model: 'ClubSeason',
          relationType: 'belongsTo',
                  keyFrom: 'clubSeasonId',
          keyTo: 'id'
        },
        attachments: {
          name: 'attachments',
          type: 'Attachment[]',
          model: 'Attachment',
          relationType: 'embedsMany',
                  keyFrom: '_attachments',
          keyTo: 'id'
        },
      }
    }
  }
}
