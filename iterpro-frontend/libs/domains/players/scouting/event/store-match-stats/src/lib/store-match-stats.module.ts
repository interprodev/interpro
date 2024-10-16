import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreMatchStatsEffects } from './store-match-stats.effects';
import * as fromStoreMatchStats from './store-match-stats.reducer';

@NgModule({
	imports: [
		CommonModule,
		StoreModule.forFeature(fromStoreMatchStats.storeMatchStatsFeatureKey, fromStoreMatchStats.reducer),
		EffectsModule.forFeature([StoreMatchStatsEffects])
	]
})
export class ScoutingEventStoreMatchStatsModule {}
