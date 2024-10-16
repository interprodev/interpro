import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreDetailEffects } from './store-detail.effects';
import * as fromStoreDetail from './store-detail.reducer';

@NgModule({
	imports: [
		CommonModule,
		StoreModule.forFeature(fromStoreDetail.storeDetailFeatureKey, fromStoreDetail.reducer),
		EffectsModule.forFeature([StoreDetailEffects])
	]
})
export class ScoutingEventStoreDetailModule {}
