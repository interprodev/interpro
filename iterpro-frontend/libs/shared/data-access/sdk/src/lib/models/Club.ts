/* tslint:disable */
import {
  Team,
  Customer,
  Player,
  PlayerScouting,
  CustomerPlayer,
  Staff,
  ClubTransfer,
  ClubSeason,
  Agent
} from '../index';

declare var Object: any;
export interface ClubInterface {
  "name": string;
  "crest"?: string;
  "demo"?: boolean;
  "foundation"?: Date;
  "nation"?: string;
  "region"?: string;
  "professionalStatus"?: string;
  "currency"?: string;
  "taxes"?: number;
  "vat"?: number;
  "freemium"?: boolean;
  "freemiumUsers"?: number;
  "directorApp"?: boolean;
  "nationalClub"?: boolean;
  "sportType"?: string;
  "scoutingSettings"?: any;
  "active"?: boolean;
  "atcCommercialNamesMapping"?: any;
  "landingPage"?: string;
  "coachingApp"?: boolean;
  "b2cScouting"?: boolean;
  "paymentFrequency"?: string;
  "expiryDate"?: Date;
  "grassroots"?: boolean;
  "isChatEnabled"?: boolean;
  "type"?: string;
  "customDashboardUrl"?: string;
  "id"?: any;
  teams?: Team[];
  customers?: Customer[];
  players?: Player[];
  playerScoutings?: PlayerScouting[];
  customerPlayers?: CustomerPlayer[];
  staff?: Staff[];
  clubTransfers?: ClubTransfer[];
  clubSeasons?: ClubSeason[];
  agents?: Agent[];
}

export class Club implements ClubInterface {
  "name": string;
  "crest": string;
  "demo": boolean;
  "foundation": Date;
  "nation": string;
  "region": string;
  "professionalStatus": string;
  "currency": string;
  "taxes": number;
  "vat": number;
  "freemium": boolean;
  "freemiumUsers": number;
  "directorApp": boolean;
  "nationalClub": boolean;
  "sportType": string;
  "scoutingSettings": any;
  "active": boolean;
  "atcCommercialNamesMapping": any;
  "landingPage": string;
  "coachingApp": boolean;
  "b2cScouting": boolean;
  "paymentFrequency": string;
  "expiryDate": Date;
  "grassroots": boolean;
  "isChatEnabled": boolean;
  "type": string;
  "customDashboardUrl": string;
  "id": any;
  teams: Team[];
  customers: Customer[];
  players: Player[];
  playerScoutings: PlayerScouting[];
  customerPlayers: CustomerPlayer[];
  staff: Staff[];
  clubTransfers: ClubTransfer[];
  clubSeasons: ClubSeason[];
  agents: Agent[];
  constructor(data?: ClubInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Club`.
   */
  public static getModelName() {
    return "Club";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Club for dynamic purposes.
  **/
  public static factory(data: ClubInterface): Club{
    return new Club(data);
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
      name: 'Club',
      plural: 'Clubs',
      path: 'Clubs',
      idName: 'id',
      properties: {
        "name": {
          name: 'name',
          type: 'string'
        },
        "crest": {
          name: 'crest',
          type: 'string'
        },
        "demo": {
          name: 'demo',
          type: 'boolean'
        },
        "foundation": {
          name: 'foundation',
          type: 'Date'
        },
        "nation": {
          name: 'nation',
          type: 'string'
        },
        "region": {
          name: 'region',
          type: 'string'
        },
        "professionalStatus": {
          name: 'professionalStatus',
          type: 'string'
        },
        "currency": {
          name: 'currency',
          type: 'string',
          default: 'EUR'
        },
        "taxes": {
          name: 'taxes',
          type: 'number'
        },
        "vat": {
          name: 'vat',
          type: 'number'
        },
        "freemium": {
          name: 'freemium',
          type: 'boolean',
          default: false
        },
        "freemiumUsers": {
          name: 'freemiumUsers',
          type: 'number',
          default: 0
        },
        "directorApp": {
          name: 'directorApp',
          type: 'boolean',
          default: false
        },
        "nationalClub": {
          name: 'nationalClub',
          type: 'boolean',
          default: false
        },
        "sportType": {
          name: 'sportType',
          type: 'string',
          default: 'football'
        },
        "scoutingSettings": {
          name: 'scoutingSettings',
          type: 'any',
          default: <any>null
        },
        "active": {
          name: 'active',
          type: 'boolean',
          default: true
        },
        "atcCommercialNamesMapping": {
          name: 'atcCommercialNamesMapping',
          type: 'any',
          default: <any>null
        },
        "landingPage": {
          name: 'landingPage',
          type: 'string'
        },
        "coachingApp": {
          name: 'coachingApp',
          type: 'boolean',
          default: false
        },
        "b2cScouting": {
          name: 'b2cScouting',
          type: 'boolean',
          default: false
        },
        "paymentFrequency": {
          name: 'paymentFrequency',
          type: 'string',
          default: 'year'
        },
        "expiryDate": {
          name: 'expiryDate',
          type: 'Date'
        },
        "grassroots": {
          name: 'grassroots',
          type: 'boolean',
          default: false
        },
        "isChatEnabled": {
          name: 'isChatEnabled',
          type: 'boolean',
          default: true
        },
        "type": {
          name: 'type',
          type: 'string',
          default: 'club'
        },
        "customDashboardUrl": {
          name: 'customDashboardUrl',
          type: 'string'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
      },
      relations: {
        teams: {
          name: 'teams',
          type: 'Team[]',
          model: 'Team',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'clubId'
        },
        customers: {
          name: 'customers',
          type: 'Customer[]',
          model: 'Customer',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'clubId'
        },
        players: {
          name: 'players',
          type: 'Player[]',
          model: 'Player',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'clubId'
        },
        playerScoutings: {
          name: 'playerScoutings',
          type: 'PlayerScouting[]',
          model: 'PlayerScouting',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'clubId'
        },
        customerPlayers: {
          name: 'customerPlayers',
          type: 'CustomerPlayer[]',
          model: 'CustomerPlayer',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'clubId'
        },
        staff: {
          name: 'staff',
          type: 'Staff[]',
          model: 'Staff',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'clubId'
        },
        clubTransfers: {
          name: 'clubTransfers',
          type: 'ClubTransfer[]',
          model: 'ClubTransfer',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'clubId'
        },
        clubSeasons: {
          name: 'clubSeasons',
          type: 'ClubSeason[]',
          model: 'ClubSeason',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'clubId'
        },
        agents: {
          name: 'agents',
          type: 'Agent[]',
          model: 'Agent',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'clubId'
        },
      }
    }
  }
}
