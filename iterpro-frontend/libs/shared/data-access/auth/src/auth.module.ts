import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { AuthEffects, AuthReducers } from './+state';
import { authStoreFeatureKey } from './+state/auth.state';
import { AuthService } from './services/auth.service';
import { CookieStorageService } from './services/cookie-storage.service';

/**
 * @author Adriano Costa <email:adriano.costa@iterpro.com>
 * @feature Auth
 * @description
 * if a token is present it will be removed from cookies and server
 *
 * When the user click submit
 * -> check credentials
 *   ## Two factor authentication (2FA) not enable
 *     -> show qr code, require google auth secret code
 *   ## 2FA enabled
 *     -> require 2FA, check google auth secret code
 *   -> store sdkToken
 *   -> store customer
 *   -> store sas Token key
 *   -> store current Team and current Season
 *   -> redirect to route
 *
 **/

@NgModule({
	declarations: [],
	imports: [
		CommonModule,
		StoreModule.forFeature(authStoreFeatureKey, AuthReducers.reducer),
		EffectsModule.forFeature([AuthEffects])
	],
	providers: [AuthService, CookieStorageService]
})
export class AuthModule {}
