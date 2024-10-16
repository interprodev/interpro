import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { EventViewerStoreEffects } from './ngrx/event-viewer-store.effects';
import * as fromEventViewerStore from './ngrx/event-viewer-store.reducer';
import { eventViewerStoreFeatureKey } from './ngrx/event-viewer-store.state';

@NgModule({
	declarations: [],
	imports: [
		CommonModule,
		StoreModule.forFeature(eventViewerStoreFeatureKey, fromEventViewerStore.reducer),
		EffectsModule.forFeature([EventViewerStoreEffects])
	]
})
export class EventViewerStoreModule {}
