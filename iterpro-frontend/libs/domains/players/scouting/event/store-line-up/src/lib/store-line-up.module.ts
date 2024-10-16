import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreMatchLineUpEffects } from './store-line-up.effects';
import * as fromStoreMatchLineUp from './store-line-up.reducer';

@NgModule({
	imports: [
		CommonModule,
		StoreModule.forFeature(fromStoreMatchLineUp.storeMatchLineUpFeatureKey, fromStoreMatchLineUp.reducer),
		EffectsModule.forFeature([StoreMatchLineUpEffects])
	]
})
export class ScoutingEventStoreLineUpModule {}
