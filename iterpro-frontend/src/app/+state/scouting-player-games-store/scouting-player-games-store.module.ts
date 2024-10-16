import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { ScoutingGameEffects } from './ngrx/scouting-player-games-store.effects';
import * as fromScoutingGame from './ngrx/scouting-player-games-store.reducer';

@NgModule({
	declarations: [],
	imports: [
		CommonModule,
		StoreModule.forFeature(fromScoutingGame.scoutingGamesFeatureKey, fromScoutingGame.reducer),
		EffectsModule.forFeature([ScoutingGameEffects])
	]
})
export class ScoutingGameModule {}
