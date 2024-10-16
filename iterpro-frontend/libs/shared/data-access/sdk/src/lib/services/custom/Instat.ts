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
import { Instat } from '../../models/Instat';
import { SocketConnection } from '../../sockets/socket.connections';


/**
 * Api services for the `Instat` model.
 */
@Injectable()
export class InstatApi extends BaseLoopBackApi {

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
   * @param {number} tournamentId 
   *
   * @param {number} seasonId 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public getStandingsLeaderboard(tournamentId: any = {}, seasonId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "GET";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/standings-leaderboard";
    let _routeParams: any = {};
    let _postBody: any = {};
    let _urlParams: any = {};
    if (typeof tournamentId !== 'undefined' && tournamentId !== null) _urlParams.tournamentId = tournamentId;
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
   * @param {number} tournamentId 
   *
   * @param {number} seasonId 
   *
   * @returns {object[]} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public getStandingsMatchList(teamId: any = {}, tournamentId: any = {}, seasonId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "GET";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/standings-match-list";
    let _routeParams: any = {};
    let _postBody: any = {};
    let _urlParams: any = {};
    if (typeof teamId !== 'undefined' && teamId !== null) _urlParams.teamId = teamId;
    if (typeof tournamentId !== 'undefined' && tournamentId !== null) _urlParams.tournamentId = tournamentId;
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
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public getStandingsMatchStats(matchId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "GET";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/standings-match-stats";
    let _routeParams: any = {};
    let _postBody: any = {};
    let _urlParams: any = {};
    if (typeof matchId !== 'undefined' && matchId !== null) _urlParams.matchId = matchId;
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
   *  - `instatTeamId` – `{number}` - 
   *
   *  - `instatCompetitionId` – `{number}` - 
   *
   *  - `instatSeasonId` – `{number}` - 
   *
   *  - `dateStart` – `{any}` - 
   *
   *  - `dateEnd` – `{any}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public dashboard(teamId: any = {}, instatTeamId: any = {}, instatCompetitionId: any = {}, instatSeasonId: any = {}, dateStart: any = {}, dateEnd: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/dashboard";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        teamId: teamId,
        instatTeamId: instatTeamId,
        instatCompetitionId: instatCompetitionId,
        instatSeasonId: instatSeasonId,
        dateStart: dateStart,
        dateEnd: dateEnd
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
   *  - `instatMatchId` – `{number}` - 
   *
   *  - `instatTeamId1` – `{number}` - 
   *
   *  - `instatTeamId2` – `{number}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public dashboardSingleTeamStat(instatMatchId: any = {}, instatTeamId1: any = {}, instatTeamId2: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/dashboardSingleTeamStat";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        instatMatchId: instatMatchId,
        instatTeamId1: instatTeamId1,
        instatTeamId2: instatTeamId2
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
   *  - `instatMatchId` – `{number}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public singleTeamStat(instatMatchId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/singleTeamStat";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        instatMatchId: instatMatchId
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
   *  - `instatMatchId` – `{number}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public singleTeamStatWithPlayers(instatMatchId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/singleTeamStatWithPlayers";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        instatMatchId: instatMatchId
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
   *  - `instatMatchId` – `{number}` - 
   *
   *  - `playersInstIds` – `{any}` - 
   *
   *  - `substitutions` – `{object}` - 
   *
   * @returns {object[]} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public gamePlayerStats(instatMatchId: any = {}, playersInstIds: any = {}, substitutions: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/gamePlayerStats";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        instatMatchId: instatMatchId,
        playersInstIds: playersInstIds,
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
   *  - `competitionId` – `{number}` - 
   *
   *  - `date` – `{date}` - 
   *
   * @returns {object[]} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public matchesForSeason(seasonId: any = {}, competitionId: any = {}, date: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/matchesForSeason";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        seasonId: seasonId,
        competitionId: competitionId,
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
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public squadSeasonPlayers(squadIds: any = {}, seasonId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/squadSeasonPlayers";
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
   *  - `instatCompetitionId` – `{number}` - 
   *
   *  - `seasonId` – `{any}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public instatCompetitionTeams(instatCompetitionId: any = {}, seasonId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/instatCompetitionTeams";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        instatCompetitionId: instatCompetitionId,
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
   *  - `instatId` – `{number}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public careerTransfers(instatId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/careerTransfers";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        instatId: instatId
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
   *  - `req` – `{object}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public teamSearch(query: any = {}, competitionIds: any = {}, req: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/teamSearch";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        query: query,
        competitionIds: competitionIds
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
   *  - `nationalities` – `{any}` - 
   *
   *  - `competitionIds` – `{any}` - 
   *
   *  - `ageMin` – `{number}` - 
   *
   *  - `ageMax` – `{number}` - 
   *
   *  - `positions` – `{any}` - 
   *
   *  - `gender` – `{string}` - 
   *
   *  - `req` – `{object}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public searchPlayers(query: any = {}, nationalities: any = {}, competitionIds: any = {}, ageMin: any = {}, ageMax: any = {}, positions: any = {}, gender: any = {}, req: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/playerSearch";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        query: query,
        nationalities: nationalities,
        competitionIds: competitionIds,
        ageMin: ageMin,
        ageMax: ageMax,
        positions: positions,
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
   * @param {object} data Request data.
   *
   *  - `playerInstatIds` – `{any}` - 
   *
   * @returns {object[]} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public playerImage(playerInstatIds: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/playerImage";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        playerInstatIds: playerInstatIds
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
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public playerSearchFilters(customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/playerSearchFilters";
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
   *  - `playerInstattIds` – `{any}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public playerSearchAdditionalInfo(playerInstattIds: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/playerSearchAdditionalInfo";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        playerInstattIds: playerInstattIds
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
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public seasonsForCompetitions(teamId: any = {}, competitionsIds: any = {}, date: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/seasonsForCompetitions";
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
   *  - `competitionId` – `{number}` - 
   *
   *  - `seasonId` – `{number}` - 
   *
   * @returns {object[]} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public getCurrentSeasonMatches(playerId: any = {}, competitionId: any = {}, seasonId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/getCurrentSeasonMatches";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        playerId: playerId,
        competitionId: competitionId,
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
   *  - `team` – `{string}` - 
   *
   *  - `byId` – `{boolean}` - 
   *
   *  - `competitionId` – `{number}` - 
   *
   * @returns {object[]} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public searchTeam(team: any = {}, byId: any = {}, competitionId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/searchTeam";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        team: team,
        byId: byId,
        competitionId: competitionId
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
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public getTeamWithImage(teamId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/getTeamWithImage";
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
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public getSecondaryTeamInfo(teamId: any = {}, playerIds: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/getSecondaryTeamInfo";
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
   * @param {object} data Request data.
   *
   *  - `teamId` – `{number}` - 
   *
   *  - `date` – `{date}` - 
   *
   * @returns {object[]} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public getMatchesForTeam(teamId: any = {}, date: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/getMatchesForTeam";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        teamId: teamId,
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
   *  - `teamId` – `{number}` - 
   *
   * @returns {object[]} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Instat` object.)
   * </em>
   */
  public getTeamsCompetitions(teamId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Instat/getTeamsCompetitions";
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
   * The name of the model represented by this $resource,
   * i.e. `Instat`.
   */
  public getModelName() {
    return "Instat";
  }
}
