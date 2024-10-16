import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { DrillsProfileStoreEffects } from './ngrx/drills-profile-store.effects';
import * as fromDrillsProfileStore from './ngrx/drills-profile-store.reducer';

@NgModule({
	declarations: [],
	imports: [
		CommonModule,
		StoreModule.forFeature(fromDrillsProfileStore.drillsProfileStoreFeatureKey, fromDrillsProfileStore.reducer),
		EffectsModule.forFeature([DrillsProfileStoreEffects])
	]
})
export class DrillsProfileStoreModule {}
