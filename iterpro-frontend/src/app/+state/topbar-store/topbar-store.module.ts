import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TopbarStoreReducer, TopbarStoreState } from '.';
import { TopbarStoreEffects } from './ngrx/topbar-store.effects';

@NgModule({
	declarations: [],
	imports: [
		CommonModule,
		StoreModule.forFeature(TopbarStoreState.topbarStoreFeatureKey, TopbarStoreReducer.reducer),
		EffectsModule.forFeature([TopbarStoreEffects])
	]
})
export class TopbarStoreModule {}
