/* tslint:disable */
import {
  Club,
  Team,
  ClubSeason,
  TransferWindow,
  PlayerTransfer
} from '../index';

declare var Object: any;
export interface ClubTransferInterface {
  "currentStatus": string;
  "closed"?: boolean;
  "isPurchase": boolean;
  "offer"?: number;
  "notes"?: string;
  "id"?: any;
  "clubId"?: any;
  "personId"?: any;
  "personType"?: string;
  "teamId"?: any;
  "clubSeasonId"?: any;
  "transferWindowId"?: string;
  club?: Club;
  originalPerson?: any;
  team?: Team;
  clubSeason?: ClubSeason;
  transferWindow?: TransferWindow;
  player?: PlayerTransfer;
}

export class ClubTransfer implements ClubTransferInterface {
  "currentStatus": string;
  "closed": boolean;
  "isPurchase": boolean;
  "offer": number;
  "notes": string;
  "id": any;
  "clubId": any;
  "personId": any;
  "personType": string;
  "teamId": any;
  "clubSeasonId": any;
  "transferWindowId": string;
  club: Club;
  originalPerson: any;
  team: Team;
  clubSeason: ClubSeason;
  transferWindow: TransferWindow;
  player: PlayerTransfer;
  constructor(data?: ClubTransferInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `ClubTransfer`.
   */
  public static getModelName() {
    return "ClubTransfer";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of ClubTransfer for dynamic purposes.
  **/
  public static factory(data: ClubTransferInterface): ClubTransfer{
    return new ClubTransfer(data);
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
      name: 'ClubTransfer',
      plural: 'clubTransfers',
      path: 'clubTransfers',
      idName: 'id',
      properties: {
        "currentStatus": {
          name: 'currentStatus',
          type: 'string'
        },
        "closed": {
          name: 'closed',
          type: 'boolean',
          default: false
        },
        "isPurchase": {
          name: 'isPurchase',
          type: 'boolean'
        },
        "offer": {
          name: 'offer',
          type: 'number'
        },
        "notes": {
          name: 'notes',
          type: 'string'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "clubId": {
          name: 'clubId',
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
        "teamId": {
          name: 'teamId',
          type: 'any'
        },
        "clubSeasonId": {
          name: 'clubSeasonId',
          type: 'any'
        },
        "transferWindowId": {
          name: 'transferWindowId',
          type: 'string'
        },
      },
      relations: {
        club: {
          name: 'club',
          type: 'Club',
          model: 'Club',
          relationType: 'belongsTo',
                  keyFrom: 'clubId',
          keyTo: 'id'
        },
        originalPerson: {
          name: 'originalPerson',
          type: 'any',
          model: '',
          relationType: 'belongsTo',
                  keyFrom: 'personId',
          keyTo: 'id'
        },
        team: {
          name: 'team',
          type: 'Team',
          model: 'Team',
          relationType: 'belongsTo',
                  keyFrom: 'teamId',
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
        transferWindow: {
          name: 'transferWindow',
          type: 'TransferWindow',
          model: 'TransferWindow',
          relationType: 'belongsTo',
                  keyFrom: 'transferWindowId',
          keyTo: 'id'
        },
        player: {
          name: 'player',
          type: 'PlayerTransfer',
          model: 'PlayerTransfer',
          relationType: 'hasOne',
                  keyFrom: 'id',
          keyTo: 'clubTransferId'
        },
      }
    }
  }
}
