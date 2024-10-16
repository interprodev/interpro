import { NgModule } from '@angular/core';
import { DrillsStatsEffects, drillsStatsFeature } from '@iterpro/manager/drills/stats/data-access';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

@NgModule({
	imports: [StoreModule.forFeature(drillsStatsFeature), EffectsModule.forFeature([DrillsStatsEffects])]
})
export class DrillsStatsModule {}
