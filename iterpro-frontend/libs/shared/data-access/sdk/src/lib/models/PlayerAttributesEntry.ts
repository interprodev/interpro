/* tslint:disable */
import {
  Customer
} from '../index';

declare var Object: any;
export interface PlayerAttributesEntryInterface {
  "date"?: Date;
  "values"?: Array<any>;
  "notesThreads"?: Array<any>;
  "id"?: any;
  "playerId"?: any;
  "playerType"?: string;
  "authorId"?: any;
  "personType"?: string;
  "personId"?: any;
  player?: any;
  author?: Customer;
}

export class PlayerAttributesEntry implements PlayerAttributesEntryInterface {
  "date": Date;
  "values": Array<any>;
  "notesThreads": Array<any>;
  "id": any;
  "playerId": any;
  "playerType": string;
  "authorId": any;
  "personType": string;
  "personId": any;
  player: any;
  author: Customer;
  constructor(data?: PlayerAttributesEntryInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `PlayerAttributesEntry`.
   */
  public static getModelName() {
    return "PlayerAttributesEntry";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of PlayerAttributesEntry for dynamic purposes.
  **/
  public static factory(data: PlayerAttributesEntryInterface): PlayerAttributesEntry{
    return new PlayerAttributesEntry(data);
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
      name: 'PlayerAttributesEntry',
      plural: 'PlayerAttributesEntries',
      path: 'PlayerAttributesEntries',
      idName: 'id',
      properties: {
        "date": {
          name: 'date',
          type: 'Date'
        },
        "values": {
          name: 'values',
          type: 'Array&lt;any&gt;'
        },
        "notesThreads": {
          name: 'notesThreads',
          type: 'Array&lt;any&gt;'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "playerId": {
          name: 'playerId',
          type: 'any'
        },
        "playerType": {
          name: 'playerType',
          type: 'string'
        },
        "authorId": {
          name: 'authorId',
          type: 'any'
        },
        "personType": {
          name: 'personType',
          type: 'string'
        },
        "personId": {
          name: 'personId',
          type: 'any'
        },
      },
      relations: {
        player: {
          name: 'player',
          type: 'any',
          model: '',
          relationType: 'belongsTo',
                  keyFrom: 'playerId',
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
