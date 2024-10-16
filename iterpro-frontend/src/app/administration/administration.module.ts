import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LaunchpadComponent } from '@iterpro/shared/ui/components';
import { AdministrationComponent } from './administration.component';
import { administrationRoutes } from './administration.routes';

@NgModule({
	imports: [CommonModule, RouterModule.forChild(administrationRoutes), LaunchpadComponent],
	exports: [RouterModule],
	declarations: [AdministrationComponent]
})
export class AdministrationModule {}
