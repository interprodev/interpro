/* tslint:disable */
import {
  TeamStat,
  Team,
  PlayerStat,
  TacticsData,
  Event,
  TeamSeason
} from '../index';

declare var Object: any;
export interface MatchInterface {
  "date": Date;
  "opponent"?: string;
  "home"?: boolean;
  "result"?: string;
  "resultFlag"?: boolean;
  "id"?: any;
  "_teamStat"?: any;
  "teamId"?: any;
  "_playerStats"?: Array<any>;
  "_offensive"?: any;
  "_defensive"?: any;
  "eventId"?: any;
  "teamSeasonId"?: any;
  teamStat?: TeamStat[];
  team?: Team;
  playerStats?: PlayerStat[];
  offensive?: TacticsData[];
  defensive?: TacticsData[];
  event?: Event;
  teamSeason?: TeamSeason;
}

export class Match implements MatchInterface {
  "date": Date;
  "opponent": string;
  "home": boolean;
  "result": string;
  "resultFlag": boolean;
  "id": any;
  "_teamStat": any;
  "teamId": any;
  "_playerStats": Array<any>;
  "_offensive": any;
  "_defensive": any;
  "eventId": any;
  "teamSeasonId": any;
  teamStat: TeamStat[];
  team: Team;
  playerStats: PlayerStat[];
  offensive: TacticsData[];
  defensive: TacticsData[];
  event: Event;
  teamSeason: TeamSeason;
  constructor(data?: MatchInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Match`.
   */
  public static getModelName() {
    return "Match";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Match for dynamic purposes.
  **/
  public static factory(data: MatchInterface): Match{
    return new Match(data);
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
      name: 'Match',
      plural: 'Matches',
      path: 'Matches',
      idName: 'id',
      properties: {
        "date": {
          name: 'date',
          type: 'Date'
        },
        "opponent": {
          name: 'opponent',
          type: 'string'
        },
        "home": {
          name: 'home',
          type: 'boolean'
        },
        "result": {
          name: 'result',
          type: 'string'
        },
        "resultFlag": {
          name: 'resultFlag',
          type: 'boolean'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "_teamStat": {
          name: '_teamStat',
          type: 'any'
        },
        "teamId": {
          name: 'teamId',
          type: 'any'
        },
        "_playerStats": {
          name: '_playerStats',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_offensive": {
          name: '_offensive',
          type: 'any'
        },
        "_defensive": {
          name: '_defensive',
          type: 'any'
        },
        "eventId": {
          name: 'eventId',
          type: 'any'
        },
        "teamSeasonId": {
          name: 'teamSeasonId',
          type: 'any'
        },
      },
      relations: {
        teamStat: {
          name: 'teamStat',
          type: 'TeamStat[]',
          model: 'TeamStat',
          relationType: 'embedsOne',
                  keyFrom: '_teamStat',
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
        playerStats: {
          name: 'playerStats',
          type: 'PlayerStat[]',
          model: 'PlayerStat',
          relationType: 'embedsMany',
                  keyFrom: '_playerStats',
          keyTo: 'id'
        },
        offensive: {
          name: 'offensive',
          type: 'TacticsData[]',
          model: 'TacticsData',
          relationType: 'embedsOne',
                  keyFrom: '_offensive',
          keyTo: 'id'
        },
        defensive: {
          name: 'defensive',
          type: 'TacticsData[]',
          model: 'TacticsData',
          relationType: 'embedsOne',
                  keyFrom: '_defensive',
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
        teamSeason: {
          name: 'teamSeason',
          type: 'TeamSeason',
          model: 'TeamSeason',
          relationType: 'belongsTo',
                  keyFrom: 'teamSeasonId',
          keyTo: 'id'
        },
      }
    }
  }
}
