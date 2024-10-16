import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { SessionAnalysisStoreEffects } from './ngrx/session-analysis-store.effects';
import * as fromSessionAnalysisStore from './ngrx/session-anaysis-store.reducers';

@NgModule({
	imports: [
		CommonModule,
		StoreModule.forFeature(
			fromSessionAnalysisStore.sessionAnalysisStoreFeatureKey,
			fromSessionAnalysisStore.sessionAnalysisreducer
		),
		EffectsModule.forFeature([SessionAnalysisStoreEffects])
	]
})
export class SessionAnalysisStoreModule {}
