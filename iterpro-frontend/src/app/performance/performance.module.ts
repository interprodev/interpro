import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LaunchpadComponent } from '@iterpro/shared/ui/components';
import { PerformanceComponent } from './performance.component';
import { performanceRoutes } from './performance.routes';
import { AsyncPipe } from '@angular/common';

@NgModule({
	imports: [AsyncPipe, RouterModule.forChild(performanceRoutes), LaunchpadComponent],
	declarations: [PerformanceComponent]
})
export class PerformanceModule {}
