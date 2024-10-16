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
import { ComparePlayersStats } from '../../models/ComparePlayersStats';
import { SocketConnection } from '../../sockets/socket.connections';


/**
 * Api services for the `ComparePlayersStats` model.
 */
@Injectable()
export class ComparePlayersStatsApi extends BaseLoopBackApi {

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
   *  - `playerId` – `{string}` - 
   *
   *  - `dateFrom` – `{date}` - 
   *
   *  - `dateTo` – `{date}` - 
   *
   *  - `metricsGps` – `{any}` - 
   *
   *  - `metricsPlayerStats` – `{any}` - 
   *
   *  - `metricMinutes` – `{string}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `ComparePlayersStats` object.)
   * </em>
   */
  public comparePlayerStats(teamId: any = {}, playerId: any = {}, dateFrom: any = {}, dateTo: any = {}, metricsGps: any = {}, metricsPlayerStats: any = {}, metricMinutes: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/ComparePlayersStats/comparePlayerStats";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        teamId: teamId,
        playerId: playerId,
        dateFrom: dateFrom,
        dateTo: dateTo,
        metricsGps: metricsGps,
        metricsPlayerStats: metricsPlayerStats,
        metricMinutes: metricMinutes
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
   *  - `dateFrom` – `{date}` - 
   *
   *  - `dateTo` – `{date}` - 
   *
   *  - `metricsTeamStats` – `{any}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `ComparePlayersStats` object.)
   * </em>
   */
  public compareTeamStats(teamId: any = {}, dateFrom: any = {}, dateTo: any = {}, metricsTeamStats: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/ComparePlayersStats/compareTeamStats";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        teamId: teamId,
        dateFrom: dateFrom,
        dateTo: dateTo,
        metricsTeamStats: metricsTeamStats
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * The name of the model represented by this $resource,
   * i.e. `ComparePlayersStats`.
   */
  public getModelName() {
    return "ComparePlayersStats";
  }
}
