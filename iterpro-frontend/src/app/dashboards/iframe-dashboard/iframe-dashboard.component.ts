import { Component, inject, OnInit } from '@angular/core';
import { AuthSelectors } from '@iterpro/shared/data-access/auth';
import { Club } from '@iterpro/shared/data-access/sdk';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { RootStoreState } from 'src/app/+state/root-store.state';

@Component({
	selector: 'app-iframe-dashboard',
	templateUrl: './iframe-dashboard.component.html',
	styleUrls: ['./iframe-dashboard.component.css']
})
export class IframeDashboardComponent implements OnInit {
	club$: Observable<Club>;
	readonly #store$ = inject(Store<RootStoreState>);

	constructor() {}

	ngOnInit() {
		this.club$ = this.#store$.select(AuthSelectors.selectClub);
	}
}
