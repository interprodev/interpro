import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Optional } from '@angular/core';
import { IterproRoute, PermissionsService } from '@iterpro/shared/data-access/permissions';
import {
	BaseLoopBackApi,
	Customer,
	CustomerApi,
	ErrorHandler,
	LoopBackAuth,
	LoopBackConfig,
	SDKModels,
	SDKToken,
	SocketConnection,
	Team,
	TeamApi,
	TeamSeason
} from '@iterpro/shared/data-access/sdk';
import {
	BlockUiInterceptorService,
	NotificationService,
	ThirdPartiesIntegrationCheckService,
	getTeamSettings
} from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
	Credentials,
	Credentials2FA,
	CurrentTeam,
	GoogleAuthenticationResponse,
	UnknownToken
} from '../models/auth.interfaces';

interface RequestParams {
	routeParams?: any;
	urlParams?: any;
	postBody?: any;
}

@Injectable({
	providedIn: 'root'
})
export class AuthService extends BaseLoopBackApi {
	constructor(
		@Inject(HttpClient) protected http: HttpClient,
		@Inject(SocketConnection) protected connection: SocketConnection,
		@Inject(SDKModels) protected models: SDKModels,
		@Inject(LoopBackAuth) protected auth: LoopBackAuth,
		@Optional() @Inject(ErrorHandler) protected errorHandler: ErrorHandler,
		private teamApi: TeamApi,
		private customerApi: CustomerApi,
		private notificationService: NotificationService,
		private permissionsService: PermissionsService,
		private thirdPartyService: ThirdPartiesIntegrationCheckService,
		private blockUiInterceptorService: BlockUiInterceptorService
	) {
		super(http, connection, models, auth, errorHandler);
	}

	// to use the BaseLoopBackApi.request() method we don't need a model name	// sometimes a bit of luck happens :)
	getModelName() {
		return '';
	}

	public generateSecret(userId: string): Observable<GoogleAuthenticationResponse> {
		return this.blockUiInterceptorService.disableOnce(this.customerApi.generateSecret(userId));
	}

	public validateSecret(id: string, credentials: Credentials2FA): Observable<any> {
		return this.blockUiInterceptorService.disableOnce(this.customerApi.validateSecret(credentials));
	}

	public requestLogin(credentials: Credentials): Observable<UnknownToken> {
		this.deleteToken();
		return this.blockUiInterceptorService.disableOnce(this.customerApi.requestLogin(credentials));
	}

	public login(credentials: Credentials2FA): Observable<any> {
		return this.blockUiInterceptorService.disableOnce(this.customerApi.performLogin(credentials));
	}

	public logout(): Observable<any> {
		this.deleteToken();
		return this.blockUiInterceptorService.disableOnce(this.customerApi.performLogout());
	}

	public passwordRecovery(email: string): Observable<any> {
		return this.blockUiInterceptorService.disableOnce(this.customerApi.resetPasswordRequest(email));
	}

	public setToken(token: SDKToken) {
		this.auth.setToken(token);
	}

	public deleteToken() {
		this.notificationService.disconnect();
		this.deleteStorage();
	}

	public getCustomer(): Observable<any> {
		return this.blockUiInterceptorService.disableOnce(
			this.customerApi.getCurrent({
				include: ['teamSettings']
			})
		);
	}

	public getSasToken(clubId: string): Observable<any> {
		const params: RequestParams = {
			postBody: {
				data: {
					clubId
				}
			}
		};
		return this.blockUiInterceptorService.disableOnce(this.requestHttpPOST('/AzureStorage/sasToken', params));
	}

	public downloadTeam(teamId: string, teamSeasonId?: string): Observable<CurrentTeam> {
		return this.blockUiInterceptorService
			.disableOnce(this.teamApi.findById<Team>(teamId, { include: ['club', 'teamSeasons', 'tableFilterTemplates'] }))
			.pipe(
				map((team: Team) => {
					const season: TeamSeason =
						(teamSeasonId
							? team.teamSeasons.find(({ id }) => id === teamSeasonId)
							: team.teamSeasons.find(({ offseason, inseasonEnd }) =>
									moment().isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
								)) ?? new TeamSeason();
					return { team, season };
				})
			);
	}

	public getReturnUrl(currentTeam: CurrentTeam, activeRedirectUrl?: [IterproRoute, object?]): [IterproRoute, object?] {
		const team = currentTeam.team;
		const customer = this.auth.getCurrentUserData();
		const teamSettings = getTeamSettings(customer.teamSettings, team.id);
		const defaultLanding = this.getDefaultLandingPage(team, customer);
		let landing: IterproRoute = defaultLanding;
		if (activeRedirectUrl) {
			if (this.permissionsService.canAccessToRoute(activeRedirectUrl[0], team)) return activeRedirectUrl;
		}
		if (team && team.club && team.club.landingPage) landing = team.club.landingPage as IterproRoute;
		if (team && team.landingPage) landing = team.landingPage as IterproRoute;
		if (teamSettings && teamSettings.landingPage) landing = teamSettings.landingPage as IterproRoute;
		if (!this.permissionsService.canAccessToRoute(landing, team)) landing = defaultLanding;
		return [landing.replace('/home', '')] as [IterproRoute, object?];
	}

	private getDefaultLandingPage(team: Team, customer: Customer): IterproRoute {
		if (
			team &&
			(!this.thirdPartyService.hasAnyProviderTacticalIntegration(team) ||
				team.club.nationalClub ||
				(customer && customer.isTempPassword))
		)
			return '/settings';
		else return '/dashboards/standings';
	}

	private requestHttpGET(url: string, requestParams: RequestParams) {
		const request = this.normalizeRequestParams(requestParams);
		return this.request('GET', this.getUrl(url), request.routeParams, request.urlParams, request.postBody);
	}

	private requestHttpPOST(url: string, requestParams: RequestParams) {
		const request = this.normalizeRequestParams(requestParams);
		return this.request('POST', this.getUrl(url), request.routeParams, request.urlParams, request.postBody);
	}

	private getUrl(url: string): string {
		return LoopBackConfig.getPath() + '/' + LoopBackConfig.getApiVersion() + url;
	}

	private normalizeRequestParams(requestParams: RequestParams) {
		const defaultRequest: RequestParams = { routeParams: {}, urlParams: {}, postBody: {} };
		return { ...defaultRequest, ...requestParams };
	}

	private deleteStorage() {
		localStorage.clear();
	}
}
