/* tslint:disable */
import {
  Team,
  Player,
  TeamGroup,
  Threshold,
  Staff,
  ClubSeason
} from '../index';

declare var Object: any;
export interface TeamSeasonInterface {
  "name": string;
  "offseason"?: Date;
  "preseason"?: Date;
  "inseasonStart"?: Date;
  "inseasonEnd"?: Date;
  "competitionInfo"?: any;
  "resync"?: boolean;
  "wyscoutStandingTeamsFilter"?: any;
  "instatStandingTeamsFilter"?: any;
  "wyscoutAreas"?: any;
  "instatAreas"?: any;
  "wyscoutNationalLeague"?: any;
  "instatNationalLeague"?: any;
  "wyscoutNationalCup"?: any;
  "instatNationalCup"?: any;
  "wyscoutTournamentQualifiers"?: any;
  "instatTournamentQualifiers"?: any;
  "wyscoutTournamentFinalStages"?: any;
  "instatTournamentFinalStages"?: any;
  "thirdPartyCredentials"?: any;
  "id"?: any;
  "teamId"?: any;
  "playerIds"?: Array<any>;
  "teamGroupIds"?: Array<any>;
  "_thresholdsTeam"?: Array<any>;
  "staffIds"?: Array<any>;
  "clubSeasonId"?: any;
  team?: Team;
  players?: Player[];
  groups?: TeamGroup[];
  thresholdsTeam?: Threshold[];
  staffs?: Staff[];
  clubSeason?: ClubSeason;
}

export class TeamSeason implements TeamSeasonInterface {
  "name": string;
  "offseason": Date;
  "preseason": Date;
  "inseasonStart": Date;
  "inseasonEnd": Date;
  "competitionInfo": any;
  "resync": boolean;
  "wyscoutStandingTeamsFilter": any;
  "instatStandingTeamsFilter": any;
  "wyscoutAreas": any;
  "instatAreas": any;
  "wyscoutNationalLeague": any;
  "instatNationalLeague": any;
  "wyscoutNationalCup": any;
  "instatNationalCup": any;
  "wyscoutTournamentQualifiers": any;
  "instatTournamentQualifiers": any;
  "wyscoutTournamentFinalStages": any;
  "instatTournamentFinalStages": any;
  "thirdPartyCredentials": any;
  "id": any;
  "teamId": any;
  "playerIds": Array<any>;
  "teamGroupIds": Array<any>;
  "_thresholdsTeam": Array<any>;
  "staffIds": Array<any>;
  "clubSeasonId": any;
  team: Team;
  players: Player[];
  groups: TeamGroup[];
  thresholdsTeam: Threshold[];
  staffs: Staff[];
  clubSeason: ClubSeason;
  constructor(data?: TeamSeasonInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `TeamSeason`.
   */
  public static getModelName() {
    return "TeamSeason";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of TeamSeason for dynamic purposes.
  **/
  public static factory(data: TeamSeasonInterface): TeamSeason{
    return new TeamSeason(data);
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
      name: 'TeamSeason',
      plural: 'TeamSeasons',
      path: 'TeamSeasons',
      idName: 'id',
      properties: {
        "name": {
          name: 'name',
          type: 'string'
        },
        "offseason": {
          name: 'offseason',
          type: 'Date'
        },
        "preseason": {
          name: 'preseason',
          type: 'Date'
        },
        "inseasonStart": {
          name: 'inseasonStart',
          type: 'Date'
        },
        "inseasonEnd": {
          name: 'inseasonEnd',
          type: 'Date'
        },
        "competitionInfo": {
          name: 'competitionInfo',
          type: 'any'
        },
        "resync": {
          name: 'resync',
          type: 'boolean',
          default: false
        },
        "wyscoutStandingTeamsFilter": {
          name: 'wyscoutStandingTeamsFilter',
          type: 'any'
        },
        "instatStandingTeamsFilter": {
          name: 'instatStandingTeamsFilter',
          type: 'any'
        },
        "wyscoutAreas": {
          name: 'wyscoutAreas',
          type: 'any'
        },
        "instatAreas": {
          name: 'instatAreas',
          type: 'any'
        },
        "wyscoutNationalLeague": {
          name: 'wyscoutNationalLeague',
          type: 'any'
        },
        "instatNationalLeague": {
          name: 'instatNationalLeague',
          type: 'any'
        },
        "wyscoutNationalCup": {
          name: 'wyscoutNationalCup',
          type: 'any'
        },
        "instatNationalCup": {
          name: 'instatNationalCup',
          type: 'any'
        },
        "wyscoutTournamentQualifiers": {
          name: 'wyscoutTournamentQualifiers',
          type: 'any'
        },
        "instatTournamentQualifiers": {
          name: 'instatTournamentQualifiers',
          type: 'any'
        },
        "wyscoutTournamentFinalStages": {
          name: 'wyscoutTournamentFinalStages',
          type: 'any'
        },
        "instatTournamentFinalStages": {
          name: 'instatTournamentFinalStages',
          type: 'any'
        },
        "thirdPartyCredentials": {
          name: 'thirdPartyCredentials',
          type: 'any'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "teamId": {
          name: 'teamId',
          type: 'any'
        },
        "playerIds": {
          name: 'playerIds',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "teamGroupIds": {
          name: 'teamGroupIds',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_thresholdsTeam": {
          name: '_thresholdsTeam',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "staffIds": {
          name: 'staffIds',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "clubSeasonId": {
          name: 'clubSeasonId',
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
        players: {
          name: 'players',
          type: 'Player[]',
          model: 'Player',
          relationType: 'referencesMany',
                  keyFrom: 'playerIds',
          keyTo: 'id'
        },
        groups: {
          name: 'groups',
          type: 'TeamGroup[]',
          model: 'TeamGroup',
          relationType: 'referencesMany',
                  keyFrom: 'teamGroupIds',
          keyTo: 'id'
        },
        thresholdsTeam: {
          name: 'thresholdsTeam',
          type: 'Threshold[]',
          model: 'Threshold',
          relationType: 'embedsMany',
                  keyFrom: '_thresholdsTeam',
          keyTo: 'id'
        },
        staffs: {
          name: 'staffs',
          type: 'Staff[]',
          model: 'Staff',
          relationType: 'referencesMany',
                  keyFrom: 'staffIds',
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
      }
    }
  }
}
