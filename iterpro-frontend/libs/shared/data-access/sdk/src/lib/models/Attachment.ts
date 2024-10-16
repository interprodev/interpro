/* tslint:disable */
import {
  Customer,
  Player,
  Staff
} from '../index';

declare var Object: any;
export interface AttachmentInterface {
  "name": string;
  "date": Date;
  "url"?: string;
  "downloadUrl"?: string;
  "externalUrl"?: string;
  "streamingUrl"?: string;
  "id"?: any;
  "authorId"?: any;
  "sharedPlayerIds"?: Array<any>;
  "sharedStaffIds"?: Array<any>;
  author?: Customer;
  sharedPlayers?: Player[];
  sharedStaffs?: Staff[];
}

export class Attachment implements AttachmentInterface {
  "name": string;
  "date": Date;
  "url": string;
  "downloadUrl": string;
  "externalUrl": string;
  "streamingUrl": string;
  "id": any;
  "authorId": any;
  "sharedPlayerIds": Array<any>;
  "sharedStaffIds": Array<any>;
  author: Customer;
  sharedPlayers: Player[];
  sharedStaffs: Staff[];
  constructor(data?: AttachmentInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Attachment`.
   */
  public static getModelName() {
    return "Attachment";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Attachment for dynamic purposes.
  **/
  public static factory(data: AttachmentInterface): Attachment{
    return new Attachment(data);
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
      name: 'Attachment',
      plural: 'Attachments',
      path: 'Attachments',
      idName: 'id',
      properties: {
        "name": {
          name: 'name',
          type: 'string'
        },
        "date": {
          name: 'date',
          type: 'Date'
        },
        "url": {
          name: 'url',
          type: 'string'
        },
        "downloadUrl": {
          name: 'downloadUrl',
          type: 'string'
        },
        "externalUrl": {
          name: 'externalUrl',
          type: 'string'
        },
        "streamingUrl": {
          name: 'streamingUrl',
          type: 'string'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "authorId": {
          name: 'authorId',
          type: 'any'
        },
        "sharedPlayerIds": {
          name: 'sharedPlayerIds',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "sharedStaffIds": {
          name: 'sharedStaffIds',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
      },
      relations: {
        author: {
          name: 'author',
          type: 'Customer',
          model: 'Customer',
          relationType: 'belongsTo',
                  keyFrom: 'authorId',
          keyTo: 'id'
        },
        sharedPlayers: {
          name: 'sharedPlayers',
          type: 'Player[]',
          model: 'Player',
          relationType: 'referencesMany',
                  keyFrom: 'sharedPlayerIds',
          keyTo: 'id'
        },
        sharedStaffs: {
          name: 'sharedStaffs',
          type: 'Staff[]',
          model: 'Staff',
          relationType: 'referencesMany',
                  keyFrom: 'sharedStaffIds',
          keyTo: 'id'
        },
      }
    }
  }
}
