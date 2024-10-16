import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { ImportStoreEffects } from './ngrx/import-store.effects';
import * as fromImportStore from './ngrx/import-store.reducer';

/**
 * @author Adriano Costa <email:adriano.costa@iterpro.com>
 * @feature Import Wizard for Mapping Sessions to Drills
 * @description
 * Three step Wizard to:
 * - import gps data from file or provider;
 * - map session names to existent drill or create a new one;
 * - upload session with drill association
 *
 **/

// COMMANDS TO GENERATE THE ENTITY FEATURE TEMPLATE:
// ng g module _root-store/import-store --flat false -m _root-store/root-store.module.ts
// ng g entity _root-store/import-store -m import-store --flat false -c true
// ng generate ef _root-store/import-store --flat false -m _root-store/import-store -c true
@NgModule({
	declarations: [],
	imports: [
		CommonModule,
		StoreModule.forFeature(fromImportStore.importStoresFeatureKey, fromImportStore.reducer),
		EffectsModule.forFeature([ImportStoreEffects])
	]
})
export class ImportStoreModule {}
