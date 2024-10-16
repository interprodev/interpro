import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ScoutingEventStoreDetailModule } from '@iterpro/players/scouting/event/store-detail';
import { ScoutingEventStoreGameReportListModule } from '@iterpro/players/scouting/event/store-game-report-list';
import { ScoutingEventStoreLineUpModule } from '@iterpro/players/scouting/event/store-line-up';
import { ScoutingEventStoreMatchStatsModule } from '@iterpro/players/scouting/event/store-match-stats';

@NgModule({
	imports: [
		CommonModule,
		ScoutingEventStoreDetailModule,
		ScoutingEventStoreLineUpModule,
		ScoutingEventStoreMatchStatsModule,
		ScoutingEventStoreGameReportListModule
	]
})
export class ScoutingEventSandBoxModule {}
