/* tslint:disable */
import {
  Customer
} from '../index';

declare var Object: any;
export interface PlayerDescriptionEntryInterface {
  "date"?: Date;
  "description"?: string;
  "strengths"?: string;
  "weaknesses"?: string;
  "recommendations"?: string;
  "relevantLinks"?: Array<any>;
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

export class PlayerDescriptionEntry implements PlayerDescriptionEntryInterface {
  "date": Date;
  "description": string;
  "strengths": string;
  "weaknesses": string;
  "recommendations": string;
  "relevantLinks": Array<any>;
  "notesThreads": Array<any>;
  "id": any;
  "playerId": any;
  "playerType": string;
  "authorId": any;
  "personType": string;
  "personId": any;
  player: any;
  author: Customer;
  constructor(data?: PlayerDescriptionEntryInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `PlayerDescriptionEntry`.
   */
  public static getModelName() {
    return "PlayerDescriptionEntry";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of PlayerDescriptionEntry for dynamic purposes.
  **/
  public static factory(data: PlayerDescriptionEntryInterface): PlayerDescriptionEntry{
    return new PlayerDescriptionEntry(data);
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
      name: 'PlayerDescriptionEntry',
      plural: 'PlayerDescriptionEntries',
      path: 'PlayerDescriptionEntries',
      idName: 'id',
      properties: {
        "date": {
          name: 'date',
          type: 'Date'
        },
        "description": {
          name: 'description',
          type: 'string'
        },
        "strengths": {
          name: 'strengths',
          type: 'string'
        },
        "weaknesses": {
          name: 'weaknesses',
          type: 'string'
        },
        "recommendations": {
          name: 'recommendations',
          type: 'string'
        },
        "relevantLinks": {
          name: 'relevantLinks',
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
