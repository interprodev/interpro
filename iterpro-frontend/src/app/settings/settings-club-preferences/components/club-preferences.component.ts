import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
	standalone: true,
	imports: [RouterModule],
	selector: 'iterpro-club-preferences',
	template: `
		<router-outlet></router-outlet>
	`
})
export class ClubPreferencesComponent {}
