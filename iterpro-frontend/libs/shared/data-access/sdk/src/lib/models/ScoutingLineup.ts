/* tslint:disable */
import {
  Team,
  Attachment,
  Customer,
  ScoutingLineupPlayerData,
  ScoutingLineupRoleData
} from '../index';

declare var Object: any;
export interface ScoutingLineupInterface {
  "name"?: string;
  "tactic"?: string;
  "freezed"?: boolean;
  "selectedDirectorAppScenario"?: boolean;
  "id"?: any;
  "teamId"?: any;
  "_attachments"?: Array<any>;
  "sharedWithIds"?: Array<any>;
  "_players"?: Array<any>;
  "_roles"?: Array<any>;
  team?: Team;
  dataReports?: Attachment[];
  sharedWith?: Customer[];
  players?: ScoutingLineupPlayerData[];
  roles?: ScoutingLineupRoleData[];
}

export class ScoutingLineup implements ScoutingLineupInterface {
  "name": string;
  "tactic": string;
  "freezed": boolean;
  "selectedDirectorAppScenario": boolean;
  "id": any;
  "teamId": any;
  "_attachments": Array<any>;
  "sharedWithIds": Array<any>;
  "_players": Array<any>;
  "_roles": Array<any>;
  team: Team;
  dataReports: Attachment[];
  sharedWith: Customer[];
  players: ScoutingLineupPlayerData[];
  roles: ScoutingLineupRoleData[];
  constructor(data?: ScoutingLineupInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `ScoutingLineup`.
   */
  public static getModelName() {
    return "ScoutingLineup";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of ScoutingLineup for dynamic purposes.
  **/
  public static factory(data: ScoutingLineupInterface): ScoutingLineup{
    return new ScoutingLineup(data);
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
      name: 'ScoutingLineup',
      plural: 'ScoutingLineups',
      path: 'ScoutingLineups',
      idName: 'id',
      properties: {
        "name": {
          name: 'name',
          type: 'string'
        },
        "tactic": {
          name: 'tactic',
          type: 'string'
        },
        "freezed": {
          name: 'freezed',
          type: 'boolean'
        },
        "selectedDirectorAppScenario": {
          name: 'selectedDirectorAppScenario',
          type: 'boolean'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "teamId": {
          name: 'teamId',
          type: 'any'
        },
        "_attachments": {
          name: '_attachments',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "sharedWithIds": {
          name: 'sharedWithIds',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_players": {
          name: '_players',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_roles": {
          name: '_roles',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
      },
      relations: {
        team: {
          name: 'team',
          type: 'Team',
          model: 'Team',
          relationType: 'belongsTo',
                  keyFrom: 'teamId',
          keyTo: 'id'
        },
        dataReports: {
          name: 'dataReports',
          type: 'Attachment[]',
          model: 'Attachment',
          relationType: 'embedsMany',
                  keyFrom: '_attachments',
          keyTo: 'id'
        },
        sharedWith: {
          name: 'sharedWith',
          type: 'Customer[]',
          model: 'Customer',
          relationType: 'referencesMany',
                  keyFrom: 'sharedWithIds',
          keyTo: 'id'
        },
        players: {
          name: 'players',
          type: 'ScoutingLineupPlayerData[]',
          model: 'ScoutingLineupPlayerData',
          relationType: 'embedsMany',
                  keyFrom: '_players',
          keyTo: 'id'
        },
        roles: {
          name: 'roles',
          type: 'ScoutingLineupRoleData[]',
          model: 'ScoutingLineupRoleData',
          relationType: 'embedsMany',
                  keyFrom: '_roles',
          keyTo: 'id'
        },
      }
    }
  }
}
