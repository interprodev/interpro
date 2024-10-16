import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LaunchpadComponent } from '@iterpro/shared/ui/components';
import { ProfileComponent } from './profile.component';
import { profileRoutes } from './profile.routes';

@NgModule({
	imports: [CommonModule, RouterModule.forChild(profileRoutes), LaunchpadComponent],
	declarations: [ProfileComponent]
})
export class ProfileModule {}
