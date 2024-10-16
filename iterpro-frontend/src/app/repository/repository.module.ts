import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RepositoryComponent } from './repository.component';
import { MultipleFileUploadComponent } from '@iterpro/shared/feature-components';
import { authGuard } from '@iterpro/shared/data-access/auth';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
	{
		path: '',
		component: RepositoryComponent,
		canActivate: [authGuard]
	}
];

@NgModule({
	imports: [CommonModule, RouterModule.forChild(routes), MultipleFileUploadComponent],
	declarations: [RepositoryComponent]
})
export class RepositoryModule {}
