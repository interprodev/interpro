/* tslint:disable */
import {
  Team,
  TeamSeason
} from '../index';

declare var Object: any;
export interface TeamGroupInterface {
  "name": string;
  "players"?: Array<any>;
  "id"?: any;
  "teamId"?: any;
  "teamSeasonId"?: any;
  team?: Team;
  teamSeason?: TeamSeason;
}

export class TeamGroup implements TeamGroupInterface {
  "name": string;
  "players": Array<any>;
  "id": any;
  "teamId": any;
  "teamSeasonId": any;
  team: Team;
  teamSeason: TeamSeason;
  constructor(data?: TeamGroupInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `TeamGroup`.
   */
  public static getModelName() {
    return "TeamGroup";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of TeamGroup for dynamic purposes.
  **/
  public static factory(data: TeamGroupInterface): TeamGroup{
    return new TeamGroup(data);
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
      name: 'TeamGroup',
      plural: 'TeamGroups',
      path: 'TeamGroups',
      idName: 'id',
      properties: {
        "name": {
          name: 'name',
          type: 'string'
        },
        "players": {
          name: 'players',
          type: 'Array&lt;any&gt;'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "teamId": {
          name: 'teamId',
          type: 'any'
        },
        "teamSeasonId": {
          name: 'teamSeasonId',
          type: 'any'
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
