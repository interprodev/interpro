import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import * as fromCashFlowStore from './cash-flow-store.state';
import { EffectsModule } from '@ngrx/effects';
import { CashFlowStoreEffects } from './cash-flow-store.effects';
import { reducer } from './cash-flow-store.reducer';

@NgModule({
	declarations: [],
	imports: [
		CommonModule,
		StoreModule.forFeature(fromCashFlowStore.cashFlowStoreFeatureKey, reducer),
		EffectsModule.forFeature([CashFlowStoreEffects])
	]
})
export class CashFlowStoreModule {}
