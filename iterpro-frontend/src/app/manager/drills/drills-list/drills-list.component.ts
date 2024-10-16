import { Component } from '@angular/core';

type DrillViews = 'Cards' | 'Table';

@Component({
	selector: 'iterpro-drills-list',
	templateUrl: 'drills-list.component.html'
})
export class DrillsListComponent {
	viewMode: DrillViews = 'Cards';
}
