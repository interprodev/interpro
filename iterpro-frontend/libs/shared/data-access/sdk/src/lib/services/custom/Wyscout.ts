/* tslint:disable */
import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { SDKModels } from './SDKModels';
import { BaseLoopBackApi } from '../core/base.service';
import { LoopBackConfig } from '../../lb.config';
import { LoopBackAuth } from '../core/auth.service';
import { LoopBackFilter,  } from '../../models/BaseModels';
import { ErrorHandler } from '../core/error.service';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Wyscout } from '../../models/Wyscout';
import { SocketConnection } from '../../sockets/socket.connections';


/**
 * Api services for the `Wyscout` model.
 */
@Injectable()
export class WyscoutApi extends BaseLoopBackApi {

  constructor(
    @Inject(HttpClient) protected http: HttpClient,
    @Inject(SocketConnection) protected connection: SocketConnection,
    @Inject(SDKModels) protected models: SDKModels,
    @Inject(LoopBackAuth) protected auth: LoopBackAuth,
    @Optional() @Inject(ErrorHandler) protected errorHandler: ErrorHandler
  ) {
    super(http,  connection,  models, auth, errorHandler);
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {object} data Request data.
   *
   *  - `teamId` – `{string}` - 
   *
   *  - `wyscoutTeamId` – `{number}` - 
   *
   *  - `wyscoutCompetitionId` – `{number}` - 
   *
   *  - `wyscoutSeasonId` – `{number}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public dashboard(teamId: any = {}, wyscoutTeamId: any = {}, wyscoutCompetitionId: any = {}, wyscoutSeasonId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/dashboard";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        teamId: teamId,
        wyscoutTeamId: wyscoutTeamId,
        wyscoutCompetitionId: wyscoutCompetitionId,
        wyscoutSeasonId: wyscoutSeasonId
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {object} data Request data.
   *
   *  - `wyscoutMatchId` – `{number}` - 
   *
   *  - `wyscoutTeamId1` – `{number}` - 
   *
   *  - `wyscoutTeamId2` – `{number}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public dashboardSingleTeamStat(wyscoutMatchId: any = {}, wyscoutTeamId1: any = {}, wyscoutTeamId2: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/dashboardSingleTeamStat";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        wyscoutMatchId: wyscoutMatchId,
        wyscoutTeamId1: wyscoutTeamId1,
        wyscoutTeamId2: wyscoutTeamId2
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {object} data Request data.
   *
   *  - `wyscoutMatchId` – `{number}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public singleTeamStat(wyscoutMatchId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/singleTeamStat";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        wyscoutMatchId: wyscoutMatchId
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {object} data Request data.
   *
   *  - `wyscoutMatchId` – `{number}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public singleTeamStatWithPlayers(wyscoutMatchId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/singleTeamStatWithPlayers";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        wyscoutMatchId: wyscoutMatchId
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {object} data Request data.
   *
   *  - `wyscoutMatchId` – `{number}` - 
   *
   *  - `playersWyIds` – `{any}` - 
   *
   *  - `substitutions` – `{object}` - 
   *
   * @returns {object[]} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public gamePlayerStats(wyscoutMatchId: any = {}, playersWyIds: any = {}, substitutions: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/gamePlayerStats";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        wyscoutMatchId: wyscoutMatchId,
        playersWyIds: playersWyIds,
        substitutions: substitutions
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {object} data Request data.
   *
   *  - `seasonId` – `{number}` - 
   *
   *  - `date` – `{date}` - 
   *
   * @returns {object[]} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public matchesForSeason(seasonId: any = {}, date: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/matchesForSeason";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        seasonId: seasonId,
        date: date
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {object} data Request data.
   *
   *  - `squadIds` – `{any}` - 
   *
   *  - `seasonId` – `{number}` - 
   *
   * @returns {object[]} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public squadSeasonPlayers(squadIds: any = {}, seasonId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/squadSeasonPlayers";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        squadIds: squadIds,
        seasonId: seasonId
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {object} data Request data.
   *
   *  - `wyscoutCompetitionId` – `{number}` - 
   *
   *  - `teamId` – `{string}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public wyscoutCompetitionTeams(wyscoutCompetitionId: any = {}, teamId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/wyscoutCompetitionTeams";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        wyscoutCompetitionId: wyscoutCompetitionId,
        teamId: teamId
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {object} data Request data.
   *
   *  - `wyscoutId` – `{number}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public careerTransfers(wyscoutId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/careerTransfers";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        wyscoutId: wyscoutId
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {object} data Request data.
   *
   *  - `query` – `{string}` - 
   *
   *  - `competitionIds` – `{any}` - 
   *
   *  - `gender` – `{any}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public teamSearch(query: any = {}, competitionIds: any = {}, gender: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/teamSearch";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        query: query,
        competitionIds: competitionIds,
        gender: gender
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {string} playerName 
   *
   * @param {any} competitions 
   *
   * @param {any} nationalities 
   *
   * @param {number} ageMin 
   *
   * @param {number} ageMax 
   *
   * @param {any} positions 
   *
   * @param {string} gender 
   *
   * @returns {object[]} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public searchPlayers(playerName: any = {}, competitions: any = {}, nationalities: any = {}, ageMin: any = {}, ageMax: any = {}, positions: any = {}, gender: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "GET";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/searchPlayers";
    let _routeParams: any = {};
    let _postBody: any = {};
    let _urlParams: any = {};
    if (typeof playerName !== 'undefined' && playerName !== null) _urlParams.playerName = playerName;
    if (typeof competitions !== 'undefined' && competitions !== null) _urlParams.competitions = competitions;
    if (typeof nationalities !== 'undefined' && nationalities !== null) _urlParams.nationalities = nationalities;
    if (typeof ageMin !== 'undefined' && ageMin !== null) _urlParams.ageMin = ageMin;
    if (typeof ageMax !== 'undefined' && ageMax !== null) _urlParams.ageMax = ageMax;
    if (typeof positions !== 'undefined' && positions !== null) _urlParams.positions = positions;
    if (typeof gender !== 'undefined' && gender !== null) _urlParams.gender = gender;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {object} data Request data.
   *
   *  - `playerWyscoutIds` – `{any}` - 
   *
   * @returns {object[]} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public playerImage(playerWyscoutIds: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/playerImage";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        playerWyscoutIds: playerWyscoutIds
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {object} data Request data.
   *
   * This method does not accept any data. Supply an empty object.
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public playerSearchFilters(customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/playerSearchFilters";
    let _routeParams: any = {};
    let _postBody: any = {};
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {object} data Request data.
   *
   *  - `playerWyscoutIds` – `{any}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public playerSearchAdditionalInfo(playerWyscoutIds: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/playerSearchAdditionalInfo";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        playerWyscoutIds: playerWyscoutIds
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {object} data Request data.
   *
   *  - `teamId` – `{string}` - 
   *
   *  - `competitionsIds` – `{any}` - 
   *
   *  - `date` – `{any}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public seasonsForCompetitions(teamId: any = {}, competitionsIds: any = {}, date: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/seasonsForCompetitions";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        teamId: teamId,
        competitionsIds: competitionsIds,
        date: date
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {object} data Request data.
   *
   *  - `playerId` – `{number}` - 
   *
   *  - `from` – `{date}` - 
   *
   *  - `to` – `{date}` - 
   *
   * @returns {object[]} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public getCurrentSeasonMatches(playerId: any = {}, from: any = {}, to: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/getCurrentSeasonMatches";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        playerId: playerId,
        from: from,
        to: to
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {object} data Request data.
   *
   *  - `playerId` – `{number}` - 
   *
   *  - `from` – `{date}` - 
   *
   *  - `to` – `{object}` - 
   *
   * @returns {object[]} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public getPlayerNextGames(playerId: any = {}, from: any = {}, to: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/getPlayerNextGames";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        playerId: playerId,
        from: from,
        to: to
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {object} data Request data.
   *
   *  - `team` – `{string}` - 
   *
   *  - `byId` – `{boolean}` - 
   *
   * @returns {object[]} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public searchTeam(team: any = {}, byId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/searchTeam";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        team: team,
        byId: byId
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {object} data Request data.
   *
   *  - `teamId` – `{string}` - 
   *
   * @returns {object[]} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public getTeamWithImage(teamId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/getTeamWithImage";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        teamId: teamId
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {object} data Request data.
   *
   *  - `teamId` – `{string}` - 
   *
   *  - `playerIds` – `{any}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public getSecondaryTeamInfo(teamId: any = {}, playerIds: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/getSecondaryTeamInfo";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        teamId: teamId,
        playerIds: playerIds
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {number} seasonId 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public getStandingsLeaderboard(seasonId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "GET";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/standings-leaderboard";
    let _routeParams: any = {};
    let _postBody: any = {};
    let _urlParams: any = {};
    if (typeof seasonId !== 'undefined' && seasonId !== null) _urlParams.seasonId = seasonId;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {number} teamId 
   *
   * @param {number} seasonId 
   *
   * @returns {object[]} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public getStandingsMatchList(teamId: any = {}, seasonId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "GET";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/standings-match-list";
    let _routeParams: any = {};
    let _postBody: any = {};
    let _urlParams: any = {};
    if (typeof teamId !== 'undefined' && teamId !== null) _urlParams.teamId = teamId;
    if (typeof seasonId !== 'undefined' && seasonId !== null) _urlParams.seasonId = seasonId;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * <em>
         * (The remote method definition does not provide any description.)
         * </em>
   *
   * @param {number} matchId 
   *
   * @param {object} req 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Wyscout` object.)
   * </em>
   */
  public getStandingsMatchStats(matchId: any = {}, req: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "GET";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Wyscout/standings-match-stats";
    let _routeParams: any = {};
    let _postBody: any = {};
    let _urlParams: any = {};
    if (typeof matchId !== 'undefined' && matchId !== null) _urlParams.matchId = matchId;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * The name of the model represented by this $resource,
   * i.e. `Wyscout`.
   */
  public getModelName() {
    return "Wyscout";
  }
}
