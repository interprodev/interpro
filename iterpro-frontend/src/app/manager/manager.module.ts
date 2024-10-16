import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LaunchpadComponent } from '@iterpro/shared/ui/components';
import { ManagerComponent } from './manager.component';
import { managerRoutes } from './manager.routes';
import { ButtonModule } from 'primeng/button';
import { AsyncPipe } from '@angular/common';

@NgModule({
	imports: [AsyncPipe, RouterModule.forChild(managerRoutes), LaunchpadComponent, ButtonModule],
	declarations: [ManagerComponent]
})
export class ManagerModule {}
