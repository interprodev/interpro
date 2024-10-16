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
import { SessionsStats } from '../../models/SessionsStats';
import { SocketConnection } from '../../sockets/socket.connections';


/**
 * Api services for the `SessionsStats` model.
 */
@Injectable()
export class SessionsStatsApi extends BaseLoopBackApi {

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
   * @param {string} teamId 
   *
   * @param {any} playerIds 
   *
   * @param {date} dateFrom 
   *
   * @param {date} dateTo 
   *
   * @param {any} metrics 
   *
   * @param {string} groupingBy 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `SessionsStats` object.)
   * </em>
   */
  public getAdvancedData(teamId: any = {}, playerIds: any = {}, dateFrom: any = {}, dateTo: any = {}, metrics: any = {}, groupingBy: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "GET";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/SessionsStats/advanced-data";
    let _routeParams: any = {};
    let _postBody: any = {};
    let _urlParams: any = {};
    if (typeof teamId !== 'undefined' && teamId !== null) _urlParams.teamId = teamId;
    if (typeof playerIds !== 'undefined' && playerIds !== null) _urlParams.playerIds = playerIds;
    if (typeof dateFrom !== 'undefined' && dateFrom !== null) _urlParams.dateFrom = dateFrom;
    if (typeof dateTo !== 'undefined' && dateTo !== null) _urlParams.dateTo = dateTo;
    if (typeof metrics !== 'undefined' && metrics !== null) _urlParams.metrics = metrics;
    if (typeof groupingBy !== 'undefined' && groupingBy !== null) _urlParams.groupingBy = groupingBy;
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
   *  - `playerIds` – `{any}` - 
   *
   *  - `activeMetrics` – `{any}` - 
   *
   *  - `splits` – `{any}` - 
   *
   *  - `timezoneOffset` – `{number}` - 
   *
   *  - `res` – `{object}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `SessionsStats` object.)
   * </em>
   */
  public periodCsv(teamId: any = {}, dateFrom: any = {}, dateTo: any = {}, playerIds: any = {}, activeMetrics: any = {}, splits: any = {}, timezoneOffset: any = {}, res: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/SessionsStats/periodCsv";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        teamId: teamId,
        dateFrom: dateFrom,
        dateTo: dateTo,
        playerIds: playerIds,
        activeMetrics: activeMetrics,
        splits: splits,
        timezoneOffset: timezoneOffset
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
   *  - `groups` – `{any}` - 
   *
   *  - `dateFrom` – `{date}` - 
   *
   *  - `dateTo` – `{date}` - 
   *
   *  - `metricsGps` – `{any}` - 
   *
   *  - `splits` – `{any}` - 
   *
   *  - `modified` – `{number}` - 
   *
   *  - `individual` – `{number}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `SessionsStats` object.)
   * </em>
   */
  public sessionsPeriodTotal(teamId: any = {}, groups: any = {}, dateFrom: any = {}, dateTo: any = {}, metricsGps: any = {}, splits: any = {}, modified: any = {}, individual: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/SessionsStats/sessionsPeriodTotal";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        teamId: teamId,
        groups: groups,
        dateFrom: dateFrom,
        dateTo: dateTo,
        metricsGps: metricsGps,
        splits: splits,
        modified: modified,
        individual: individual
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
   *  - `groups` – `{any}` - 
   *
   *  - `dateFrom` – `{date}` - 
   *
   *  - `dateTo` – `{date}` - 
   *
   *  - `metricsGps` – `{any}` - 
   *
   *  - `splits` – `{any}` - 
   *
   *  - `modified` – `{number}` - 
   *
   *  - `individual` – `{number}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `SessionsStats` object.)
   * </em>
   */
  public sessionsPeriodTrend(teamId: any = {}, playerIds: any = {}, groups: any = {}, dateFrom: any = {}, dateTo: any = {}, metricsGps: any = {}, splits: any = {}, modified: any = {}, individual: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/SessionsStats/sessionsPeriodTrend";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        teamId: teamId,
        playerIds: playerIds,
        groups: groups,
        dateFrom: dateFrom,
        dateTo: dateTo,
        metricsGps: metricsGps,
        splits: splits,
        modified: modified,
        individual: individual
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
   *  - `dateFrom` – `{date}` - 
   *
   *  - `dateTo` – `{date}` - 
   *
   *  - `modified` – `{number}` - 
   *
   *  - `individual` – `{number}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `SessionsStats` object.)
   * </em>
   */
  public workloadAnalysisPeriod(teamId: any = {}, playerIds: any = {}, dateFrom: any = {}, dateTo: any = {}, modified: any = {}, individual: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/SessionsStats/workloadAnalysisPeriod";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        teamId: teamId,
        playerIds: playerIds,
        dateFrom: dateFrom,
        dateTo: dateTo,
        modified: modified,
        individual: individual
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * The name of the model represented by this $resource,
   * i.e. `SessionsStats`.
   */
  public getModelName() {
    return "SessionsStats";
  }
}
