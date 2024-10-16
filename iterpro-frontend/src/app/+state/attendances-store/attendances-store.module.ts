import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { AttendancesStoreEffects } from './ngrx/attendances-store.effects';
import { reducer } from './ngrx/attendances-store.reducer';
import { attendancesStoresFeatureKey } from './ngrx/attendances-store.state';

@NgModule({
	declarations: [],
	imports: [
		CommonModule,
		StoreModule.forFeature(attendancesStoresFeatureKey, reducer),
		EffectsModule.forFeature([AttendancesStoreEffects])
	]
})
export class AttendancesStoreModule {}
