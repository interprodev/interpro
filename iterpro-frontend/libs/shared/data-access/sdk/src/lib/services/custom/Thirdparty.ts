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
import { Thirdparty } from '../../models/Thirdparty';
import { SocketConnection } from '../../sockets/socket.connections';


/**
 * Api services for the `Thirdparty` model.
 */
@Injectable()
export class ThirdpartyApi extends BaseLoopBackApi {

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
   * Get players IDs from one GPS third-party provider
   *
   * @param {string} teamId 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Thirdparty` object.)
   * </em>
   */
  public getGPSPlayers(teamId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "GET";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Thirdparties/getGPSPlayers";
    let _routeParams: any = {};
    let _postBody: any = {};
    let _urlParams: any = {};
    if (typeof teamId !== 'undefined' && teamId !== null) _urlParams.teamId = teamId;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * Get players IDs from one tactical third-party provider
   *
   * @param {string} teamId 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Thirdparty` object.)
   * </em>
   */
  public getTacticalPlayers(teamId: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "GET";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Thirdparties/getTacticalPlayers";
    let _routeParams: any = {};
    let _postBody: any = {};
    let _urlParams: any = {};
    if (typeof teamId !== 'undefined' && teamId !== null) _urlParams.teamId = teamId;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * Get GPS sessions from a third-party provider
   *
   * @param {string} teamId 
   *
   * @param {string} teamSeasonId 
   *
   * @param {DateString} date 
   *
   * @param {string} gdType 
   *
   * @param {object} req 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Thirdparty` object.)
   * </em>
   */
  public getThirdpartyGPSSessions(teamId: any = {}, teamSeasonId: any = {}, date: any = {}, gdType: any = {}, req: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "GET";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Thirdparties/getThirdpartyGPSSessions";
    let _routeParams: any = {};
    let _postBody: any = {};
    let _urlParams: any = {};
    if (typeof teamId !== 'undefined' && teamId !== null) _urlParams.teamId = teamId;
    if (typeof teamSeasonId !== 'undefined' && teamSeasonId !== null) _urlParams.teamSeasonId = teamSeasonId;
    if (typeof date !== 'undefined' && date !== null) _urlParams.date = date;
    if (typeof gdType !== 'undefined' && gdType !== null) _urlParams.gdType = gdType;
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
   *  - `playerArray` – `{any}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Thirdparty` object.)
   * </em>
   */
  public updateThirdpartyPlayerIds(playerArray: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Thirdparties/updateThirdpartyPlayerIds";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        playerArray: playerArray
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * The name of the model represented by this $resource,
   * i.e. `Thirdparty`.
   */
  public getModelName() {
    return "Thirdparty";
  }
}
