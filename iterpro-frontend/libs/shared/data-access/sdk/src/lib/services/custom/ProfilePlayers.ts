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
import { ProfilePlayers } from '../../models/ProfilePlayers';
import { SocketConnection } from '../../sockets/socket.connections';


/**
 * Api services for the `ProfilePlayers` model.
 */
@Injectable()
export class ProfilePlayersApi extends BaseLoopBackApi {

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
   *  - `teamSeasonId` – `{string}` - 
   *
   *  - `playerId` – `{string}` - 
   *
   *  - `dateFrom` – `{date}` - 
   *
   *  - `dateTo` – `{date}` - 
   *
   *  - `testIds` – `{any}` - 
   *
   *  - `metricsSelected` – `{any}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `ProfilePlayers` object.)
   * </em>
   */
  public profileFitness(teamSeasonId: any = {}, playerId: any = {}, dateFrom: any = {}, dateTo: any = {}, testIds: any = {}, metricsSelected: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/ProfilePlayers/profileFitness";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        teamSeasonId: teamSeasonId,
        playerId: playerId,
        dateFrom: dateFrom,
        dateTo: dateTo,
        testIds: testIds,
        metricsSelected: metricsSelected
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
   *  - `teamSeasonId` – `{string}` - 
   *
   *  - `playerId` – `{string}` - 
   *
   *  - `dateFrom` – `{date}` - 
   *
   *  - `dateTo` – `{date}` - 
   *
   *  - `metricsPlayerStats` – `{any}` - 
   *
   *  - `isPrimaryTeam` – `{boolean}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `ProfilePlayers` object.)
   * </em>
   */
  public profileGameStats(teamSeasonId: any = {}, playerId: any = {}, dateFrom: any = {}, dateTo: any = {}, metricsPlayerStats: any = {}, isPrimaryTeam: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/ProfilePlayers/profileGameStats";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        teamSeasonId: teamSeasonId,
        playerId: playerId,
        dateFrom: dateFrom,
        dateTo: dateTo,
        metricsPlayerStats: metricsPlayerStats,
        isPrimaryTeam: isPrimaryTeam
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
   *  - `playerId` – `{string}` - 
   *
   *  - `testIds` – `{any}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `ProfilePlayers` object.)
   * </em>
   */
  public profileMaintenance(playerId: any = {}, testIds: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/ProfilePlayers/profileMaintenance";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        playerId: playerId,
        testIds: testIds
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
   *  - `teamSeasonId` – `{string}` - 
   *
   *  - `playerIds` – `{any}` - 
   *
   *  - `dateFrom` – `{date}` - 
   *
   *  - `dateTo` – `{date}` - 
   *
   *  - `minutesField` – `{string}` - 
   *
   *  - `individual` – `{number}` - 
   *
   *  - `teamId` – `{string}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `ProfilePlayers` object.)
   * </em>
   */
  public profileRobustness(teamSeasonId: any = {}, playerIds: any = {}, dateFrom: any = {}, dateTo: any = {}, minutesField: any = {}, individual: any, teamId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/ProfilePlayers/profileRobustness";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        teamSeasonId: teamSeasonId,
        playerIds: playerIds,
        dateFrom: dateFrom,
        dateTo: dateTo,
        minutesField: minutesField,
        individual: individual,
        teamId: teamId
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * The name of the model represented by this $resource,
   * i.e. `ProfilePlayers`.
   */
  public getModelName() {
    return "ProfilePlayers";
  }
}
