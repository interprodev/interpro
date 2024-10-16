import { AsyncPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthSelectors } from '@iterpro/shared/data-access/auth';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { RootStoreState } from 'src/app/+state/root-store.state';

@Component({
	standalone: true,
	imports: [AsyncPipe, TranslateModule],
	selector: 'iterpro-expiring-bar',
	templateUrl: './expiring-bar.component.html',
	styleUrls: ['./expiring-bar.component.css']
})
export class ExpiringBarComponent implements OnInit {
	expiring$: Observable<boolean>;
	expiringDays$: Observable<number>;

	constructor(private readonly store$: Store<RootStoreState>) {}

	ngOnInit() {
		this.expiring$ = this.store$.select(AuthSelectors.selectIsExpiring);
		this.expiringDays$ = this.store$.select(AuthSelectors.selectExpiringDays);
	}
}
