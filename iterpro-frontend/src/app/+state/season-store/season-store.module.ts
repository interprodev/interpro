import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import * as fromSeasonStore from './ngrx/season-store.reducer';

@NgModule({
	declarations: [],
	imports: [CommonModule, StoreModule.forFeature(fromSeasonStore.seasonStoresFeatureKey, fromSeasonStore.reducer)]
})
export class SeasonStoreModule {}
