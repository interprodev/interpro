/* tslint:disable */
import {
  Club,
  TeamSeason,
  TransferWindow,
  TeamBonus
} from '../index';

declare var Object: any;
export interface ClubSeasonInterface {
  "name": string;
  "start": Date;
  "end": Date;
  "active"?: boolean;
  "operatingCashFlow"?: number;
  "id"?: any;
  "clubId"?: any;
  "_transferWindows"?: Array<any>;
  "__teamBonus"?: Array<any>;
  club?: Club;
  teamSeasons?: TeamSeason[];
  transferWindows?: TransferWindow[];
  teamBonus?: TeamBonus[];
  _teamBonus?: TeamBonus[];
}

export class ClubSeason implements ClubSeasonInterface {
  "name": string;
  "start": Date;
  "end": Date;
  "active": boolean;
  "operatingCashFlow": number;
  "id": any;
  "clubId": any;
  "_transferWindows": Array<any>;
  "__teamBonus": Array<any>;
  club: Club;
  teamSeasons: TeamSeason[];
  transferWindows: TransferWindow[];
  teamBonus: TeamBonus[];
  _teamBonus: TeamBonus[];
  constructor(data?: ClubSeasonInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `ClubSeason`.
   */
  public static getModelName() {
    return "ClubSeason";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of ClubSeason for dynamic purposes.
  **/
  public static factory(data: ClubSeasonInterface): ClubSeason{
    return new ClubSeason(data);
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
      name: 'ClubSeason',
      plural: 'ClubSeasons',
      path: 'ClubSeasons',
      idName: 'id',
      properties: {
        "name": {
          name: 'name',
          type: 'string'
        },
        "start": {
          name: 'start',
          type: 'Date'
        },
        "end": {
          name: 'end',
          type: 'Date'
        },
        "active": {
          name: 'active',
          type: 'boolean',
          default: false
        },
        "operatingCashFlow": {
          name: 'operatingCashFlow',
          type: 'number'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "clubId": {
          name: 'clubId',
          type: 'any'
        },
        "_transferWindows": {
          name: '_transferWindows',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "__teamBonus": {
          name: '__teamBonus',
          type: 'Array&lt;any&gt;',
          default: <any>[]
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
        teamSeasons: {
          name: 'teamSeasons',
          type: 'TeamSeason[]',
          model: 'TeamSeason',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'clubSeasonId'
        },
        transferWindows: {
          name: 'transferWindows',
          type: 'TransferWindow[]',
          model: 'TransferWindow',
          relationType: 'embedsMany',
                  keyFrom: '_transferWindows',
          keyTo: 'id'
        },
        teamBonus: {
          name: 'teamBonus',
          type: 'TeamBonus[]',
          model: 'TeamBonus',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'clubSeasonId'
        },
        _teamBonus: {
          name: '_teamBonus',
          type: 'TeamBonus[]',
          model: 'TeamBonus',
          relationType: 'embedsMany',
                  keyFrom: '__teamBonus',
          keyTo: 'id'
        },
      }
    }
  }
}
