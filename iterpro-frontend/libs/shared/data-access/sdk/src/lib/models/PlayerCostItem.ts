/* tslint:disable */
import {
  Player,
  ClubSeason,
  Attachment
} from '../index';

declare var Object: any;
export interface PlayerCostItemInterface {
  "type": string;
  "creationDate": Date;
  "description"?: string;
  "value": number;
  "paymentDate": Date;
  "paid"?: boolean;
  "expiryDate"?: Date;
  "notes"?: string;
  "id"?: any;
  "playerId"?: any;
  "clubSeasonId"?: any;
  "_attachments"?: Array<any>;
  player?: Player;
  clubSeason?: ClubSeason;
  attachments?: Attachment[];
}

export class PlayerCostItem implements PlayerCostItemInterface {
  "type": string;
  "creationDate": Date;
  "description": string;
  "value": number;
  "paymentDate": Date;
  "paid": boolean;
  "expiryDate": Date;
  "notes": string;
  "id": any;
  "playerId": any;
  "clubSeasonId": any;
  "_attachments": Array<any>;
  player: Player;
  clubSeason: ClubSeason;
  attachments: Attachment[];
  constructor(data?: PlayerCostItemInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `PlayerCostItem`.
   */
  public static getModelName() {
    return "PlayerCostItem";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of PlayerCostItem for dynamic purposes.
  **/
  public static factory(data: PlayerCostItemInterface): PlayerCostItem{
    return new PlayerCostItem(data);
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
      name: 'PlayerCostItem',
      plural: 'PlayerCostItems',
      path: 'PlayerCostItems',
      idName: 'id',
      properties: {
        "type": {
          name: 'type',
          type: 'string'
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
        "playerId": {
          name: 'playerId',
          type: 'any'
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
        player: {
          name: 'player',
          type: 'Player',
          model: 'Player',
          relationType: 'belongsTo',
                  keyFrom: 'playerId',
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
