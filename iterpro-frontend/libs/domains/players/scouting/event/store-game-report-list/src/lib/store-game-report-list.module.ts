import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreGameReportListEffects } from './store-game-report-list.effects';
import * as fromStoreGameReportList from './store-game-report-list.reducer';

@NgModule({
	imports: [
		CommonModule,
		StoreModule.forFeature(fromStoreGameReportList.storeGameReportListFeatureKey, fromStoreGameReportList.reducer),
		EffectsModule.forFeature([StoreGameReportListEffects])
	]
})
export class ScoutingEventStoreGameReportListModule {}
