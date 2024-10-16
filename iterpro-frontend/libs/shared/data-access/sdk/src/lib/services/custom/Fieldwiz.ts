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
import { Fieldwiz } from '../../models/Fieldwiz';
import { SocketConnection } from '../../sockets/socket.connections';


/**
 * Api services for the `Fieldwiz` model.
 */
@Injectable()
export class FieldwizApi extends BaseLoopBackApi {

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
   * create an athlete profile on the Fieldwiz platform and should return the created user
   *
   * @param {object} data Request data.
   *
   *  - `teamId` – `{string}` - 
   *
   *  - `player` – `{object}` - 
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Fieldwiz` object.)
   * </em>
   */
  public createFieldwizAthlete(teamId: any = {}, player: any = {}, customHeaders?: Function): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Fieldwiz/createFieldwizAthlete";
    let _routeParams: any = {};
    let _postBody: any = {
      data: {
        teamId: teamId,
        player: player
      }
    };
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody, null, customHeaders);
    return result;
  }

  /**
   * The name of the model represented by this $resource,
   * i.e. `Fieldwiz`.
   */
  public getModelName() {
    return "Fieldwiz";
  }
}
