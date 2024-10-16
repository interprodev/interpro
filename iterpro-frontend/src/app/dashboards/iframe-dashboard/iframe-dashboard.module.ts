import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IframeDashboardComponent } from './iframe-dashboard.component';
import { authGuard } from '@iterpro/shared/data-access/auth';
import { RouterModule, Routes } from '@angular/router';
import { SafePipe } from '@iterpro/shared/ui/pipes';

const routes: Routes = [
	{
		path: '',
		component: IframeDashboardComponent,
		canActivate: [authGuard]
	}
];

@NgModule({
	imports: [RouterModule.forChild(routes), CommonModule, SafePipe],
	declarations: [IframeDashboardComponent]
})
export class IframeDashboardModule {}
