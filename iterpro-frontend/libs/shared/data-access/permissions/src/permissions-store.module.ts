import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { PermissionsReducer } from './+state';
import { permissionsStoreFeatureKey } from './+state/store-permissions.state';

@NgModule({
	declarations: [],
	imports: [CommonModule, StoreModule.forFeature(permissionsStoreFeatureKey, PermissionsReducer.reducer)]
})
export class PermissionsStoreModule {}
