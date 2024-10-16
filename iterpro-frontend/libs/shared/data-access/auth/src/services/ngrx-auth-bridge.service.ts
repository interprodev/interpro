import { Injectable } from '@angular/core';
import { SDKToken } from '@iterpro/shared/data-access/sdk';
import { Store } from '@ngrx/store';
import { AuthActions, AuthSelectors, AuthState } from '../+state';
/**
 * @author Adriano Costa <email:adriano.costa@iterpro.com>
 * @class NgRxAuthBridgeService
 * @description
 * This service is used as a bridge between services/components and the ngrx part of the application
 * This service is declared in app.module.ts to be used instead of the original LoopBackAuth
 * The main difference is that this service doesn't save/load data itself because the ngrx store does it
 * To sync the token with the ngrx store a selector is present in the constructor:
 * everytime the token is updated in the store it will dispach the new value and the property updated accordingly
 **/
@Injectable({ providedIn: 'root' })
export class NgRxAuthBridgeService {
	/**
	 * @type {SDKToken}
	 **/
	private token: SDKToken = new SDKToken();
	/**
	 * @type {String}
	 **/
	protected prefix = '$LoopBackSDK$';
	/**
	 * @method constructor
	 * @param {Store<AuthState>} store$ reference to ngrx store
	 * @description
	 * The constructor will subscribe to the the store's token selector to sync the token property accordingly
	 **/
	constructor(private store$: Store<AuthState>) {
		this.store$.select(AuthSelectors.selectToken).subscribe(token => {
			this.token = token ? token : new SDKToken();
		});
	}
	/**
	 * @method setRememberMe
	 * @param {boolean} value Flag to remember credentials
	 * @return {void}
	 * @description
	 * This method will set a flag in order to remember the current credentials
	 **/
	public setRememberMe(value: boolean): void {
		this.token.rememberMe = value;
	}
	/**
	 * @method setUser
	 * @param {any} user Any type of user model
	 * @return {void}
	 * @description
	 * This method will update the user information and persist it if the
	 * rememberMe flag is set.
	 **/
	public setUser(customer: any) {
		this.store$.dispatch(AuthActions.performUpdateCustomer({ customer }));
		// this.token.user = user;
	}
	/**
	 * @method setToken
	 * @param {SDKToken} token SDKToken or casted AccessToken instance
	 * @return {void}
	 * @description
	 * This method will set a flag in order to remember the current credentials
	 **/
	public setToken(token: SDKToken): void {
		this.token = { ...this.token, ...token };
	}
	/**
	 * @method getToken
	 * @return {void}
	 * @description
	 * This method will set a flag in order to remember the current credentials.
	 **/
	public getToken(): SDKToken {
		return this.token;
	}
	/**
	 * @method getAccessTokenId
	 * @return {string}
	 * @description
	 * This method will return the actual token string, not the object instance.
	 **/
	public getAccessTokenId(): string {
		return this.token.id;
	}
	/**
	 * @method getCurrentUserId
	 * @return {any}
	 * @description
	 * This method will return the current user id, it can be number or string.
	 **/
	public getCurrentUserId(): any {
		return this.token.userId;
	}
	/**
	 * @method getCurrentUserData
	 * @return {any}
	 * @description
	 * This method will return the current user instance.
	 **/
	public getCurrentUserData(): any {
		return typeof this.token.user === 'string' ? JSON.parse(this.token.user) : this.token.user;
	}
}
