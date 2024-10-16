import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PlayerProviderWidgetComponent, SideTabsComponent } from '@iterpro/shared/ui/components';
import { ActiveThrFilterPipe, ActiveThrTestFilterPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { AzureStoragePipe } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { SelectableThresholdHeaderComponent } from './components/selectable-threshold-header/selectable-threshold-header.component';
import { SemaphoreInputComponent } from './components/semaphore-input/semaphore-input.component';
import { SemaphoreThresholdInputComponent } from './components/semaphore-threshold-input/semaphore-threshold-input.component';
import { ThresholdSemaphoreDialogComponent } from './components/threshold-semaphore-dialog/threshold-semaphore-dialog.component';
import { ThresholdSemaphoreTypeComponent } from './components/threshold-semaphore-type/threshold-semaphore-type.component';
import { ThresholdTestComponent } from './components/threshold-test/threshold-test.component';
import { ThresholdComponent } from './thresholds.component';
import { SideTabComponent } from '../../../../../libs/shared/ui/components/src/lib/side-tabs/side-tab.component';
import { FormsModule } from '@angular/forms';

@NgModule({
	imports: [
		CommonModule,
		PrimeNgModule,
		TranslateModule,
		PlayerProviderWidgetComponent,
		AzureStoragePipe,
		ActiveThrTestFilterPipe,
		SideTabComponent,
		FormsModule,
		ActiveThrFilterPipe,
		SideTabsComponent
	],
	exports: [
		ThresholdComponent,
		SelectableThresholdHeaderComponent,
		SemaphoreInputComponent,
		SemaphoreThresholdInputComponent,
		ThresholdSemaphoreDialogComponent,
		ThresholdSemaphoreTypeComponent,
		ThresholdTestComponent
	],
	declarations: [
		ThresholdComponent,
		SelectableThresholdHeaderComponent,
		SemaphoreInputComponent,
		SemaphoreThresholdInputComponent,
		ThresholdSemaphoreDialogComponent,
		ThresholdSemaphoreTypeComponent,
		ThresholdTestComponent
	],
	providers: [ActiveThrFilterPipe]
})
export class ThresholdsModule {}
