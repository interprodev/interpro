import { AsyncPipe, NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthSelectors, CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { IterproOrgType, IterproRoute, PermissionsService } from '@iterpro/shared/data-access/permissions';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { MegaMenuItem } from 'primeng/api';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { RootStoreState } from 'src/app/+state/root-store.state';
import { items } from './config/navbar-items';
import { Club, Team } from '@iterpro/shared/data-access/sdk';
import { distinctUntilChanged } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

@Component({
	standalone: true,
	imports: [NgClass, AsyncPipe, RippleModule, RouterModule, TranslateModule, StyleClassModule],
	selector: 'iterpro-navbar',
	templateUrl: './navbar.component.html',
	styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
	// isDashboardAllowed$: Observable<boolean>;
	hideDisabledModules = false;

	items: MegaMenuItem[] = [];

	constructor(
		private readonly store$: Store<RootStoreState>,
		private readonly permissionsService: PermissionsService,
		private readonly currentTeamService: CurrentTeamService
	) {}

	ngOnInit() {
		// this.isDashboardAllowed$ = this.store$.select(TopbarStoreSelectors.selectDashboardAllowed);
		combineLatest([
			this.store$.select(AuthSelectors.selectCurrentSelectableTeam),
			this.store$.select(AuthSelectors.selectIsNationalClub),
			this.store$.select(AuthSelectors.selectOrganizationType),
			this.store$.select(AuthSelectors.selectClub)
		])
			.pipe(distinctUntilChanged())
			.subscribe({
				next: ([team, isNational, orgType, club]: [Team, boolean, IterproOrgType, Club]) => {
					// TODO: in the future, move this in the topbar store and load it from the server
					this.items = this.embedWithPermissions([...items], team, isNational, club);
					this.hideDisabledModules = orgType === 'agent';
				}
			});
	}

	private canAccessToRoute(route: IterproRoute, team?: Team): boolean {
		const currentTeam = team || this.currentTeamService.getCurrentTeam();
		return this.permissionsService.canAccessToRoute(route, currentTeam);
	}

	private embedWithPermissions(items: MegaMenuItem[], team: Team, isNational: boolean, club: Club): MegaMenuItem[] {
		items.forEach((item: MegaMenuItem) => {
			item.disabled = !this.canAccessToRoute(item.routerLink, team);
			item.visible = !(this.hideDisabledModules && item.disabled);
			item.items[0].forEach((child: MegaMenuItem) => {
				child.disabled = child.id === 'standings' ? isNational : !this.canAccessToRoute(child.routerLink, team);
				child.visible = !(this.hideDisabledModules && child.disabled) && this.isCustomDashboard(child.id, club);
			});
		});
		return items;
	}

	// NOTE: temp function for SAS custom dashboard - https://iterpro.atlassian.net/browse/IT-7649
	private isCustomDashboard(id: string, club: Club): boolean {
		if (id !== 'custom-dashboard') return true;
		return !!club?.customDashboardUrl;
	}
}
