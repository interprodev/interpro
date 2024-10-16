import { AsyncPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthActions } from '@iterpro/shared/data-access/auth';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { Observable } from 'rxjs';
import { TopbarStoreSelectors } from 'src/app/+state';
import { RootStoreState } from '../../+state/root-store.state';
import { ChangeTeamComponent } from './change-team/change-team.component';
import { ExpiringBarComponent } from './expiring-bar/expiring-bar.component';
import { IconsBarComponent } from './icons-bar/icons-bar.component';
import { NavbarComponent } from './navbar/navbar.component';
import { TranslateModule } from '@ngx-translate/core';

// TODO: to activate the changeNotification.onPush we need to implement ngrx to:
// - show/hide the submenus

@UntilDestroy()
@Component({
	standalone: true,
	imports: [
		AsyncPipe,
		RouterModule,
		RippleModule,
		StyleClassModule,
		ExpiringBarComponent,
		ChangeTeamComponent,
		NavbarComponent,
		IconsBarComponent,
		TranslateModule
	],
	selector: 'iterpro-topbar',
	templateUrl: './topbar.component.html',
	styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent implements OnInit {
	readonly #store$ = inject(Store<RootStoreState>);
	landingPage$: Observable<string>;

	ngOnInit() {
		this.#store$.dispatch(AuthActions.loadTeamList());
		this.landingPage$ = this.#store$.select(TopbarStoreSelectors.selectLandingPage);
	}
}
