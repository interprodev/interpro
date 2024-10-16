import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { routerReducer } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { routeStoreFeatureKey } from './ngrx/route-store.state';

@NgModule({
	declarations: [],
	imports: [CommonModule, StoreModule.forFeature(routeStoreFeatureKey, routerReducer)]
})
export class RouteStoreModule {}
